/**
 * fbrs - file browser server
 */


"use strict";


// npm-installed modules
const _ = require("lodash");


_.assign(exports, require("./server"), require("./fs"));
