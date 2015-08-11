/**
 * Grunt, The Javascript Task Runner
 */


"use strict";


exports = module.exports = function(grunt) {
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    eslint: {
      src: ["Gruntfile.js", "src/**/*.js"],
    },
    mochaTest: {
      test: {
        options: {
          reporter: "spec",
          quiet: false,
          clearRequireCache: false,
        },
        src: ["test/**/test.*.js"],
      },
    },
  });

  grunt.registerTask("test", ["eslint", "mochaTest"]);
};
