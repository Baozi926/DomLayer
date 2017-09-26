define([
  "dojo/_base/lang",
  "dojo/_base/declare",
  "dojo/_base/array",
  "esri/Color",
  "dojo/_base/connect",

  "esri/core/Accessor",
  "esri/geometry/SpatialReference",
  "esri/geometry/Point",
  "esri/Graphic",
  "esri/renderers/ClassBreaksRenderer",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/TextSymbol",
  "esri/symbols/PictureMarkerSymbol",

  "esri/PopupTemplate",
  "esri/layers/GraphicsLayer",
  "esri/layers/FeatureLayer",
  "modules/monitorView/monitor/mTable"
], function (
  lang, declare, arrayUtils, Color, connect, Accessor,
  SpatialReference, Point, Graphic, ClassBreaksRenderer, SimpleMarkerSymbol, TextSymbol, PictureMarkerSymbol,
  PopupTemplate, GraphicsLayer, FeatureLayer, mTable
) {
  return GraphicsLayer.createSubclass({
    // declaredClass: "esri.layers.ClusterLayer",
    constructor: function (options) {
      // options:
      //   data:  Object[]
      //     Array of objects. Required. Object are required to have properties named x, y and attributes. The x and y coordinates have to be numbers that represent a points coordinates.
      //   distance:  Number?
      //     Optional. The max number of pixels between points to group points in the same cluster. Default value is 50.
      //   labelColor:  String?
      //     Optional. Hex string or array of rgba values used as the color for cluster labels. Default value is #fff (white).
      //   labelOffset:  String?
      //     Optional. Number of pixels to shift a cluster label vertically. Defaults to -5 to align labels with circle symbols. Does not work in IE.
      //   resolution:  Number
      //     Required. Width of a pixel in map coordinates. Example of how to calculate: 
      //     map.extent.getWidth() / map.width
      //   showSingles:  Boolean?
      //     Optional. Whether or graphics should be displayed when a cluster graphic is clicked. Default is true.
      //   singleSymbol:  MarkerSymbol?
      //     Marker Symbol (picture or simple). Optional. Symbol to use for graphics that represent single points. Default is a small gray SimpleMarkerSymbol.
      //   singleTemplate:  PopupTemplate?
      //     PopupTemplate</a>. Optional. Popup template used to format attributes for graphics that represent single points. Default shows all attributes as "attribute = value" (not recommended).
      //   maxSingles:  Number?
      //     Optional. Threshold for whether or not to show graphics for points in a cluster. Default is 1000.
      //   webmap:  Boolean?
      //     Optional. Whether or not the map is from an ArcGIS.com webmap. Default is false.
      //   spatialReference:  SpatialReference?
      //     Optional. Spatial reference for all graphics in the layer. This has to match the spatial reference of the map. Default is 102100. Omit this if the map uses basemaps in web mercator.
      this._renderColorLine = options.renderColorLine || [];
      this._renderColorFill = options.renderColorFill || [];

      this.definitionExpression = options.definitionExpression;
      this._clusterTolerance = options.distance || 50;
      this._clusterData = options.data || [];
      this._clusters = [];
      this._clusterLabelColor = options.labelColor || "#000";
      // labelOffset can be zero so handle it differently
      this._clusterLabelOffset = (options.hasOwnProperty("labelOffset")) ? options.labelOffset : -3;
      // graphics that represent a single point
      this._singles = []; // populated when a graphic is clicked
      this._showSingles = options.hasOwnProperty("showSingles") ? options.showSingles : true;
      // symbol for single graphics
      var SMS = SimpleMarkerSymbol;
      this._singleSym = options.singleSymbol || new SMS("circle", 6, null, new Color("#888"));
      this._singleTemplate = options.singleTemplate || new PopupTemplate({
        "title": "",
        "description": "{*}"
      });
      this._maxSingles = options.maxSingles || 10000;

      this._webmap = options.hasOwnProperty("webmap") ? options.webmap : false;

      this._sr = options.spatialReference || new SpatialReference({
        "wkid": 102100
      });

      this._zoomEnd = null;
      this.url = options.url; //ls
      this.layerId = options.layerId; //ls
      this.ifLonLatData(); //ls
    },

    load: function () {

    },
    /*ls*/
    ifLonLatData: function () {

      //this._clusterGraphics();
    },

    // override esri/layers/GraphicsLayer methods 
    // _setMap: function(map, surface) {
    createGraphicsController: function (e) {
      var mapView = this._mapView = e.layerView.view;
      // calculate and set the initial resolution
      this._clusterResolution = mapView.extent.width / mapView.width; // probably a bad default...
      this._clusterGraphics();

      // connect to onZoomEnd so data is re-clustered when zoom level changes
      // this._zoomEnd = connect.connect(mapView, "mouse-wheel", this, function() {
      // this._zoomEnd = mapView.on("mouse-wheel", lang.hitch(this, function() {
      this._zoomEnd = mapView.watch("zoom", lang.hitch(this, function (newValue, oldValue, propertyName, target) {
        // 事件会执行两次，newValue是整数时zoomEnd，newValue是浮点数时zoomStart
        if ((newValue | 0) == newValue) {
          // update resolution
          this._clusterResolution = this._mapView.extent.width / this._mapView.width;
          this.removeAll();
          this._clusterGraphics();
        }
      }));

      this._onClick = mapView.on("click", function (evt) {
        evt.stopPropagation();
        var screenPoint = {
          x: evt.x,
          y: evt.y
        };
        mapView.hitTest(screenPoint)
          .then(function (response) {

            this.onClick(response.results[0]);
          }.bind(this));
      }.bind(this));

      // GraphicsLayer will add its own listener here
      var div = this.inherited(arguments);
      return div;
    },

    graphicChanged: function (a) {
      this.emit("graphic-update", a)
    },

    _unsetMap: function () {
      this.inherited(arguments);
      connect.disconnect(this._zoomEnd);
    },

    // public ClusterLayer methods
    add: function (p) {
      // Summary:    The argument is a data point to be added to an existing cluster. If the data point falls within an existing cluster, it is added to that cluster and the cluster's label is updated. If the new point does not fall within an existing cluster, a new cluster is created.
      //
      // if passed a graphic, use the GraphicsLayer's add method
      if (p.declaredClass) {
        this.inherited(arguments);
        return this;
      }

      // add the new data to _clusterData so that it's included in clusters when the map level changes
      this._clusterData.push(p);
      var clustered = false;
      // look for an existing cluster for the new point
      for (var i = 0; i < this._clusters.length; i++) {
        var c = this._clusters[i];
        if (this._clusterTest(p, c)) {
          // add the point to an existing cluster
          this._clusterAddPoint(p, c);
          // update the cluster's geometry
          this._updateClusterGeometry(c);
          // update the label
          this._updateLabel(c);
          clustered = true;
          break;
        }
      }

      if (!clustered) {
        this._clusterCreate(p);
        p.attributes.clusterCount = 1;
        this._showCluster(p);
      }
    },

    removeAll: function () {
      // Summary:  Remove all clusters and data points.
      this.inherited(arguments);
      this._clusters.length = 0;
      return this;
    },

    clearSingles: function (singles) {
      // Summary: Remove graphics that represent individual data points.
      var s = singles || this._singles;
      arrayUtils.forEach(s, function (g) {
        this.remove(g);
      }, this);
      this._singles.length = 0;
    },

    onClick: function (e) {

      // remove any previously showing single features

      this.clearSingles(this._singles);

      // find single graphics that make up the cluster that was clicked
      // would be nice to use filter but performance tanks with large arrays in IE
      var singles = [];
      for (var i = 0, il = this._clusterData.length; i < il; i++) {
        if (e.graphic.attributes.clusterId == this._clusterData[i].attributes.clusterId) {
          singles.push(this._clusterData[i]);
        }
      }
      if (e.graphic.attributes.STNM) this._showPopup_ls(e); //ls
      else this._showPopup2_ls(singles, e); //ls

      if (singles.length > this._maxSingles) {
        alert("Sorry, that cluster contains more than " + this._maxSingles + " points. Zoom in for more detail.");
        return;
      } else {
        // stop the click from bubbling to the map
        // e.stopPropagation();
        // this._map.infoWindow.show(e.graphic.geometry);
        this._addSingles(singles);
      }

    },
    _showPopup_ls: function (e) {
      var str = e.graphic.attributes.STNM + " " + e.graphic.attributes.STTP;
      this._mapView.popup.title = e.graphic.popupTemplate != null && e.graphic.popupTemplate.title != "{STNM}" ? e.graphic.popupTemplate.title : str;
      this._openPopup_ls('', e.mapPoint);
    },
    _showPopup2_ls: function (singles, e) {
      if (singles.length == 0) return;
      var table = new mTable({
        "returnStrOnly": true
      });
      var data = [];

      var str = table._getTableHtml(singles);
      this._mapView.popup.title = "共有测站：" + e.graphic.attributes.clusterCount;
      this._openPopup_ls(str, e.mapPoint);
      /*
      
      var str = '<table class="grid monitor"cellspacing="0"cellpadding="0"width="100%"border="0"><tbody>';
      for(var i=0; i<singles.length; i++){
          
      }
      */
    },
    _openPopup_ls: function (str, poi) {
      this._mapView.popup.content = str;
      this._mapView.popup.location = poi;
      this._mapView.popup.visible = true;
    },
    // internal methods 
    _clusterGraphics: function () {
      // first time through, loop through the points
      for (var j = 0, jl = this._clusterData.length; j < jl; j++) {
        // see if the current feature should be added to a cluster
        var point = this._clusterData[j];
        var clustered = false;
        var numClusters = this._clusters.length;
        for (var i = 0; i < this._clusters.length; i++) {
          var c = this._clusters[i];
          if (this._clusterTest(point, c)) {
            this._clusterAddPoint(point, c);
            clustered = true;
            break;
          }
        }

        if (!clustered) {
          this._clusterCreate(point);
        }
      }
      this._showAllClusters();
    },

    _clusterTest: function (p, cluster) {
      var distance = (
        Math.sqrt(
          Math.pow((cluster.x - p.x), 2) + Math.pow((cluster.y - p.y), 2)
        ) / this._clusterResolution
      );
      return (distance <= this._clusterTolerance);
    },

    // points passed to clusterAddPoint should be included 
    // in an existing cluster
    // also give the point an attribute called clusterId 
    // that corresponds to its cluster
    _clusterAddPoint: function (p, cluster) {
      // average in the new point to the cluster geometry
      var count, x, y;
      count = cluster.attributes.clusterCount;
      x = (p.x + (cluster.x * count)) / (count + 1);
      y = (p.y + (cluster.y * count)) / (count + 1);
      cluster.x = x;
      cluster.y = y;

      // build an extent that includes all points in a cluster
      // extents are for debug/testing only...not used by the layer
      if (p.x < cluster.attributes.extent[0]) {
        cluster.attributes.extent[0] = p.x;
      } else if (p.x > cluster.attributes.extent[2]) {
        cluster.attributes.extent[2] = p.x;
      }
      if (p.y < cluster.attributes.extent[1]) {
        cluster.attributes.extent[1] = p.y;
      } else if (p.y > cluster.attributes.extent[3]) {
        cluster.attributes.extent[3] = p.y;
      }

      // increment the count
      cluster.attributes.clusterCount++;
      // attributes might not exist
      if (!p.hasOwnProperty("attributes")) {
        p.attributes = {};
      }
      // give the graphic a cluster id
      p.attributes.clusterId = cluster.attributes.clusterId;
    },

    // point passed to clusterCreate isn't within the 
    // clustering distance specified for the layer so
    // create a new cluster for it
    _clusterCreate: function (p) {
      var clusterId = this._clusters.length + 1;
      // console.log("cluster create, id is: ", clusterId);
      // p.attributes might be undefined
      if (!p.attributes) {
        p.attributes = {};
      }
      p.attributes.clusterId = clusterId;
      // create the cluster
      var cluster = {
        "x": p.x,
        "y": p.y,
        "attributes": {
          "clusterCount": 1,
          "clusterId": clusterId,
          "extent": [p.x, p.y, p.x, p.y],
          "gras": p.attributes
        }
      };
      this._clusters.push(cluster);
    },

    _showAllClusters: function () {
      for (var i = 0, il = this._clusters.length; i < il; i++) {
        var c = this._clusters[i];
        this._showCluster(c);
      }
    },

    _getSymbol: function (c) {
      var renderer = this._getRenderer();
      var breakInfos = renderer.classBreakInfos.filter(function (item) {
        if (c.attributes.clusterCount >= item.minValue && c.attributes.clusterCount < item.maxValue) {
          return true;
        }
      });

      return breakInfos.length == 1 ? breakInfos[0].symbol : renderer.defaultSymbol;
    },

    _getRenderer: function () {
      var renderer;
      /*var breaks, gNum = this._clusterData.length,
          cNum = this._clusters.length;

      if(gNum > 5) {
        // 概率计算
        breaks = [2, Math.floor(gNum / 3), 4, 5]
      } else {
        breaks = [2, 3, 4, 5];
      }*/

      renderer = new ClassBreaksRenderer({
        field: "clusterCount",

        defaultSymbol: new SimpleMarkerSymbol({
          style: "circle",
          color: [255, 255, 255, 1],
          size: "16px",
          outline: {
            color: [102, 0, 0, 0.55],
            width: 3
          }
        }),
        classBreakInfos: [{
          minValue: 2,
          maxValue: 10,
          symbol: new SimpleMarkerSymbol({
            style: "circle",
            color: this._renderColorFill[0] || [20, 230, 20, 0.75],
            size: "15px",
            outline: {
              color: this._renderColorLine[0] || [20, 230, 20, 0.35],
              width: 6
            }
          })
        }, {
          minValue: 10,
          maxValue: 25,
          symbol: new SimpleMarkerSymbol({
            style: "circle",
            color: this._renderColorFill[1] || [40, 230, 40, 0.75],
            size: "25px",
            outline: {
              color: this._renderColorLine[1] || [40, 230, 40, 0.35],
              width: 6
            }
          })
        }, {
          minValue: 25,
          maxValue: 100,
          symbol: new SimpleMarkerSymbol({
            style: "circle",
            color: this._renderColorFill[2] || [60, 230, 60, 0.75],
            size: "35px",
            outline: {
              color: this._renderColorLine[2] || [60, 230, 60, 0.35],
              width: 6
            }
          })
        }, {
          minValue: 100,
          maxValue: Infinity,
          symbol: new SimpleMarkerSymbol({
            style: "circle",
            color: this._renderColorFill[3] || [80, 230, 80, 0.75],
            size: "45px",
            outline: {
              color: this._renderColorLine[3] || [80, 230, 80, 0.35],
              width: 6
            }
          })
        }]
      });

      return renderer;
    },

    _showCluster: function (c) {
      var point = new Point({
        x: c.x,
        y: c.y,
        spatialReference: this._sr
      });

      var symbol;
      if (c.attributes.clusterCount === 1) {
        switch (c.attributes.gras.STTP) {
          case 'PP':
            symbol = new PictureMarkerSymbol({
              url: "app/modules/monitorView/monitor/images/pp.png",
              width: "8px",
              height: "8px"
            });
            break;
          case 'ZZ':
            symbol = new PictureMarkerSymbol({
              url: "app/modules/monitorView/monitor/images/zz.png",
              width: "8px",
              height: "16px"
            });
            break;
          case 'RR':
            symbol = new PictureMarkerSymbol({
              url: "app/modules/monitorView/monitor/images/rr.png",
              width: "7px",
              height: "19px"
            });
            break;
          case 'ZQ':
            symbol = new PictureMarkerSymbol({
              url: "app/modules/monitorView/monitor/images/zq.png",
              width: "8px",
              height: "16px"
            });
            break;
          case 'ZG':
            symbol = new PictureMarkerSymbol({
              url: "app/modules/monitorView/monitor/images/zg.png",
              width: "23px",
              height: "23px"
            });
            break;
          case 'SS':
            symbol = new PictureMarkerSymbol({
              url: "app/modules/monitorView/monitor/images/ss.png",
              width: "19px",
              height: "19px"
            });
            break;
          default:
            symbol = this._getSymbol(c);
            break;
        }
      } else {
        symbol = this._getSymbol(c);
      }

      this.add(
        new Graphic({
          geometry: point,
          attributes: c.attributes,
          symbol: symbol,
          popupTemplate: this._singleTemplate
        })
      );
      // code below is used to not label clusters with a single point
      if (c.attributes.clusterCount == 1) {
        return;
      }

      // show number of points in the cluster
      var label = new TextSymbol({
        font: {
          size: 12,
          family: "微软雅黑",
          weight: "bolder"
        },
        text: c.attributes.clusterCount.toString(),
        color: this._clusterLabelColor,
        xoffset: 0,
        yoffset: this._clusterLabelOffset
      });
      /*
            var label = new TextSymbol(c.attributes.clusterCount.toString())
              .setColor(new Color(this._clusterLabelColor))
              .setOffset(0, this._clusterLabelOffset);
      */
      this.add(
        new Graphic({
          geometry: point,
          attributes: c.attributes,
          symbol: label
        })
      );
    },

    _addSingles: function (singles) {
      // add single graphics to the map
      arrayUtils.forEach(singles, function (p) {
        var g = new Graphic({
          geometry: new Point(p.x, p.y, this._sr),
          attributes: p.attributes,
          symbol: this._singleSym,
          popupTemplate: this._singleTemplate
        });
        this._singles.push(g);
        if (this._showSingles) {
          this.add(g);
        }
      }, this);
      this._map.infoWindow.setFeatures(this._singles);
    },

    _updateClusterGeometry: function (c) {
      // find the cluster graphic
      var cg = arrayUtils.filter(this.graphics, function (g) {
        return !g.symbol &&
          g.attributes.clusterId == c.attributes.clusterId;
      });
      if (cg.length == 1) {
        cg[0].geometry.update(c.x, c.y);
      } else {
        console.log("didn't find exactly one cluster geometry to update: ", cg);
      }
    },

    _updateLabel: function (c) {
      // find the existing label
      var label = arrayUtils.filter(this.graphics, function (g) {
        return g.symbol &&
          g.symbol.declaredClass == "esri.symbol.TextSymbol" &&
          g.attributes.clusterId == c.attributes.clusterId;
      });
      if (label.length == 1) {
        // console.log("update label...found: ", label);
        this.remove(label[0]);
        var newLabel = new TextSymbol(c.attributes.clusterCount)
          .setColor(new Color(this._clusterLabelColor))
          .setOffset(0, this._clusterLabelOffset);
        this.add(
          new Graphic({
            geometry: new Point(c.x, c.y, this._sr),
            symbol: newLabel,
            attributes: c.attributes
          })
        );
        // console.log("updated the label");
      } else {
        console.log("didn't find exactly one label: ", label);
      }
    },

    // debug only...never called by the layer
    _clusterMeta: function () {
      // print total number of features
      console.log("Total:  ", this._clusterData.length);

      // add up counts and print it
      var count = 0;
      arrayUtils.forEach(this._clusters, function (c) {
        count += c.attributes.clusterCount;
      });
      console.log("In clusters:  ", count);
    }

  });
});