/**
 * Created by Caihm on 2017/5/10.
 */
// eslint-disable-next-line no-useless-escape
var pathRegex = new RegExp(/\/[^\/]+$/);
var locationPath = location.pathname.replace(pathRegex, '');
//dojo config
window.dojoConfig = {
  parseOnLad: true,
  packages: [
    {
      name: 'widgets',
      location: locationPath + '/widgets'
    },
    {
      name: 'core',
      location: locationPath + '/core'
    },
    {
      name: 'layer',
      location: locationPath + '/layer'
    }
  ]
};
