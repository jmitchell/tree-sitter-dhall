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
    './dhall-lang/tests/parser/failure/incompleteIf.dhall', // infinite loop?
    './dhall-lang/tests/parser/failure/doubleBounds*.dhall' // bounded doubles?
  ];

  const glob_opts = { nodir: true, ignore: ignoredTests };
  const valid_files = [
    './dhall-lang/Prelude/**',
    './dhall-lang/tests/parser/success/**/*.dhall'
  ].map(g => glob.sync(g, glob_opts));
  const invalid_files = [
    './dhall-lang/tests/parser/failure/**'
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
