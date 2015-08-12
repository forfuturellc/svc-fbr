/**
 * Database handler
 */


"use strict";


exports = module.exports = {
  addLeaderToGroup: composeAddRemoveGroupMember({ roles: "leaders" }),
  addUserToGroup: composeAddRemoveGroupMember({ roles: "members" }),
  createGroup,
  createToken,
  createUser,
  deleteGroup,
  deleteUser,
  deleteToken,
  getGroup,
  getGroups,
  getUser,
  getUsers,
  isAdmin: composeIsInGroup({ groupname: "admin" }),
  isLeaderInGroup: composeIsInGroup({ roles: "leaders" }),
  isUserInGroup: composeIsInGroup({ roles: "members" }),
  removeLeaderFromGroup: composeAddRemoveGroupMember({ action: "remove", roles: "leaders" }),
  removeUserFromGroup: composeAddRemoveGroupMember({ action: "remove", roles: "members" }),
  tokenExists,
};


// npm-installed modules
const _ = require("lodash");
const async = require("async");
const bcrypt = require("bcrypt");
const config = require("config");
const uuid = require("node-uuid");
const Waterline = require("waterline");


// module variables
const orm = new Waterline();
let models;
let adapter;


// try load the adapter
try {
  adapter = require(config.adapter);
} catch(err) {
  console.log(`adapter '${config.adapter}' is missing. Ensure you do 'npm install ${config.adapter}' in the directory you start the service!`);
  throw err;
}


// orm configurations
const ormConfig = {
  adapters: {
    default: adapter,
  },
  connections: {
    default: _.merge({}, config.get("adapterConfig"), { adapter: "default" }),
  },
};


// user collection
const userCollection = Waterline.Collection.extend({
  identity: "user",
  connection: "default",
  attributes: {
    username: {
      type: "string",
      required: true,
      unique: true,
    },
    tokens: {
      collection: "token",
      via: "owner",
    },
    groups: {
      collection: "group",
      via: "members",
    },
    leading: {
      collection: "group",
      via: "leaders",
    },
  },
});


// tokens collection
const tokenCollection = Waterline.Collection.extend({
  identity: "token",
  connection: "default",
  attributes: {
    uuid: {
      type: "string",
      required: true,
      unique: true,
    },
    owner: {
      model: "user",
    },
  },
});


// groups collection
const groupCollection = Waterline.Collection.extend({
  identity: "group",
  connection: "default",
  attributes: {
    name: {
      type: "string",
      required: true,
      unique: true,
    },
    members: {
      collection: "user",
      via: "groups",
      dominant: true,
    },
    leaders: {
      collection: "user",
      via: "leading",
      dominant: true,
    },
  },
});


// load collections into orm
orm.loadCollection(userCollection);
orm.loadCollection(tokenCollection);
orm.loadCollection(groupCollection);


/**
 * return models. It initializes Waterfall if not yet initialized in
 * this process.
 *
 * @param {Function} done - done(models)
 */
function getModels(done) {
  if (models) {
    return done(models);
  }

  return orm.initialize(ormConfig, function(err, m) {
    if (err) {
      throw err;
    }

    // make the models available as soon as possible for other functions
    models = m;

    // ignore error if groups already created
    let catcher = (createErr) => { if (createErr && createErr.code !== "E_VALIDATION") { throw createErr; } };

    // create the administrators group
    createGroup("admin", catcher);

    // create the public group
    createGroup("public", catcher);

    return done(models);
  });
}


/**
 * Create a new group
 */
function createGroup(name, done) {
  return getModels(function(m) {
    return m.collections.group.create({ name }, done);
  });
}


/**
 * Get a group. It populates the members and leaders automatically.
 *
 * @param {String} name
 * @param {Function} done - done(err, group)
 */
function getGroup(name, done) {
  return getModels(function(m) {
    return m.collections.group.findOne({ name })
      .populate("members").populate("leaders").exec(done);
  });
}


/**
 * Get all groups. Members and leaders are not loaded automatically.
 * This is by design; avoid too much data fetching.
 *
 * @param {Function} done - done(err, groups)
 */
function getGroups(done) {
  return getModels(function(m) {
    return m.collections.group.find().exec(done);
  });
}


/**
 * Delete a group
 *
 * @param {String} name
 * @param {Function} done - done(err)
 */
function deleteGroup(name, done) {
  return getGroup(name, function(getGroupErr, group) {
    if (getGroupErr) {
      return done(getGroupErr);
    }

    if (!group) {
      return done(new Error(`group '${name}' not found`));
    }

    return group.destroy(done);
  });
}


/**
 * Create a new user
 *
 * @param {Object} details
 * @param {String} details.username
 * @param {String} details.group
 * @param {Function} done - done(err, user)
 */
function createUser({ username, group="public" }, done) {
  return getGroup(group, function(getGroupErr, theGroup) {
    if (getGroupErr) {
      return done(getGroupErr);
    }

    if (!theGroup) {
      return done(new Error(`group '${group}' not found`));
    }

    theGroup.members.add({ username });
    return theGroup.save(done);
  });
}


/**
 * Compose function for removing or adding user to group
 *
 * @param {Boolean} [action="add"]
 */
function composeAddRemoveGroupMember({ action="add", roles="members" }) {
  /**
   * Add/Remove user from group
   *
   * @param {String} username
   * @param {String} groupname
   * @param {Function} done - done(err)
   */
   return function(username, groupname, done) {
     return getGroup(groupname, function(getGroupErr, group) {
       if (getGroupErr) {
         return done(getGroupErr);
       }

       if (!group) {
         return done(new Error(`group '${groupname}' not found`));
       }

       return getUser(username, function(getUserErr, user) {
         if (getUserErr) {
           return done(getUserErr);
         }

         if (!user) {
           return done(new Error(`user '${username}' not found`));
         }

         group[roles][action](user.id);
         return group.save(done);
       });
     });
   };
}


/**
 * Get a single user. Automatically loads the tokens.
 *
 * @param {String} username
 * @param {Function} done - done(err, user)
 */
function getUser(username, done) {
  return getModels(function(m) {
    return m.collections.user.findOne({ username })
      .populate("tokens")
      .populate("groups")
      .populate("leading")
      .exec(done);
  });
}


function composeIsInGroup({ defaultGroupname, roles="members" }) {
  /**
   * Check if user is in group
   *
   * @param {String} username
   * @param {Function} done - done(err, bool)
   */
  return function({ username, groupname }, done) {
    return getGroup(groupname || defaultGroupname, function(getGroupErr, group) {
      if (getGroupErr) {
        return done(getGroupErr);
      }

      if (!group) {
        return done(new Error(`no admin group found`));
      }

      for (let index = 0, len = group.members.length; index < len; index++) {
        if (group[roles][index].username === username) {
          return done(null, true);
        }
      }

      return done(null, false);
    });
  };
}



/**
 * Destroy a user. This also deletes all the user's tokens.
 *
 * @param {String} username
 * @param {Function} done - done(err)
 */
function deleteUser(username, done) {
  return getUser(username, function(getUserErr, user) {
    if (getUserErr) {
      return done(getUserErr);
    }

    if (!user) {
      return done(new Error(`user '${username}' not found`));
    }

    user.tokens.forEach((token) => token.destroy());
    user.groups.forEach((group) => { group.members.remove(user.id); group.save(); });
    user.leading.forEach((group) => { group.leaders.remove(user.id); group.save(); });
    user.destroy(done);
  });
}


/**
 * Get all users. Note that the tokens are not loaded. This is by design;
 * it might be very expensive to do so.
 *
 * @param {Function} done - done(err, users)
 */
function getUsers(done) {
  return getModels(function(m) {
    return m.collections.user.find().exec(done);
  });
}


/**
 * Hash a token. We shall not store the token in plain text for security
 * purposes.
 *
 * @param {String} token
 * @param {Function} done - done(err, hash)
 */
function hashToken(token, done) {
  return bcrypt.genSalt(10, function(genSaltErr, salt) {
    if (genSaltErr) {
      return done(genSaltErr);
    }

    bcrypt.hash(token, salt, done);
  });
}


/**
 * Create a token for a user. A token is simply a v4 uuid.
 *
 * @param {String} username
 * @param {Function} done - done(err, token)
 */
function createToken(username, done) {
  return getUser(username, function(getUserErr, user) {
    if (getUserErr) {
      return done(getUserErr);
    }

    if (!user) {
      return done(new Error(`user '${username}' not found`));
    }

    const token = uuid.v4();

    return hashToken(token, function(cryptErr, hash) {
      if (cryptErr) {
        return done(cryptErr);
      }

      return getModels(function(m) {
        m.collections.token.create({
          uuid: hash,
          owner: user.id,
        }, function(createTokenErr) {
          if (createTokenErr) {
            return done(createTokenErr);
          }

          return done(null, token);
        }); // m.collections.token.create
      }); // getModels
    }); // hashToken
  }); // getUser
}


/**
 * Retrieve users tokens
 *
 * @param {String} username
 * @param {Function} done - done(err, hashes)
 */
function getTokenHashes(username, done) {
  return getUser(username, function(getUserErr, user) {
    if (getUserErr) {
      return done(getUserErr);
    }

    if (!user) {
      return done(new Error(`user '${username}' not found`));
    }

    return done(null, user.tokens);
  });
}


/**
 * Check if token exists. If found it is returned.
 *
 * @param {String} token
 * @param {Function} done - done(err, tokenObj)
 */
function tokenExists(username, token, done) {
  return getTokenHashes(username, function(getTokensErr, hashes) {
    if (getTokensErr) {
      return done(getTokensErr);
    }

    if (!hashes || !hashes.length) {
      return done(null, false);
    }

    let index = 0;
    let found = false;

    async.until(() => found || (index >= hashes.length), function(next) {
      bcrypt.compare(token, hashes[index++].uuid, function(err, match) {
        found = match;
        return next(err);
      });
    }, (err) => done(err, found ? hashes[index - 1] : undefined));
  });
}


/**
 * Destroy a token. Username is required as we use it to search through
 * tokens.
 *
 * @param {String} username
 * @param {String} token
 * @param {Function} done - done(err)
 */
function deleteToken(username, token, done) {
  return tokenExists(username, token, function(existsErr, tokenObj) {
    if (existsErr) {
      return done(existsErr);
    }

    if (!tokenObj) {
      return done(new Error(`token '${token}' not found`));
    }

    return tokenObj.destroy(done);
  });
}
