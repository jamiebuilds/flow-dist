#!/usr/bin/env node
// @flow
'use strict';

var fs = require('fs');
var path = require('path');
var meow = require('meow');
var cpFile = require('cp-file');
var globby = require('globby');
var Promise = require('pinkie-promise');
var flowRemoveTypes = require('flow-remove-types');

var cli = meow([
  '  Usage',
  '    $ flow-dist <files...> -D <dest>',
  '  Options',
  '    -o, --out-file    The file path to write transformed files to',
  '    -d, --out-dir     The directory path to write transformed files within',
  '',
  '  Examples',
  '    $ flow-dist src.js -o lib.js',
  '    $ flow-dist src/*.js -d lib',
], {
  alias: {
    o: 'out-file',
    d: 'out-dir',
  }
});

function assert(test, message) {
  if (!test) return;
  console.error(message);
  process.exit(1);
}

var sources = cli.input;
var outDir = typeof cli.flags.outDir === 'string' ? cli.flags.outDir : null;
var outFile = typeof cli.flags.outFile === 'string' ? cli.flags.outFile : null;

assert(!outDir && !outFile, 'Must specify either --out-file or --out-dir');
assert(outDir && outFile, 'Cannot specify both --out-file and --out-dir');

var files = globby.sync(sources);

assert(files.length === 0, 'Must specify at least one source file');
assert(outFile && files.length !== 1, 'Must only have one source file when using --out-file');

var cwd = process.cwd();
var dest = cwd;

if (outDir) {
  dest = path.join(dest, outDir);
}

files.forEach(function(file) {
  var source = path.join(cwd, file);
  var target = path.join(dest, outFile || file);

  var contents = fs.readFileSync(source).toString();
  var transformed = flowRemoveTypes(contents);

  cpFile.sync(source, target + '.flow');
  fs.writeFileSync(target, transformed);
});
