# DivLayer 
[在线访问(DEMO)](https://baozi926.github.io/DomLayer/)

## 中文

由leaflet的Leaflet.LayerGroup.Collision而启发

基于arcgis JavaScript api 4.13 实现的 div图层，实现可跟随地图移动的dom

文件位置：layer/DomLayer.js

当dom互相遮盖时，可以自动避让

ps：在主分支上的这个版本，如果移动地图，dom会隐藏。这是为了解决性能问题。
如果是要让dom跟随地图移动，在 advance这个分支上是这样的。但是有性能问题，如果有任何可以改善性能的建议，请告诉我。

## English

inspired by Leaflet.LayerGroup.Collision and leaflet iconlayer

based on arcgis javascript 4.13 api

a moving dom layer based on arcgis JavaScript api 4

file in layer/DomLayer.js

see example in index.html


ps:I realy want to make the doms move with map when drag the map. I have implemented that in branch advance, but there is a performance issue. So any idea to improve the performance, plz tell me

