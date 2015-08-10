"use strict";


// built-in modules
const fs = require("fs");


// npm-installed modules
const should = require("should");


// own modules
const utils = require("../lib/utils");


describe("utils.addType", function() {
  it("does not error if object is not an fs.Stats", function() {
    should.doesNotThrow(function() {
      utils.addType({});
    });
  });

  it("adds the correct type", function() {
    let stats = fs.lstatSync(__filename);
    utils.addType(stats);
    should(stats.isFile).eql(true);
    should(stats.isDirectory).be.Undefined();
  });

  it("adds types for content arrays", function() {
    let stats = fs.lstatSync(__dirname);
    stats.content = [ fs.lstatSync(__filename) ];
    utils.addType(stats);
    should(stats.isDirectory).eql(true);
    should(stats.content[0].isFile).eql(true);
  });
});
