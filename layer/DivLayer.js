define([
  'dojo/_base/declare',
  'dojo/dom-class',
  'dojo/dom-style',
  'dojo/Deferred',
  'dojo/Evented',
  'esri/layers/Layer',
  'dojo/dom-construct',
  "dojo/_base/lang",
  "dojo/_base/array",
  'dojo/on',
  'dojo/dom-geometry',
  'esri/geometry/geometryEngine',
  'core/css!./DivLayer.css'
], function (declare, domClass, domStyle, Deferred, Evented, Layer, domConstruct, lang, arrayUtil, on, domGeometry, geometryEngine) {

  var _id = 0;

  var clazz = Layer.createSubclass([], {

    constructor: function (options) {
      options = options || {};
      this.divLayerClass = 'div-layer';
      this.popupEnabled = false;
      this.legendEnabled = false;
      this.direction= options.direction;
    },

    onMouseDrag: function (a) {},
    DIRECTION: [
      'bottom-right', 'top-mid', 'center'//可选的direct
    ],
    direction: 'center',

    declaredClass: 'caihm.DivLayer',

    initialize: function (evt, aa) {
      // console.log(evt);
    },

    createLayerView: function (view) {

      this._mapView = view;
      var surface = this._mapView.surface;
      this._displayDiv = domConstruct.create('div', {
        innerHTML: 'test',
        className: 'esri-display-object',
        style: 'width:100%;height:100%',
        className: this.divLayerClass
      }, surface);

      this.bindEvents();
      this.refresh();

      if (view.type === '3d') {
        alert('not implemented for 3d');
      }

    },

    _startDragPosition: null,

    bindEvents: function () {

      this.events = [];

      this
        .events
        .push(on(this._mapView, 'resize', lang.hitch(this, this.refresh, true)));

      this
        .events
        .push(this._mapView.watch("animation", lang.hitch(this, function (response) {
          if (response && response.state === "running") {
            // domStyle.set(this._displayDiv, 'opacity', 0.5);
            domClass.add(this._displayDiv, 'zooming');
          } else {
            // domStyle.set(this._displayDiv, 'opacity', 1);
            domClass.remove(this._displayDiv, 'zooming');

            //解决缩放后，再第一次移动时会抖动的bug
            setTimeout(lang.hitch(this, function () {
              this.refresh(true);
            }), 30);
          }
        })));

      this
        .events
        .push(this._mapView.on('drag', lang.hitch(this, function (evt) {

          if (this._startDragPosition) {
            var dx = evt.x - this._startDragPosition.x;
            var dy = evt.y - this._startDragPosition.y;

            /** 针对不支持 tranfrom 的浏览器有效
            arrayUtil.forEach(this.divs, function (v) {
              domStyle.set(v.node, {
                top: parseFloat(v.top + dy) + 'px',
                left: parseFloat(v.left + dx) + 'px'
              });
            }, this);
            */
            var translate = 'translate(' + dx + 'px,' + dy + 'px)';
            domStyle.set(this._displayDiv, 'transform', translate)

          }

          if (evt.action === 'start') {
            this._startDragPosition = evt;

          }

          if (evt.action === 'end') {
            this._startDragPosition = null;
            domStyle.set(this._displayDiv, 'transform', 'translate(0px,0px)')
            this.refresh();
          }
        })));
    },

    destroyLayerView: function (param) {
      this.destroy();
    },

    load: function (param) {
      return this;
    },

    items: [],
    checkInExtent: function (ele) {
      return geometryEngine.contains(this._mapView.extent.expand(1.2), ele.geometry);
    },

    refresh: function (ifZoomEnd) {

      if (ifZoomEnd) {
        domClass.add(this._displayDiv, 'init');
      }

      domConstruct.empty(this._displayDiv);
      arrayUtil.forEach(this.items, function (v) {
        if (this.checkInExtent(v)) {
          this._add(v, ifZoomEnd);
        }
      }, this);
      domClass.remove(this._displayDiv, 'init');
    },

    _add: function (ele, ifZoomEnd) {

      if (lang.isString(ele.html)) {
        ele.node = domConstruct.create('div', {
          innerHTML: ele.html,
          style: 'position:absolute'
        }, this._displayDiv);
      } else {
        ele.node = domConstruct.create('div', {
          style: 'position:absolute'
        }, this._displayDiv);
        domConstruct.place(ele.html, ele.node);
      }

      this.reposition(ele, ifZoomEnd);

      //可以看出，若ele.geometry并不在地图范围内，即div显示在地图外，afterZoom不会触发
      if (ifZoomEnd && ele.afterZoom && lang.isFunction(ele.afterZoom)) {
        ele.afterZoom(this);
      }
    },

    reposition: function (ele, ifZoomEnd) {
      
      if (this._mapView) {
        var sp = this
          ._mapView
          .toScreen(ele.geometry);
        sp = this._repositionForDirection(ele, sp);

        domStyle.set(ele.node, {
          top: sp.y + 'px',
          left: sp.x + 'px'
        });
        console.log(sp.x,sp.y)

        ele.left = sp.x;
        ele.top = sp.y;

      }
    },

    _repositionForDirection: function (ele, sp) {
      var newSP = {};
      var eleGeometry = domGeometry.position(ele.node);

      switch (this.direction) {
        case 'top-mid':
          {
            newSP.y = sp.y - eleGeometry.h;
            newSP.x = sp.x - eleGeometry.w / 2;
            break;
          }
        case 'center':
          {
            newSP.y = sp.y - eleGeometry.h / 2;
            newSP.x = sp.x - eleGeometry.w / 2;
            break;
          }
        default:
          {
            newSP = sp;
            break;
          }

      }

      return newSP;
    },

    add: function (ele) {

      if (lang.isArray(ele)) {
        arrayUtil
          .forEach(ele, function (v) {
            this.add(v);
          }, this);
        return;
      }

      ele = ele || {};

      var defaults = {
        geometry: null,
        html: 'test'
      }

      lang.mixin(defaults, ele);
      this._add(defaults);
      this
        .items
        .push(defaults);
    },

    remove: function (ele) {

      if (lang.isArray(ele)) {
        arrayUtil
          .forEach(ele, function (v) {
            this.remove(v);
          }, this);
        return;
      }

      this.items = arrayUtil.filter(this.items, function (v) {
        return ele != v;
      }, this);
      this.refresh();
    },

    removeAll: function () {
      this.items.length = 0;
      this.refresh();
    },

    destroy: function (evt) {
      this.items = null;
      domConstruct.destroy(this._displayDiv);
    }

  });

  return clazz;

});