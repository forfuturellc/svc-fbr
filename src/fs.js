/**
 * File-system handler
 */


"use strict";


exports = module.exports = {
  handle: handle,
};


// built-in modules
const fs = require("fs");
const path = require("path");


// npm-installed modules
const async = require("async");
const _ = require("lodash");


/**
 * Handling requests for browsing file-system
 *
 * @param {Object|String} options
 * @param {Function} callback
 */
function handle(options, callback) {
  if (_.isString(options)) {
    options = { path: options };
  }
  return fs.lstat(options.path, function(err, stats) {
    if (err) {
      return callback(err);
    }

    const done = wrap(stats, callback);

    if (stats.isDirectory()) {
      return processDir(options, done);
    } else if (stats.isFile()) {
      return processFile(options, done);
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
 * @param {Object} options
 * @param {Function} callback
 */
function processDir(options, callback) {
  return fs.readdir(options.path, function(err, filenames) {
    if (err) {
      return callback(err);
    }

    if (options.ignoreDotFiles) {
      filenames = _.filter(filenames, function(filename) {
        return filename[0] !== ".";
      });
    }

    if (!options.ignoreUpDir) {
      filenames.push("..");
    }

    return async.map(filenames, function(filename, done) {
      const abspath = path.resolve(options.path, filename);
      let stats = {
        filename: filename,
        path: abspath,
      };

      if (options.statEach === false) {
        return done(null, stats);
      }

      fs.lstat(abspath, function(lstatErr, lstats) {
        if (lstatErr) {
          return done(lstatErr);
        }
        _.merge(stats, lstats);
        return done(null, stats);
      });
    }, callback);
  });
}


/**
 * Process file
 *
 * @param {Object} options
 * @param {Function} callback
 */
function processFile(options, callback) {
  return fs.readFile(options.path, function(err, data) {
    if (err) {
      return callback(err);
    }
    return callback(null, data);
  });
}
