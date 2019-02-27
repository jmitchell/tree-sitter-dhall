#!/usr/bin/env node

const { spawnSync } = require('child_process');
const glob = require('glob');

const test_suite = (spawn_parser) => {
    let metrics = {
    	pass: 0,
    	fail: []
    };

    const parse_file = (path, expecting_parse=true) => {
	console.log(`Parsing ${path}`);

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
	console.log(`${result} (${parsed ? 'parsed' : 'not parsed'}): ${path} ${output}`);
    };

    const test_files = (files, expected_parse=true) => {
	files.forEach(f => parse_file(f, expected_parse));
    };

    const glob_opts = { nodir: true };
    const valid_files = [
	'./dhall-lang/Prelude/**',
	'./dhall-lang/tests/parser/success/**/*.dhall'
    ].map(g => glob.sync(g, glob_opts));
    const invalid_files = [
	// './dhall-lang/tests/parser/failure/**'
    ].map(g => glob.sync(g, glob_opts));

    test_files([].concat(...valid_files));
    test_files([].concat(...invalid_files), false);

    console.debug(metrics);
    process.exit(metrics.fail.length === 0 ? 0 : 1);
};

test_suite(file => spawnSync('npm', ['run', 'tree-sitter', '--', 'parse', file, '--quiet', '--time']));
