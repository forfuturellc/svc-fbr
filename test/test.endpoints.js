"use strict";


// built-in modules
const fs = require("fs");


// npm-installed modules
const request = require("request").defaults({ json: true });
const should = require("should");


// own modules
const server = require("../lib/server");


// module variables
const port = 9323;
const url = `http://localhost:${port}`;


describe("GET /", function() {
  before(function(done) {
    server.start({ port }, function(startErr) {
      should(startErr).not.be.ok();
      return done();
    });
  });

  after(function(done) {
    server.stop({ port }, done);
  });

  it("passes query path to fs module", function(done) {
    request.get({ url, qs: { path: __filename } }, function(err, res, body) {
      should(err).not.be.ok();
      should(body.isFile).eql(true);
      should(body.content).eql(fs.readFileSync(__filename).toString());
      return done();
    });
  });
});
