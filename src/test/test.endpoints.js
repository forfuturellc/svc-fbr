// built-in modules
import fs from "fs";


// npm-installed modules
import request from "request";
import should from "should";


// own modules
import server from "../lib/server";


// module variables
const port = 9323;
const req = request.defaults({ json: true });
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

  it("passes queries to fs module", function(done) {
    req.get({ url, qs: { path: __filename } }, function(err, res, body) {
      should(err).not.be.ok();
      should(body.isFile).eql(true);
      should(body.content).eql(fs.readFileSync(__filename).toString());
      return done();
    });
  });

  it("uses the home if query path is not passed", function(done) {
    req.get({ url }, function(err, res, body) {
      should(err).not.be.ok();
      should(body.content).be.an.Array();
      return done();
    });
  });
});
