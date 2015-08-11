"use strict";


// npm-installed modules
const should = require("should");


// own modules
const fbr = require("../lib/index");
const fs = require("../lib/fs");
const server = require("../lib/server");


describe("fbr", function() {
  it("exports the inner server and fs modules", function() {
    should(fbr).containEql(server);
    should(fbr).containEql(fs);
  });
});
