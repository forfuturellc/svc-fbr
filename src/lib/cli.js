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
  .option("g", "groups", "control groups", controlGroups)
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


function controlGroups() {
  if (this.create) {
    return db.createGroup(this.name, pingBack("created"));
  }

  if (this.delete) {
    return db.deleteGroup(this.group, pingBack("deleted"));
  }

  if (this.add) {
    return db.addUserToGroup(this.username, this.group, pingBack("added"));
  }

  if (this.remove) {
    return db.removeUserFromGroup(this.username, this.group, pingBack("removed"));
  }

  if (this.addLeader) {
    return db.addLeaderToGroup(this.username, this.group, pingBack("added"));
  }

  if (this.removeLeader) {
    return db.removeLeaderFromGroup(this.username, this.group, pingBack("removed"));
  }

  if (this.group) {
    return listGroup(this.group);
  }

  return listGroups();
}


function pingBack(msg) {
  return function(err) {
    if (err) {
      return out.error("error occurred: %j", err);
    }

    return out.success(msg);
  };
}


function listGroups() {
  return db.getGroups(function(getGroupsErr, groups) {
    if (getGroupsErr) {
      return out.error(`error occurred: ${getGroupsErr}`);
    }

    if (!groups.length) {
      return out.error("no groups found");
    }

    return out.pjson(groups.map((group) => _.pick(group, "name")));
  });
}


function listGroup(name) {
  db.getGroup(name, function(getErr, group) {
    if (getErr) {
      return out.error(`error occurred: ${getErr}`);
    }

    if (!group) {
      return out.error(`group '${name}' not found`);
    }

    return out.pjson({
      name,
      "members": group.members.length,
      "leaders": group.leaders.length,
      "created on": group.createdAt,
    });
  });
}


/**
 * Control users
 */
function controlUsers() {
  if (this.create) {
    return db.createUser(this, pingBack("created"));
  }

  if (this.delete) {
    return db.deleteUser(this.username, pingBack("deleted"));
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
      groups: user.groups.map((group) => group.name),
      leader: user.leading.map((group) => group.name),
      tokens: user.tokens.length,
      "created on": user.createdAt,
    });
  });
}


function controlTokens() {
  if (this.create) {
    return createToken(this.username);
  }

  if (this.delete) {
    return db.deleteToken(this.username, this.token, pingBack("deleted"));
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
