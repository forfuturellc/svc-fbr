/**
 * File-system handler
 */


"use strict";


exports = module.exports = {
  handle,
};


// built-in modules
const fs = require("fs");
const path = require("path");


// npm-installed modules
const _ = require("lodash");
const async = require("async");


// own modules
const config = require("./config");


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

  if (_.isObject(options)) {
    const opts = { };
    _.merge(opts, config, options);
    options = opts;
  } else {
    options = _.cloneDeep(config);
  }

  options.path = options.path || config.home;
  return fs.lstat(options.path, function(err, stats) {
    if (err) {
      return callback(err);
    }

    const done = wrap(options.path, stats, callback);

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
 * @param {String} filepath
 * @param {Object} stats - fs.Stats
 * @param {Function} callback
 * @return {Function}
 */
function wrap(filepath, stats, callback) {
  stats.path = filepath;
  stats.filename = path.basename(filepath);

  return function(err, content) {
    if (err) {
      return callback(err);
    }
    stats.content = content;
    return callback(null, stats);
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

    if (!options.ignoreCurDir) {
      filenames.push(".");
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
