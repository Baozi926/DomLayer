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
], function (declare, domClass, domStyle, Deferred, Evented, Layer, domConstruct, lang, arrayUtil, on, domGeometry,geometryEngine) {

  var _id = 0;

  var clazz = Layer.createSubclass([], {

    constructor: function (options) {
      options = options || {};

      this.divLayerClass = options.divLayerClass || 'div-layer';
      this.popupEnabled = false;
      this.legendEnabled = false;

    },

    onMouseDrag: function (a) {},
    DIRECTION: [
      'bottom-right', 'top-mid', 'center'
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
        .push(on(this._mapView, 'resize', lang.hitch(this, this.refresh,true)));

      this
        .events
        .push(this._mapView.watch("animation", lang.hitch(this, function (response) {
          if (response && response.state === "running") {
            domStyle.set(this._displayDiv, 'opacity', 0.5);
          } else {
            domStyle.set(this._displayDiv, 'opacity', 1);
            this.refresh(true);
          }
        })));

      this
        .events
        .push(this._mapView.on('drag', lang.hitch(this, function (evt) {

          if (this._startDragPosition) {
            var dx = evt.x - this._startDragPosition.x;
            var dy = evt.y - this._startDragPosition.y;

            arrayUtil.forEach(this.divs, function (v) {
              domStyle.set(v.node, {
                top: parseFloat(v.top + dy) + 'px',
                left: parseFloat(v.left + dx) + 'px'
              });
            }, this);

          }

          if (evt.action === 'start') {
            this._startDragPosition = evt;

          }

          if (evt.action === 'end') {
            this._startDragPosition = null;
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

    divs: [],
    checkInExtent:function(ele){

      return geometryEngine.contains(this._mapView.extent.expand(1.2),ele.geometry);
    },

    refresh: function (ifZoomEnd) {
     
      domConstruct.empty(this._displayDiv);
      arrayUtil.forEach(this.divs, function (v) {
        if(this.checkInExtent(v)){
          this._add(v,ifZoomEnd);
        }
      }, this);
    },

    _add: function (ele,ifZoomEnd) {

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

      this.reposition(ele);
      if(ifZoomEnd&&ele.afterZoom&&lang.isFunction(ele.afterZoom)){
        ele.afterZoom(this);
      }
    },

    reposition: function (ele) {
      if (this._mapView) {
        var sp = this
          ._mapView
          .toScreen(ele.geometry);
        sp = this._repositionForDirection(ele, sp);

        domStyle.set(ele.node, {
          top: sp.y + 'px',
          left: sp.x + 'px'
        });

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
      }

      ele = ele || {};

      var defaults = {
        geometry: null,
        html: 'test'
      }

      lang.mixin(defaults, ele);
      this._add(defaults);
      this
        .divs
        .push(defaults);
    },

    remove: function (ele) {

      if (lang.isArray(ele)) {
        arrayUtil
          .forEach(ele, function (v) {
            this.remove(v);
          }, this);
      }

      this.divs = arrayUtil.filter(this.divs, function (v) {
        return ele != v;
      }, this);
      this.refresh();
    },

    removeAll: function () {
      this.divs.length = 0;
      this.refresh();
    },

    destroy: function (evt) {

      this.divs = null;
      domConstruct.destroy(this._displayDiv);

    }

  });

  return clazz;

});