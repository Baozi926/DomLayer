define([
  'esri/Graphic', 'dojo/touch', 'dojo/dom-construct', 'dojo/on', "esri/PopupTemplate"
], function (Graphic, touch, domConstruct, on, PopupTemplate) {


  //create your own default popup content here
  function createContent(param) {
    var attr = param.graphic.attributes;
    var node = domConstruct.create("div", {innerHTML: "test content. click me"});
    on(node, touch.press,  function () {
      alert('hello')
    });
    return node;
  }

  //create your own default popup title here
  function createTitle(param){
    var attr = param.graphic.attributes;
    return 'title, simple String';
  }

  Object.defineProperty(Graphic.prototype, "popupTemplate", {
    set: function (a) {
      var popuptmplate =  a || {title: createTitle, content: createContent};
      return this._set("popupTemplate",popuptmplate);
    },
    enumerable: !0,
    configurable: !0
  });
});