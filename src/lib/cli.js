/**
 * Control from command-line
 */


// npm-installed modules
import _ from "lodash";
import out from "cli-output";
import parser from "simple-argparse";


// own modules
import pkg from "../package.json";
import db from "./db";
import server from "./server";


// defining the interface
parser
  .description(pkg.name, pkg.description)
  .version(pkg.version)
  .epilog(`See ${pkg.homepage} for feature-requests and bug-reports`)
  .option("s", "start", "start service", startService)
  .option("x", "stop", "stop service", stopService)
  .option("?", "status", "check status of service", checkStatus)
  .option("u", "users", "control users", controlUsers)
  .option("t", "tokens", "control tokens", controlTokens)
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


/**
 * Control users
 */
function controlUsers() {
  if (this.create) {
    return createUser(this.username);
  }

  if (this.delete) {
    return deleteUser(this.username);
  }

  if (this.username) {
    return listUser(this.username);
  }

  return listUsers();
}


/**
 * List users
 */
function listUsers() {
  db.getUsers(function(getErr, users) {
    if (getErr) {
      return out.error(`error occurred: ${getErr}`);
    }

    if (!users.length) {
      return out.error("no users found");
    }

    return out.pjson(users.map((user) => _.pick(user, "username")));
  });
}


function listUser(username) {
  db.getUser(username, function(getErr, user) {
    if (getErr) {
      return out.error(`error occurred: ${getErr}`);
    }

    if (!user) {
      return out.error(`user '${username}' not found`);
    }

    return out.pjson({
      username: user.username,
      "num of tokens": user.tokens.length,
      "created on": user.createdAt,
    });
  });
}


/**
 * Create user
 */
function createUser(username) {
  db.createUser(username, function(createErr) {
    if (createErr) {
      return out.error(`error occurred: ${createErr}`);
    }

    return out.success(`user '${username}' created`);
  });
}


/**
 * Delete user
 */
function deleteUser(username) {
  db.deleteUser(username, function(deleteErr) {
    if (deleteErr) {
      return out.error(`error occurred: ${deleteErr}`);
    }

    return out.success(`user '${username}' deleted`);
  });
}


function controlTokens() {
  if (this.create) {
    return createToken(this.username);
  }

  if (this.delete) {
    return deleteToken(this.username, this.token);
  }

  if (this.check) {
    return checkToken(this.username, this.token);
  }
}


function createToken(username) {
  db.createToken(username, function(createErr, token) {
    if (createErr) {
      return out.error(`error occurred: ${createErr}`);
    }

    out.success(`token for user '${username}' created: ${token}`);
    out.info("you only see this token once");
  });
}


function deleteToken(username, token) {
  db.deleteToken(username, token, function(deleteErr) {
    if (deleteErr) {
      return out.error(`error occurred: ${deleteErr}`);
    }

    return out.success(`token '${token}' deleted`);
  });
}


function checkToken(username, token) {
  db.tokenExists(username, token, function(checkErr, exists) {
    if (checkErr) {
      return out.error(`error occurred: ${checkErr}`);
    }

    if (!exists) {
      return out.error(`token '${token}' does not exist in database`);
    }

    return out.success(`token '${token}' exists in database`);
  });
}
