"use strict";


// built-in modules
const path = require("path");


// npm-installed modules
const async = require("async");
const should = require("should");


// own modules
const fs = require("../lib/fs");


// module variables
const mockPath = path.join(__dirname, "mock");


// module functions
function hasFileWithName(descriptor, name) {
  let objs = descriptor.content;
  for (var i = 0, l = objs.length; i < l; i++) {
    if (objs[i].filename === name) {
      return true;
    }
  }
  return false;
}


describe("lib/fs", function() {
  it("has handle function", function() {
    should(fs.handle).be.a.Function();
  });
});


describe("lib/fs.handle", function() {
  it("common tests", function(done) {
    async.series({
      dir: function(next) {
        fs.handle(mockPath, function(err, descriptor) {
          should(err).not.be.ok();
          should(descriptor.isDirectory).eql(true);
          should(descriptor.content).be.an.Array();
          let sample = descriptor.content[0];
          should(sample.filename).be.a.String();
          should(sample.path).be.a.String();
          should(sample.mtime).be.an.instanceOf(Date);
          should(hasFileWithName(descriptor, "..")).eql(true);
          return next();
        });
      },
      dirUnstated: function(next) {
        fs.handle({ path: mockPath, statEach: false }, function(err, descriptor) {
          should(err).not.be.ok();
          should(descriptor.isDirectory).eql(true);
          should(descriptor.content).be.an.Array();
          let sample = descriptor.content[0];
          should(sample.filename).be.a.String();
          should(sample.path).be.a.String();
          should(sample.mtime).be.Undefined();
          return next();
        });
      },
      dirIgnoreDotFiles: function(next) {
        fs.handle({ path: mockPath, ignoreDotFiles: true }, function(err, descriptor) {
          should(err).not.be.ok();
          should(hasFileWithName(descriptor, "file.js")).eql(true);
          should(hasFileWithName(descriptor, ".dotfile.js")).eql(false);
          return next();
        });
      },
      dirUpDir: function(next) {
        fs.handle({ path: mockPath, ignoreUpDir: true }, function(err, descriptor) {
          should(err).not.be.ok();
          should(hasFileWithName(descriptor, "..")).eql(false);
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
