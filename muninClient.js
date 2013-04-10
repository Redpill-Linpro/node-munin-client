/*
  Copyright A-Pressen Digitale Medier
  Copyright Redpill Linpro AS

  Author Trygve Vea
*/
var net  = require('net')
  , util = require('util');

var MuninClient = function () {

  function muninClient(host, port, debug) {
    this.options = {
      host: host,
      port: port || 4949,
      debug: debug || false
    };
    this._callbacks = {};
    this._data = {
      list: {},
      fetch: {},
      config: {}
    };
    this.qIn = [];
    this.qOut = [ 'BANNER' ];
    this.waiting = true;
    this.buffer = '';
  }

  muninClient.prototype.log = function (str) {
    if ( this.options.debug !== true )
      return;

    util.log('('+this.options.host+':'+this.options.port+') '+str);
  };

  muninClient.prototype.connect = function (cb) {
    var self = this;
    this._client = net.connect(this.options.port, this.options.host, function(c) {
      self.log('Connected.');
      if ( cb !== undefined ) {
        cb();
      }
    });
    this._client.on('error', function(err) {
      self.log('Got error: ' + err);
    });
    this._client.setEncoding('utf8');
    this._client.on('data', function(d) { self.data(d); });
    this._client.on('end', function() { self.log('disconnected'); });

    this.sendCaps(['multigraph']);
  };

  muninClient.prototype.panic = function() {
    this._client.end();
  };

  muninClient.prototype.quit = function() {
    this.qIn.push('quit');
  };

  muninClient.prototype.sendCaps = function(c) {
    this.qIn.push('cap ' + c.join(' '));
  };

  muninClient.prototype.getNodes = function(cb) {
    this.qIn.push('nodes');
    this._callbacks.nodes = cb;
    this.send();
  };

  muninClient.prototype.getList = function(node, cb) {
    this.qIn.push('list ' + node);
    this._callbacks['list ' + node] = cb;
    this.send();
  };

  muninClient.prototype.getMetrics = function(plugin, cb) {
    this.qIn.push('fetch ' + plugin);
    this._callbacks['fetch ' + plugin] = cb;
    this.send();
  };

  muninClient.prototype.getConfig = function(plugin, cb) {
    this.qIn.push('config ' + plugin);
    this._callbacks['config ' + plugin] = cb;
    this.send();
  };

  muninClient.prototype.data = function(d) {
    if ( this.qOut.length === 0 ) {
      this.log('Not expecting any data while the queue is empty, panicing.');
      this.quit();
      return;
    }

    switch(this.qOut[0]) {
      case 'BANNER':
        var isBanner = d.match(/^# munin node at (.*)\n$/);
        if ( isBanner ) {
          this._data.node = isBanner[1];
        } else {
          this.log('Unrecognizeable banner, panicing.');
          this.quit();
        }
        this.qOut.shift();
        break;
      case 'CAPABILITIES':
        var isCaps = d.match(/^cap (.*)\n$/);
        if ( isCaps ) {
          this._data.capabilities = isCaps[1].split(' ');
        } else {
          this.log('Unrecognizeable reply, panicing. (cap response)');
          this.quit();
        }
        this.qOut.shift();
        break;
      case 'NODES':
        this.buffer += d;
        var isNodes = this.buffer.match(/^([\s\S]*)\.\n$/);
        if ( isNodes ) {
          this._data.nodes = this.buffer.split('\n');
          this._data.nodes.pop();
          this._data.nodes.pop();
          this.buffer = '';
          this.qOut.shift();
          if ( this._callbacks.nodes ) {
            this._callbacks.nodes(this._data.nodes);
          }
        }
        break;
      case 'LIST':
        this.buffer += d;
        var isList = this.buffer.match(/^(.*)\n$/);
        if ( isList ) {
          this._data.list[this._current] = isList[1].split(' ');
          this.buffer = '';
          this.qOut.shift();
          if ( this._callbacks['list ' + this._current] ) {
            this._callbacks['list ' + this._current](this._data.list[this._current], this._current);
          }
        }
        break;
      case 'FETCH':
        this.buffer += d;
        var isFetch = this.buffer.match(/^([\s\S]*)\.\n$/);
        if ( isFetch ) {
          this._data.fetch[this._current] = this.cleanFetchBuffer(isFetch[1]);
          this.buffer = '';
          this.qOut.shift();
          if ( this._callbacks['fetch ' + this._current] ) {
            this._callbacks['fetch ' + this._current](this._data.fetch[this._current], this._current);
          }
        }
        break;
      case 'CONFIG':
        this.buffer += d;
        var isConfig = this.buffer.match(/^([\s\S]*)\.\n$/);
        if ( isConfig ) {
          this._data.config[this._current] = this.cleanConfigBuffer(this._current, isConfig[1]);
          this.buffer = '';
          this.qOut.shift();
          if ( this._callbacks['config ' + this._current] ) {
            this._callbacks['config ' + this._current](this._data.config[this._current], this._current);
          }
        }
        break;
    }

    if ( this.qOut.length === 0 ) {
      this.waiting = false;
      this.send();
    }
  };

  muninClient.prototype.send = function () {
    if ( this.qIn.length === 0 || this.waiting === true ) {
      return;
    }
    var d = this.qIn[0];
    this._client.write(d + '\n');
    this.waiting = true;

    if ( d.match(/^cap /) ) {
      this.qOut.push('CAPABILITIES');
    }
    if ( d.match(/^nodes$/) ) {
      this.qOut.push('NODES');
    }

    var isList = d.match(/^list (.*)$/);
    if ( isList ) {
      this.qOut.push('LIST');
      this._current = isList[1];
    }

    var isFetch = d.match(/^fetch (.*)$/);
    if ( isFetch ) {
      this.qOut.push('FETCH');
      this._current = isFetch[1];
    }

    var isConfig = d.match(/^config (.*)$/);
    if ( isConfig ) {
      this.qOut.push('CONFIG');
      this._current = isConfig[1];
    }

    this.qIn.shift();
  };

  muninClient.prototype.cleanFetchBuffer = function (fb) {
    var ret = {};
    var values = fb.split('\n');
    for (var i = 0; i < values.length; i++) {
      var keyv = values[i].match(/^(.*)\.value (.+)$/);
      if ( keyv ) {
        ret[keyv[1]] = +keyv[2];
      }
    }
    return ret;
  };

  muninClient.prototype.cleanConfigBuffer = function (plugin, fb) {
    var multigraph = false;
    var ret = {};
    var work = { graph: {}, values: {} };
    var values = fb.split('\n');
    for (var i = 0; i < values.length; i++) {
      var mg = values[i].match(/^multigraph (.*)$/);
      if ( mg ) {
        work = { graph: {}, values: {} };
        ret[mg[1]] = work;
        multigraph = true;
      }
      var gl = values[i].match(/^graph_(.*?) (.*)$/);
      if ( gl ) {
        work.graph[gl[1]] = gl[2];
        continue;
      }
      var dl = values[i].match(/^([a-zA-Z0-9_]+)\.(label|draw|min|max|type|info|graph|colour|negative) (.*)$/);
      if ( dl ) {
        if ( work.values[dl[1]] === undefined ) {
          work.values[dl[1]] = {};
        }
        work.values[dl[1]][dl[2]] = dl[3];
      }
    }
    if ( multigraph === false ) {
      ret[plugin] = work;
    }
    return ret;
  };

  return muninClient;
}();

module.exports = MuninClient;
