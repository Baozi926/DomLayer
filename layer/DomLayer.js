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
  'esri/core/watchUtils',

  // 'esri/widgets/support/AnchorElementViewModel'
  './DomLayerView2D',
  './DomLayerView3D',
  'esri/core/Collection'
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
  watchUtils,

  DomLayerView2D,
  DomLayerView3D,
  Collection
  // AnchorElementViewModel
) {
  var clazz = Layer.createSubclass([], {
    constructor: function(options) {
      options = options || {};
      this.graphics = new Collection();
      this.popupEnabled = false;
      this.legendEnabled = false;
      this.direction = options.direction;

      this.graphics.on(
        'after-add',
        function(param) {
          this.emit('after-add', param);
        }.bind(this)
      );

      this.graphics.on(
        'after-remove',
        function(param) {
          this.emit('after-remove', param);
        }.bind(this)
      );
    },

    DIRECTION: ['bottom-right', 'top-mid', 'center'],
    direction: 'center',

    declaredClass: 'caihm.DivLayer',

    createLayerView: function(view) {
      this.view = view;

      if (view.type === '3d') {
        console.log('has performance issue on 3d');
        this.layerView = new DomLayerView3D({
          view: view,
          layer: this
        });
      } else {
        this.layerView = new DomLayerView2D({
          view: view,
          layer: this
        });
      }

      return this.layerView;
    },

    destroyLayerView: function(param) {
      this.graphics = null;
      if (this.view.type === '3d') {
        this.layerView.destroy();
      }
    },

    load: function(param) {
      return this;
    },

    addMany(arr) {
      this.graphics.addMany(arr);
    },

    add: function(graphic) {
      this.graphics.add(graphic);
    },

    removeMany(arr) {
      this.graphics.removeMany(arr);
    },
    remove(graphic) {
      this.graphics.remove(graphic);
    },

    removeAll() {
      this.graphics.removeAll();
    }
  });

  return clazz;
});
