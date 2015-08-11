// npm-installed modules
import should from "should";


// own modules
import fbr from "../lib/index";
import fs from "../lib/fs";
import server from "../lib/server";


describe("fbr", function() {
  it("exports the inner server and fs modules", function() {
    should.strictEqual(fbr.fs, fs);
    should.strictEqual(fbr.server, server);
  });
});
