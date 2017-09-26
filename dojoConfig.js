/**
 * Created by Caihm on 2017/5/10.
 */
var pathRegex = new RegExp(/\/[^\/]+$/);
var locationPath = location
    .pathname
    .replace(pathRegex, '');
//dojo config
var dojoConfig = {

    parseOnLad: true,
    packages: [
        {
            name: "widgets",
            location: locationPath + 'widgets'
        }, {
            name: "core",
            location: locationPath + 'core'
        }, {
            name: "layer",
            location: locationPath + 'layer'
        }
    ]
};