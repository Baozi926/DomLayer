# DivLayer
[在线访问(DEMO)](http://47.91.224.241:8080/DivLayer/)


文件位置：layer/DivLayer.js
## 中文
基于arcgis JavaScript api 4 实现的 div图层，实现可跟随地图移动的div，
## 使用方法
```javascript 
   

   
    //生成地图
    map = new Map({basemap: "streets"});
    view = new MapView({
        container: "mapishere", // Reference to the scene div created in step 5
        map: map, // Reference to the map object created before the scene
        zoom: 4, // Sets zoom level based on level of detail (LOD)
        center: [15, 65]
    });
    
    view.then(function () {
        console.log('view loaded');

        //创建一个divlayer
        var divlayer = new DivLayer({
           direction:'center' //div的摆放位置，还可以是'bottom-right','top-mid',
                              //也可在源码的_repositionForDirection方法中添加自己想要的情况
        });
        //将divlayer加入地图
        view
            .map
            .add(divlayer);
            
  
        //创建div
        var echartNode = domConstruct.create('div', {style: 'height:150px;width:260px'});
        
        //在div上创建一个echart图层，也可以将其他想要放入的内容放入此div
        var option = {
        
        };
        var myChart = echarts.init(echartNode);
        myChart.setOption(option);
        
        
        //将div加入到图层中
        divlayer.add({
            html: echartNode, //div，也可以是一个htmlString
            geometry: new Point({x: 1645332.5128478184, y: 7320152.631188956}) //加入的位置
        });

      

    })
```

## 具体应用

因为有了可以随地图移动的div，当我们把echart放在div里，就可以实现一个ehart图层。
下面是截图
![demo picture](https://github.com/Baozi926/DivLayer/blob/master/echarts.png?raw=true)

demo 的gif
![demo picture](https://github.com/Baozi926/DivLayer/blob/master/echartLayer.gif?raw=true)


## English

a moving div layer based on arcgis JavaScript api 4

we can also put echart into div to make this layer a chart layer. see the screenshot shown above(using echart). 
