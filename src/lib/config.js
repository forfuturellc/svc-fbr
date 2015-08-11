/**
 * Default configurations
 */


"use strict";


// built-in modules
const path = require("path");


// npm-installed modules
const fixobj = require("fixed-object");


// module variables
let userConfig;


// try load configuration file, if any
try {
  let configdir = path.join(process.env.HOME, ".fbr");

} catch(err) {
  // keep going, user might not have added a config file
}


exports = module.exports = fixobj({
  home: process.env.FBRS_HOME || process.env.HOME,
  ip: process.env.FBRS_IP || "127.0.0.1",
  port: Number(process.env.FBRS_PORT) || 9432,
  adapter: process.env.FBRS_ADAPTER || "sails-disk",
});
