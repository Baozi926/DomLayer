/**
 * Created by Caihm on 2017/5/10.
 */

var map;
var view;
// var s;
var test;
// var layer;

require([
  'dojo/parser',
  'dojo/dom-class',
  'dojo/dom-construct',
  'dojo/on',
  'dojo/_base/lang',
  'esri/Map',
  'esri/views/MapView',
  'esri/request',
  'esri/geometry/Point',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleFillSymbol',
  'esri/geometry/support/webMercatorUtils',
  'esri/Graphic',
  'esri/geometry/support/jsonUtils',
  // 'widgets/MyPopup',
  'esri/PopupTemplate',
  'layer/DomLayer',
  'dojo/domReady!'
], function(
  parser,
  domClass,
  domConstruct,
  on,
  lang,
  Map,
  MapView,
  esriRequest,
  Point,
  SimpleMarkerSymbol,
  SimpleFillSymbol,
  webMercatorUtils,
  Graphic,
  geometryUtils,
  // MyPopup,
  PopupTemplate,
  DivLayer
) {
  map = new Map({ basemap: 'streets' });
  view = new MapView({
    container: 'mapishere', // Reference to the scene div created in step 5
    map: map, // Reference to the map object created before the scene
    zoom: 4, // Sets zoom level based on level of detail (LOD)
    center: [15, 65]
  });

  view.when(function() {
    console.log('view loaded');

    test = new DivLayer();

    view.map.add(test);
    console.log('data length', window.cities.features.length);

    window.cities.features.forEach(city => {
      var coordinates = city.geometry.coordinates;
      var cityName = city.properties.name;
      var cityPop = city.properties.pop_max;

      var point = new Point({
        latitude: coordinates[1],
        longitude: coordinates[0],
        spatialReference: view.spatialReference
      });

      var dom = domConstruct.create('div', {
        innerHTML: `<p class="title">${cityName}</p><p class="content">${cityPop}</p>`,
        className: 'chm-marker',
        style: ''
      });

      test.add({
        dom: dom,
        geometry: point
      });

      window.test = test;

      view.graphics.add(
        new Graphic({
          geometry: point,
          symbol: {
            type: 'simple-marker', // autocasts as new SimpleMarkerSymbol()
            style: 'circle',
            color: 'red',
            size: '8px', // pixels
            outline: {
              // autocasts as new SimpleLineSymbol()
              color: [255, 255, 255, 0.8],
              width: 2 // points
            }
          }
        })
      );
    });

    // var points = [
    //   new Point({
    //     x: 6861195.48427877,
    //     y: 4941642.924353667,
    //     spatialReference: view.spatialReference
    //   }),
    //   new Point({
    //     x: 3690175.8935323115,
    //     y: 7798342.680140892,
    //     spatialReference: view.spatialReference
    //   }),
    //   view.extent.center.clone()
    // ];

    // points.forEach(point => {
    //   var dom = domConstruct.create('div', {
    //     style: 'height:60px;width:150px;background-color:red;opacity:0.5'
    //   });

    //   test.add({
    //     dom: dom,
    //     geometry: point
    //   });

    //   view.graphics.add(
    //     new Graphic({
    //       geometry: point,
    //       symbol: {
    //         type: 'simple-marker', // autocasts as new SimpleMarkerSymbol()
    //         style: 'square',
    //         color: 'blue',
    //         size: '8px', // pixels
    //         outline: {
    //           // autocasts as new SimpleLineSymbol()
    //           color: [255, 255, 0],
    //           width: 3 // points
    //         }
    //       }
    //     })
    //   );
    // });
  });
});
