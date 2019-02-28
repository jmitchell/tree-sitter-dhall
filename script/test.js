#!/usr/bin/env node

const { spawnSync } = require('child_process');
const glob = require('glob');

const test_suite = (spawn_parser) => {
  let metrics = {
    pass: 0,
    ignore: 0,
    fail: []
  };

  const ignoredTests = [
    // See breaking changes to Double magnitude introduced in
    // dhall-lang v4.0.0. https://github.com/dhall-lang/dhall-lang/blob/master/CHANGELOG.md#v400
    //
    // Users of this parser are responsible for supporting the
    // IEEE-754 binary64 when reifying the syntactic representation to
    // a numerical value.
    './dhall-haskell/dhall/dhall-lang/tests/parser/failure/doubleBounds*.dhall',

    // TODO: diagnose
    './dhall-haskell/dhall-json/examples/travis.dhall'
  ];

  const glob_opts = { nodir: true, ignore: ignoredTests };
  const valid_files = [
    './dhall-haskell/dhall/dhall-lang/Prelude/**',
    './dhall-haskell/dhall/dhall-lang/tests/parser/success/**/*.dhall',

    './dhall-haskell/dhall/!(dhall-lang)/**/*.dhall',

    './dhall-haskell/!(dhall)/**/*.dhall'
  ].map(g => glob.sync(g, glob_opts));
  const invalid_files = [
    './dhall-haskell/dhall/dhall-lang/tests/parser/failure/**'
  ].map(g => glob.sync(g, glob_opts));


  const parse_file = (path, expecting_parse=true) => {
    process.stdout.write(`Parsing ${path} ... `);

    const parse = spawn_parser(path);

    const parsed = parse.status === 0;
    let result = '';
    if (expecting_parse === parsed) {
      metrics.pass += 1;
      result = '\x1b[32mPASS\x1b[0m';
    } else {
      metrics.fail.push(path);
      result = '\x1b[31mFAIL\x1b[0m';
    }
    const output = parse.stdout.toString();
    console.log(`${result} (${parsed ? 'parsed' : 'not parsed'})${output}`);
  };


  const test_files = (files, expected_parse=true) => {
    files.forEach(f => parse_file(f, expected_parse));
  };


  test_files([].concat(...valid_files));
  test_files([].concat(...invalid_files), false);

  ignoredTests
    .map(g => glob.sync(g, { nodir: true }))
    .forEach(files => {
      files.forEach(f => {
	console.log(`\x1b[33mignored\x1b[0m: ${f}`);
	metrics.ignore += 1;
      });
    });

  console.debug(metrics);
  process.exit(metrics.fail.length === 0 ? 0 : 1);
};

test_suite(file => spawnSync('npm', ['run', 'tree-sitter', '--', 'parse', file, '--quiet', '--time']));
