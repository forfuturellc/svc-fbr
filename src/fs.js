/**
 * File-system handler
 */


"use strict";


exports = module.exports = {
  handle: handle,
};


// built-in modules
const fs = require("fs");


// npm-installed modules
const _ = require("lodash");


/**
 * Handling requests for browsing file-system
 *
 * @param {Object|String} options
 * @param {Function} callback
 */
function handle(options, callback) {
  let filepath = options.path;
  if (_.isString(options)) {
    filepath = options;
  }
  return fs.lstat(filepath, function(err, stats) {
    if (err) {
      return callback(err);
    }

    const done = wrap(stats, callback);

    if (stats.isDirectory()) {
      return processDir(filepath, done);
    } else if (stats.isFile()) {
      return processFile(filepath, done);
    }

    return callback(null, null);
  });
}


/**
 * Wrap callback
 *
 * @param {Object} stats - fs.Stats
 * @param {Function} callback
 * @return {Function}
 */
function wrap(stats, callback) {
  return function(err, content) {
    if (err) {
      return callback(err);
    }
    let res = {
      content,
    };

    [
      "isFile", "isDirectory", "isBlockDevice", "isCharacterDevice",
      "isSymbolicLink", "isFIFO", "isSocket",
    ].forEach(function(funcName) {
      if (stats[funcName]()) {
        res[funcName] = true;
      }
    });

    return callback(null, res);
  };
}


/**
 * Process directory
 *
 * @param {String} filepath
 * @param {Function} callback
 */
function processDir(filepath, callback) {
  return fs.readdir(filepath, function(err, dirs) {
    if (err) {
      return callback(err);
    }
    return callback(null, dirs);
  });
}


/**
 * Process file
 *
 * @param {String} filepath
 * @param {Function} callback
 */
function processFile(filepath, callback) {
  return fs.readFile(filepath, function(err, data) {
    if (err) {
      return callback(err);
    }
    return callback(null, data);
  });
}
