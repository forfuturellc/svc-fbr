/**
 * Control from command-line
 */


"use strict";


// npm-installed modules
const out = require("cli-output");
const parser = require("simple-argparse");


// own modules
const pkg = require("../package.json");
const server = require("./server");


// defining the interface
parser
  .description(pkg.name, pkg.description)
  .version(pkg.version)
  .epilog(`See ${pkg.homepage} for feature-requests and bug-reports`)
  .option("s", "start", "start service", startService)
  .option("x", "stop", "stop service", stopService)
  .option("?", "status", "check status of service", checkStatus)
  .parse();


/**
 * Start the service
 */
function startService() {
  let me = this;
  return server.start(me, function(err) {
    if (err) {
      return out.error("service failed to start: %j", err);
    }
    return server.ping(me, function() {
      out.success("service started");
    });
  });
}


/**
 * Stop the service
 */
function stopService() {
  return server.stop(this, function(err) {
    if (err) {
      return out.error("service did not respond well: %j", err);
    }
    return out.success("service stopped");
  });
}


/**
 * Check status of the service
 */
function checkStatus() {
  return server.ping(this, function(err, res) {
    if (err) {
      return out.error("error occurred: %j", err);
    }
    if (res.running) {
      return out.success("service running");
    }
    return out.error("service not running");
  });
}
