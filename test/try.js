var vows   = require('vows')
  , assert = require('assert');

var muninClient = require('../muninClient');

var mc = new muninClient('localhost');



var ts = vows.describe('node-munin-client');

var node;

ts.addBatch({
  'when connected': {
    topic: function () {
      mc.connect(this.callback)
    },
    'the callback gets called': function (val) {
      assert.equal(0, 0);
    }
  }
});

ts.addBatch({
  'when requesting node-list': {
    topic: function () {
      mc.getNodes(this.callback)
    },
    'we get a valid node-list': function (val, err) {
      node = val[0];
      assert.isArray(val);
    }
  }
});

ts.addBatch({
  'when requesting plugin-list for node': {
    topic: function () {
      mc.getList(node, this.callback)
    },
    'we find that the node reports a cpu-plugin': function (val, err) {
      assert.equal(val[val.indexOf('cpu')], 'cpu');
    }
  }
});

ts.addBatch({
  'when asking for metrics from cpu-plugin': {
    topic: function () {
      mc.getMetrics('cpu', this.callback);
    },
    'we get metrics in return': function (val, err) {
      assert.isNumber(val.user);
    }
  }
});

ts.addBatch({
  'when asking for config from cpu-plugin': {
    topic: function () {
      mc.getConfig('cpu', this.callback);
    },
    'we get configuration data in return': function (val, err) {
      assert.equal(val.cpu.graph.title, 'CPU usage');
    }
  }
});

ts.exportTo(module);
