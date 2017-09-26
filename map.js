/**
 * Created by Caihm on 2017/5/10.
 */

var map;
var view;
var s;
var test;
var layer;

require([

    "dojo/parser",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/on",
    'dojo/_base/lang',
    "esri/Map",
    "esri/views/MapView",
    "esri/request",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/geometry/support/webMercatorUtils",
    'esri/Graphic',
    "esri/geometry/support/jsonUtils",
    "widgets/MyPopup",
    "esri/PopupTemplate",
    "layer/DivLayer",
    "dojo/domReady!"
], function (parser, domClass, domConstruct, on, lang, Map, MapView, esriRequest, Point, SimpleMarkerSymbol, SimpleFillSymbol, webMercatorUtils, Graphic, geometryUtils, MyPopup, PopupTemplate, DivLayer) {
    parser.parse();

    // mapManager = MapManager.getInstance({     appConfig: appConfig },
    // 'mapishere'); mapManager.showMap();

    map = new Map({basemap: "streets"});
    view = new MapView({
        container: "mapishere", // Reference to the scene div created in step 5
        map: map, // Reference to the map object created before the scene
        zoom: 4, // Sets zoom level based on level of detail (LOD)
        center: [15, 65]
    });

    view.then(function () {
        console.log('view loaded');

        test = new DivLayer();

        view
            .map
            .add(test);

        var option = {
            title: {
                // text: '某站点用户访问来源', subtext: '纯属虚构', x:'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: "{a} <br/>{b} : {c} ({d}%)"
            },
            legend: {},
            series: [
                {
                    name: '访问来源',
                    type: 'pie',
                    radius: '80%',
                    center: [
                        '50%', '50%'
                    ],
                    data: [
                        {
                            value: 335,
                            name: '直接访问'
                        }, {
                            value: 310,
                            name: '邮件营销'
                        }, {
                            value: 234,
                            name: '联盟广告'
                        }, {
                            value: 135,
                            name: '视频广告'
                        }, {
                            value: 1548,
                            name: '搜索引擎'
                        }
                    ],
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };
        //创建echart节点
        var echartNode = domConstruct.create('div', {style: 'height:150px;width:260px'});
        window.myChart = echarts.init(echartNode);
        myChart.setOption(option);
        //加入echart到图层
        test.add({
            html: echartNode,
            geometry: view
                .extent
                .center
                .clone()
        });

        var echartNode2 = domConstruct.create('div', {style: 'height:150px;width:260px'});
        window.myChart2 = echarts.init(echartNode2);
        myChart2.setOption(option);

        test.add({
            html: echartNode2,
            geometry: new Point({x: 1645332.5128478184, y: 7320152.631188956})
        });

        var echartNode3 = domConstruct.create('div', {style: 'height:150px;width:260px'});
        window.myChart3 = echarts.init(echartNode3);
        myChart3.setOption(option);

        test.add({
            html: echartNode3,
            geometry: new Point({x: 3690175.8935323115, y: 7798342.680140892}),
            afterZoom:function(){
              console.log('asdasd');
            }
        });

    })

});
