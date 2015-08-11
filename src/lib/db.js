/**
 * Database handler
 */


"use strict";


exports = module.exports = {
  createToken,
  createUser,
  deleteUser,
  deleteToken,
  getUser,
  getUsers,
  tokenExists,
};


// npm-installed modules
const async = require("async");
const bcrypt = require("bcrypt");
const uuid = require("node-uuid");
const Waterline = require("waterline");


// own modules
const config = require("./config");


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
    default: {
      adapter: "default",
    },
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
    },
    owner: {
      model: "user",
    },
  },
});


// load collections into orm
orm.loadCollection(userCollection);
orm.loadCollection(tokenCollection);


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

    models = m;
    return done(models);
  });
}


/**
 * Create a new user
 *
 * @param {String} username
 * @param {Function} done - done(err, user)
 */
function createUser(username, done) {
  return getModels(function(m) {
    return m.collections.user.create({ username }, done);
  });
}


/**
 * Get a single user. Automatically loads the tokens.
 *
 * @param {String} username
 * @param {Function} done - done(err, user)
 */
function getUser(username, done) {
  return getModels(function(m) {
    return m.collections.user.findOne({ username }).populate("tokens").exec(done);
  });
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
