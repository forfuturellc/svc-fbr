
# svc-fbr

> File Browser Service


## terminal usage:

```bash
svc-fbr: file browser service

    ?, status      check status of service
    H, help        show this help information
    V, version     show version information
    s, start       start service
    x, stop        stop service

See https://github.com/forfutureLLC/svc-fbr for feature-requests and bug-reports
```

## Module API:

```js
const fbr = require("svc-fbr");
```

### fbr.start([options [, callback]])

Start the service.

* `options` (Object): as [universal Options](#ops)
* `callback` (Function):
  * signature: `callback(err)`


### fbr.ping([options [, callback]])

Ping the service.

* `options` (Object): as [universal Options](#ops)
* `callback` (Function):
  * signature: `callback(err, response)`
  * `response` (Object): passed on success
  * `response.running` (Boolean)


### fbr.stop([options [, callback]])

Stop the service.

* `options` (Object): as [universal Options](#ops)
* `callback` (Function):
  * signature: `callback(err)`


<a name="ops"></a>
### universal options

Prescedence:

* `ip` (String): ip of server
  * `arguments`
  * `${FBRS_IP}`
  * `"127.0.0.1"`
* `port` (Number): port of the server
  * `arguments`
  * `${FBRS_PORT}`
  * `9432`
* `home`: (String) path to home directory
  * `arguments`
  * `${FBRS_HOME}`
  * `process.env.HOME`


## REST API:

Available endpoints once the service is started.


### traversal of file-system:

```http
GET /
```

Queries:
  * `path` (String): path to look up.


Success response:
  * status: `200 OK`
  * body:

  ```json
  {
    "content": <content>,
    "<type>": true
  }
  ```
  where `<content>` would be:
    * `String[]`: array of file names, if path points to directory
    * `String`: file content, if path points to file
  and `<type>` would be the name of [fs.Stats](https://nodejs.org/api/all.html#all_class_fs_stats) function name e.g. "isDirectory".


### ping service:

```http
GET /ping
```

Success response:
  * status: `200 OK`


### stopping service:

```http
GET /stop
```

Success response:
  * status: `200 OK`


## tips:

To start the service as daemon, use [forever](https://github.com/foreverjs/forever):

```bash
$ forever start svc-fbr start    # note the TWO <start>s
```


## license:

__The MIT License (MIT)__

Copyright (c) 2015 Forfuture LLC <we@forfuture.co.ke>
