"use strict";


// npm-installed modules
const async = require("async");
const should = require("should");


// own modules
const fs = require("../lib/fs");


describe("lib/fs", function() {
  it("has handle function", function() {
    should(fs.handle).be.a.Function();
  });
});


describe("lib/fs.handle", function() {
  it("common tests", function(done) {
    async.series({
      dir: function(next) {
        fs.handle(__dirname, function(err, descriptor) {
          should(err).not.be.ok();
          should(descriptor.isDirectory).eql(true);
          should(descriptor.content).be.an.Array();
          return next();
        });
      },
      file: function(next) {
        fs.handle(__filename, function(err, descriptor) {
          should(err).not.be.ok();
          should(descriptor.isFile).eql(true);
          should(descriptor.content).be.an.instanceOf(Buffer);
          return next();
        });
      },
    }, done);
  });
});
