/**
 * Some utilities for our use
 */


"use strict";


exports = module.exports = {
  addType,
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
