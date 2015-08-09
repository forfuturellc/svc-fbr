/**
 * Default configurations
 */


"use strict";


exports = module.exports = {
  home: process.env.FBRS_HOME || process.env.HOME,
  ip: process.env.FBRS_IP || "127.0.0.1",
  port: Number(process.env.FBRS_PORT) || 9432,
};
