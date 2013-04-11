# node-munin-client

A Munin-client written in Node.

## Usage

Install from npm

```bash
# npm install node-munin-client
```

Code:

```javascript
var muninClient = require('node-munin-client');

var mc = new muninClient('localhost', 4949);

mc.connect(function () {
  console.log('Connected!');

  mc.fetch('cpu', function (data) {
    console.log(data);
  });
});
```

## Reference

```
var mc = new muninClient(server, port, true)
```

### connect

Connects to the munin-node.

```
mc.connect( function () { } );
```

### getNodes

Asks for a list of nodes.  First argument of callback will be an array of nodes.

```
mc.getNodes( function (nodes) { } );
```

### getList

Asks for a list of plugins belonging to node.  First argument of callback will be an array of plugins.  Second argument will be the node.

```
mc.getList(node, function (plugins, node) { } );
```

### getConfig

Asks for configuration of plugin.  First argument of callback will be an object with structured configuration data.  Second argument will be the plugin.

```
mc.getConfig(plugin, function (config, plugin) { } );
```

### getMetrics

Asks for metrics of plugin.  First argument of callback will be an object of metrics.  Second argument will be the plugin.

```
mc.getMetrics(plugin, function (metrics, plugin) { } );
```

### quit

Ends the connection.

```
mc.quit();
```


## LICENSE

(MIT)

> Copyright (C) 2013 Redpill Linpro AS
> 
> Permission is hereby granted, free of charge, to any person obtaining a copy of
> this software and associated documentation files (the "Software"), to deal in 
> the Software without restriction, including without limitation the rights to 
> use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies 
> of the Software, and to permit persons to whom the Software is furnished to do 
> so, subject to the following conditions:
> 
> The above copyright notice and this permission notice shall be included in all 
> copies or substantial portions of the Software.
> 
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
> SOFTWARE.

