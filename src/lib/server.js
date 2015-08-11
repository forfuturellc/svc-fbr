/**
 * Our server
 */


"use strict";


exports = module.exports = {
  ping,
  query,
  start,
  stop,
};


// built-in modules
const http = require("http");


// npm-installed modules
const _ = require("lodash");
const express = require("express");
const request = require("request").defaults({ json: true });


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
  const args = utils.getArgs(options, [config], callback);

  app.set("config", args.options);
  server.listen(args.options.port, args.options.ip, function() {
    return args.callback(null);
  }).on("error", function(err) {
    if (err.code === "EADDRINUSE") {
      return args.callback(err);
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
  const args = utils.getArgs(options, [config], callback);
  const url = `http://${args.options.ip}:${args.options.port}/stop`;

  return request.get(url, function(err) {
    if (err && err.code !== "ECONNREFUSED") {
      return args.callback(err);
    }
    return args.callback(null);
  });
}


/**
 * Ping server
 *
 * @param {Object} [options]
 * @param {Function} callback
 */
function ping(options, callback) {
  const args = utils.getArgs(options, [config], callback);
  const url = `http://${args.options.ip}:${args.options.port}/ping`;

  return request.get(url, function(err) {
    if (err) {
      if (err.code === "ECONNREFUSED") {
        return args.callback(null, { running: false });
      }
      return args.callback(err);
    }
    return args.callback(null, { running: true });
  });
}


/**
 * Query service
 *
 * @param {Object} params
 * @param {Function} callback
 */
function query(params, callback) {
  const args = utils.getArgs(params, [config], callback);
  const url = `http://${args.options.ip}:${args.options.port}/`;

  return request.get({
    url,
    qs: args.options,
  }, function(err, res, body) {
    if (err) {
      return args.callback(err);
    }
    return args.callback(null, body);
  });
}
