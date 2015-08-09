"use strict";


// npm-installed modules
const should = require("should");


// own modules
const fbr = require("../lib/index");
const server = require("../lib/server");


describe("fbr", function() {
  it("exports the inner server module", function() {
    should.strictEqual(fbr, server);
  });
});
