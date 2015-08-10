/**
 * Some utilities for our use
 */


"use strict";


exports = module.exports = {
  addType,
  getArgs,
};


// built-in modules
const fs = require("fs");


// npm-installed modules
const _ = require("lodash");


/**
 * Add type to all stat objects in a descriptor
 *
 * @param {fs.Stats} stats
 * @return {fs.Stats}
 */
function addType(descriptor) {
  if (!(descriptor instanceof fs.Stats)) {
    return descriptor;
  }
  [
    "isFile", "isDirectory", "isBlockDevice", "isCharacterDevice",
    "isSymbolicLink", "isFIFO", "isSocket",
  ].forEach(function(funcName) {
    if (descriptor[funcName]()) {
      descriptor[funcName] = true;
    } else {
      descriptor[funcName] = undefined;
    }
  });
  if (_.isArray(descriptor.content)) {
    descriptor.content.forEach(function(obj) {
      addType(obj);
    });
  }
  return descriptor;
}


/**
 * Get arguments passed by user curated with configurations
 *
 * @param {Object} userArgs - arguments from user
 * @param {Object[]} defaultArgs - default arguments to use
 * @param {Function} userCallback - callback passed by user
 */
function getArgs(userArgs, defaultArgs, userCallback) {
  let args = { };
  let callback = userCallback || function() { };
  defaultArgs.unshift(args);
  _.assign.apply(null, defaultArgs);

  if (_.isPlainObject(userArgs)) {
    _.merge(args, userArgs);
  } else {
    callback = userArgs;
  }

  return {
    options: args,
    callback,
  };
}
