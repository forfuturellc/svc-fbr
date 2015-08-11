/**
 * File-system handler
 */


export default {
  handle,
};


// built-in modules
import fs from "fs";
import path from "path";


// npm-installed modules
import _ from "lodash";
import async from "async";
import mime from "mime";


// own modules
import config from "./config";


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
  return stat(options.path, function(err, stats) {
    if (err) {
      return callback(err);
    }

    const done = wrap(stats, callback);

    if (stats.isDirectory()) {
      options.dirStats = stats;
      return processDir(options, done);
    } else if (stats.isFile()) {
      return processFile(options, done);
    }

    return callback(null, null);
  });
}


/**
 * Stat files
 *
 * @param {String} filepath - absolute path
 * @param {Function}
 */
function stat(filepath, callback) {
  return fs.lstat(filepath, function(err, stats) {
    if (err) {
      return callback(err);
    }
    stats.path = filepath;
    stats.filename = path.basename(filepath);
    stats.mime = mime.lookup(filepath);
    return callback(null, stats);
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
    stats.content = content;
    return callback(null, stats);
  };
}


/**
 * Process directory
 *
 * @param {Object} options
 * @param {fs.Stats} options.dirStats
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

    return async.map(filenames, function(filename, done) {
      const abspath = path.join(options.path, filename);

      if (options.statEach === false) {
        return done(null, {
          filename,
          path: abspath,
        });
      }

      stat(abspath, function(statErr, stats) {
        if (statErr) {
          return done(statErr);
        }
        return done(null, stats);
      });
    }, function(mapErr, statsMap) {
      if (mapErr) {
        return callback(err);
      }

      if (!options.ignoreCurDir) {
        const stats = _.cloneDeep(options.dirStats);
        stats.filename = ".";
        statsMap.push(stats);
      }

      if (!options.ignoreUpDir) {
        const abspath = path.join(options.path, "..");
        return stat(abspath, function(statErr, stats) {
          if (err) {
            return callback(err);
          }
          stats.filename = "..";
          statsMap.push(stats);
          return callback(null, statsMap);
        });
      }

      return callback(null, statsMap);
    });
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
