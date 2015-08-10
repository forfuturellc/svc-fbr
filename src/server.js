/**
 * Our server
 */


"use strict";


exports = module.exports = {
  ping: ping,
  start: start,
  stop: stop,
};


// built-in modules
const http = require("http");


// npm-installed modules
const _ = require("lodash");
const express = require("express");


// own modules
const config = require("./config");
const fs = require("./fs");
const utils = require("./utils");


// module variables
const app = express();
const server = http.Server(app);


// browse filesystem
app.get("/", function(req, res) {
  const options = _.cloneDeep(req.query);
  options.path = options.path || app.get("config").home;
  return fs.handle(options, function(err, descriptor) {
    if (err) {
      return res.json({
        error: err,
      });
    }

    if (descriptor.content instanceof Buffer) {
      descriptor.content = descriptor.content.toString();
    }

    utils.addType(descriptor);

    return res.json(descriptor);
  });
});


// ping back
app.get("/ping", function(req, res) {
  return res.sendStatus(200);
});


// stopping
app.get("/stop", function(req, res) {
  server.close();
  return res.sendStatus(200);
});


/**
 * Start server
 *
 * @param {Object} [options]
 * @param {Function} [callback]
 */
function start(options, callback) {
  let ops = _.cloneDeep(config);
  let cb = callback || function() { };

  if (_.isObject(options)) {
    _.merge(ops, options);
  } else {
    cb = options;
  }

  app.set("config", ops);
  server.listen(ops.port, ops.ip, function() {
    return cb(null);
  }).on("error", function(err) {
    if (err.code === "EADDRINUSE") {
      return cb(err);
    }
    console.error(err);
  });
}


/**
 * Stop server
 *
 * @param {Object} [options]
 * @param {Function} [callback]
 */
function stop(options, callback) {
  let ops = _.cloneDeep(config);
  let cb = callback || function() { };

  if (_.isObject(options)) {
    _.merge(ops, options);
  } else {
    cb = options;
  }

  const url = `http://${ops.ip}:${ops.port}/stop`;
  return http.get(url, function() {
    return cb(null);
  }).on("error", function(err) {
    if (err.code === "ECONNREFUSED") {
      return cb(null);
    }
    return cb(err);
  });
}


/**
 * Ping server
 *
 * @param {Object} [options]
 * @param {Function} callback
 */
function ping(options, callback) {
  let ops = _.cloneDeep(config);
  let cb = callback || function() { };

  if (_.isObject(options)) {
    _.merge(ops, options);
  } else {
    cb = options;
  }

  const url = `http://${ops.ip}:${ops.port}/ping`;
  return http.get(url, function() {
    return cb(null, { running: true });
  }).on("error", function(err) {
    if (err.code === "ECONNREFUSED") {
      return cb(null, { running: false });
    }
    return cb(err);
  });
}
