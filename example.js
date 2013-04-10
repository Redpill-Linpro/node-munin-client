/*
  This is an example which connects to a munin-node, asks for all the data and
  pushes them into handler functions.
*/
var mc = require('./') //require('node-munin-client')

var myclient = new mc('localhost', 4949, true);


myclient.connect(function () {

  myclient.getNodes(nodeResHandler);

});

function nodeResHandler(n) {
  for (var a in n) {
    var node = n[a];

    myclient.getList(node, listResHandler);
  }
}

function listResHandler(p, node) {
  console.log('got list from node ' + node);
  for (var b in p) {
    var plugin = p[b];

    myclient.getMetrics(plugin, metricResHandler);
    myclient.getConfig(plugin, configResHandler);
  }
  myclient.quit();
}

function metricResHandler(r, plugin) {
  console.log('result of ' + plugin);
  console.log(r);
}

function configResHandler(rc, plugin) {
  console.log('config of ' + plugin);
  console.log(rc);
}
