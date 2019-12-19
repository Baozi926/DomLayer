define([
  'dojo/_base/declare',
  'dojo/dom-class',
  'dojo/dom-style',
  'dojo/Deferred',
  'dojo/Evented',
  'esri/layers/Layer',
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/on',
  'dojo/dom-geometry',
  'esri/geometry/geometryEngine',
  'esri/core/watchUtils'
], function(
  declare,
  domClass,
  domStyle,
  Deferred,
  Evented,
  Layer,
  domConstruct,
  lang,
  arrayUtil,
  on,
  domGeometry,
  geometryEngine,
  watchUtils
) {
  var clazz = Layer.createSubclass([], {
    constructor: function(options) {
      options = options || {};
      this.divLayerClass = 'div-layer';
      this.popupEnabled = false;
      this.legendEnabled = false;
      this.direction = options.direction;
      this._displayDiv = domConstruct.create('div', {
        innerHTML: '',
        style:
          'width:100%;height:100%;position: absolute;top: 0px;right: 0px;left: 0px;bottom: 0px;transition:opacity 0.3s',
        className: this.divLayerClass
      });
    },

    DIRECTION: ['bottom-right', 'top-mid', 'center'],
    direction: 'center',

    declaredClass: 'caihm.DivLayer',

    createLayerView: function(view) {
      this._mapView = view;
      var surface = this._mapView.surface;
      domConstruct.place(this._displayDiv, surface);

      this.bindEvents();

      if (view.type === '3d') {
        alert('not implemented for 3d');
      }
    },

    _startDragPosition: null,
    transformOffset: {
      x: 0,
      y: 0
    },

    calcTransform() {
      var matrix = new window.WebKitCSSMatrix(
        window.getComputedStyle(this._displayDiv).webkitTransform
      );
      var x = matrix.e;
      var y = matrix.f;

      this.transformOffset = {
        x: x,
        y: y
      };
      return this.transformOffset;
    },

    bindEvents: function() {
      this.events = [];

      // this.events.push(
      //   on(
      //     this._mapView,
      //     'resize',
      //     lang.hitch(this, function() {
      //       console.log('map resize');
      //       this.refresh();
      //     })
      //   )
      // );

      this.events.push(
        watchUtils.pausable(
          this._mapView,
          'stationary',
          (isStationary, b, c, view) => {
            if (isStationary) {
              console.log('map stationary');
              this.refresh();
              // domStyle.set(this._displayDiv, 'opacity', 1);
            } else {
              // domStyle.set(this._displayDiv, 'opacity', 0);
            }
          }
        )
      );

      this.events.push(
        this._mapView.on(
          'drag',
          lang.hitch(this, function(evt) {
            if (evt.action === 'start') {
              this._startDragPosition = evt;
              this.calcTransform();
              evt.x = evt.x - this.transformOffset.x;
              evt.y = evt.y - this.transformOffset.y;
            } else if (evt.action === 'end') {
              console.log('drag end');
            } else {
              if (this._startDragPosition) {
                var dx = evt.x - this._startDragPosition.x;
                var dy = evt.y - this._startDragPosition.y;
                var translate = 'translate(' + dx + 'px,' + dy + 'px)';
                domStyle.set(this._displayDiv, 'transform', translate);
              }
            }
          })
        )
      );
    },

    destroyLayerView: function(param) {
      this.destroy();
    },

    load: function(param) {
      return this;
    },

    items: [],
    isInExtent: function(ele) {
      return geometryEngine.contains(this._mapView.extent, ele.geometry);
    },

    refresh: function() {
      var rbush = new window.rbush();
      this.calcTransform();
      console.time('refresh');
      // domConstruct.empty(this._displayDiv);
      arrayUtil.forEach(
        this.items,
        function(v) {
          if (this.isInExtent(v)) {
            var notAdded = true;

            if (v.box) {
              var newPosition = this.getPosition(v);

              var eleHeight = v.box.height;
              var eleWidth = v.box.width;
              v.box = {
                minX: parseInt(newPosition.left),
                minY: parseInt(newPosition.top),
                maxX: parseInt(newPosition.left) + parseInt(eleWidth),
                maxY: parseInt(newPosition.top) + parseInt(eleHeight),
                height: parseFloat(eleHeight),
                width: parseFloat(eleWidth)
              };
            } else {
              notAdded = false;
              this._add(v);
              var box = this.getDomBox(v.node);

              v.box = box;
              domStyle.set(v.node, 'height', v.box.height + 'px');
              domStyle.set(v.node, 'width', v.box.width + 'px');
            }

            var find = rbush.search(v.box);
            if (find.length) {
              domConstruct.destroy(v.node);
              v.node = null;
            } else {
              // if(box.minX&&box)
              rbush.insert(v.box);
              if (notAdded) {
                this._add(v);
                domStyle.set(v.node, 'height', v.box.height + 'px');
                domStyle.set(v.node, 'width', v.box.width + 'px');
              }

              // domStyle.set(v.node, 'display', 'block');
            }
            if (v.node) {
              this._repositionForDirection(v);
            }
          } else {
            if (v.node) {
              domConstruct.destroy(v.node);
              v.node = null;
            }
          }
        },
        this
      );

      console.timeEnd('refresh');
    },

    getDomBox(dom) {
      var styles = window.getComputedStyle(dom);

      // getComputedStyle() should return values already in pixels, so using parseInt()
      //   is not as much as a hack as it seems to be.

      return {
        minX: parseInt(styles.left),
        minY: parseInt(styles.top),
        maxX: parseInt(styles.left) + parseInt(styles.width),
        maxY: parseInt(styles.top) + parseInt(styles.height),
        height: parseFloat(styles.height),
        width: parseFloat(styles.width)
      };
    },

    _add: function(ele) {
      if (ele.node && ele.node.parentNode === this._displayDiv) {
        //todo
      } else {
        if (lang.isString(ele.dom)) {
          ele.node = domConstruct.create(
            'div',
            {
              innerHTML: ele.dom,
              style: 'position:absolute'
            },
            this._displayDiv
          );
        } else {
          ele.node = domConstruct.create(
            'div',
            {
              style: 'position:absolute'
            },
            this._displayDiv
          );
          domConstruct.place(ele.dom, ele.node);
        }
      }

      this.reposition(ele);

      // setTimeout(() => {
      //   domStyle.set(ele.node, 'visibility', 'visible');
      // }, 0);
    },

    getPosition(ele) {
      if (this._mapView) {
        var sp = this._mapView.toScreen(ele.geometry);
        sp = {
          x: sp.x - this.transformOffset.x,
          y: sp.y - this.transformOffset.y
        };

        return {
          left: sp.x,
          top: sp.y
        };
      }
    },

    reposition: function(ele) {
      var position = this.getPosition(ele);
      if (position) {
        domStyle.set(ele.node, {
          top: position.top + 'px',
          left: position.left + 'px'
        });
      }
    },

    _repositionForDirection: function(ele) {
      if (ele.box) {
        var newSP = {};
        // var computedStyle = window.getComputedStyle(ele.node);
        var hieght = ele.box.height;
        var width = ele.box.width;

        switch (this.direction) {
          case 'top-mid': {
            break;
          }
          case 'center': {
            domStyle.set(
              ele.node,
              'margin-left',
              -parseFloat(width / 2) + 'px'
            );
            domStyle.set(
              ele.node,
              'margin-top',
              -parseFloat(hieght / 2) + 'px'
            );
            break;
          }
          default: {
            domStyle.set(ele.node, 'margin-top', '-' + hieght + 'px');
            break;
          }
        }

        return newSP;
      }
    },

    addMany(arr) {
      if (lang.isArray(arr)) {
        arrayUtil.forEach(
          arr,
          function(v) {
            this.add(v);
          },
          this
        );
      }
    },

    add: function(ele) {
      ele = ele || {};

      var defaults = {
        geometry: null,
        dom: ''
      };

      lang.mixin(defaults, ele);
      this._add(defaults);
      this.items.push(defaults);
    },

    removeMany(arr) {
      if (lang.isArray(arr)) {
        arrayUtil.forEach(
          arr,
          function(v) {
            this.remove(v);
          },
          this
        );
        return;
      }
    },

    remove: function(ele) {
      this.items = arrayUtil.filter(
        this.items,
        function(v) {
          var find = ele === v;
          if (find) {
            domConstruct.destroy(v.node);
          }

          return !find;
        },
        this
      );
    },

    removeAll: function() {
      alert('not  implemented');
    },

    destroy: function(evt) {
      this.items = null;
      domConstruct.destroy(this._displayDiv);
    }
  });

  return clazz;
});
