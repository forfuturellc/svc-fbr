
# svc-fbr

> File Browser Service

[![node](https://img.shields.io/node/v/svc-fbr.svg?style=flat-square)](https://www.npmjs.com/package/svc-fbr) [![npm](https://img.shields.io/npm/v/svc-fbr.svg?style=flat-square)](https://www.npmjs.com/package/svc-fbr) [![Travis](https://img.shields.io/travis/forfutureLLC/svc-fbr.svg?style=flat-square)](https://travis-ci.org/forfutureLLC/svc-fbr) [![Gemnasium](https://img.shields.io/gemnasium/forfutureLLC/svc-fbr.svg?style=flat-square)](https://gemnasium.com/forfutureLLC/svc-fbr) [![Coveralls](https://img.shields.io/coveralls/forfutureLLC/svc-fbr.svg?style=flat-square)](https://coveralls.io/github/forfutureLLC/svc-fbr?branch=master)


This module can be used in different ways:

1. As a **standalone service**: running the module's server in the background allows different processes to use this service through a [REST API](#rest). This allows user to traverse an accessible network file system (NFS). The [terminal interface](#term) is useful in controlling the service on the host. **Note**: you can import the module in your Node.js applications to abstract the REST api.

1. As an **imported module**: you can simply `require` the module in Node.js applications thus using the [module API](#module-api). This should be used by application accessing file systems attached to the system.


## Module API:

```js
const fbr = require("svc-fbr");
```

### fbr.start([options [, callback]])

Start the service.

* `options` ([service options](#service-ops))
* `callback` (Function):
  * signature: `callback(err)`


### fbr.ping([options [, callback]])

Ping the service.

* `options` ([service options](#service-ops))
* `callback` (Function):
  * signature: `callback(err, response)`
  * `response` (Object): passed on success
  * `response.running` (Boolean)


### fbr.stop([options [, callback]])

Stop the service.

* `options` ([service options](#service-ops))
* `callback` (Function):
  * signature: `callback(err)`


### fbr.query(params, callback)

Query service.

* `options` ([service options](#service-ops) + [Parameters](#params))
* `callback` (Function):
  * signature: `callback(err, res)`


<a name="service-ops"></a>
### service options

An `Object` of options as configurations of the service.

Properties:

* `ip` (String): ip of server
* `port` (Number): port of the server
* `home`: (String) path to home directory. This is default path used if `path` parameter is **not** passed.


Prescedence (from Left-To-Right):

* `ip`: `arguments`, `${FBRS_IP}`, `"127.0.0.1"`
* `port`: `arguments`, ${FBRS_PORT}`, `9432`
* `home`: `arguments`, `${FBRS_HOME}`, `process.env.HOME`


<a name="params"></a>
### parameters

An `Object` of query parameters.

Properties:

* `path` (String): path to look up
* `ignoreDotFiles` (Boolean=false): ignore files with names starting with a `.` (dot).
* `ignoreCurDir` (Boolean=false): ignore the current directory, `.`, from results.
* `ignoreUpDir` (Boolean=false): ignore the upper directory, `..`, from results.
* `statEach` (Boolean=true): stat each of the contained files if `path` is a directory.


## REST API:

Available endpoints once the service is started.


### traversal of file-system:

```http
GET /
```

The [paramters](#params) should be sent as query string.


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


<a name="term"></a>
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


## tips:

To start the service as daemon, use [forever](https://github.com/foreverjs/forever):

```bash
$ forever start svc-fbr start    # note the TWO <start>s
```


## license:

__The MIT License (MIT)__

Copyright (c) 2015 Forfuture LLC <we@forfuture.co.ke>
