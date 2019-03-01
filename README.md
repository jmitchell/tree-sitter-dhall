tree-sitter-dhall
=================

[![Build Status](https://travis-ci.org/jmitchell/tree-sitter-dhall.svg?branch=master)](https://travis-ci.org/jmitchell/tree-sitter-dhall)

[Dhall][] grammar for [tree-sitter][].


Status
------

_Work in progress (unstable)_

There are some consequential [bugs][]. However, 187/190 Dhall files
[found](./script/test.js) in [dhall-haskell][] and its git submodules
(including [dhall-lang][]) parse as expected.

Tree-sitter unit tests in [`./corpus`](./corpus) and
[`./corpus-broken`](./corpus-broken) don't yet cover the full
[grammar][]. Corpus test coverage is currently tracked in
[TODO.md][corpus-coverage].


Usage
-----

See tree-sitter's [using parsers][] documentation.


Applications
------------

Existing:

- [Atom editor support][atom-language-dhall]

Potential:

- Parser for Dhall ports to languages which support C FFI.
- Portable Dhall syntax libraries and tools.
  - Validation
  - Formatting
  - Linting and refactoring
  - Querying
  - Syntactic diffing/patching
  - Conversion
    - user-friendly AST
    - programming languages
	- data formats, e.g. [Dhall's binary representation][dhall-binary]
	- syntax highlighting for a document format, e.g. HTML+CSS
  - More editor integrations
    - simplest in editors which support tree-sitter


Approach
--------

From the [project plan][]:

> My hope is as [dhall.abnf][grammar] evolves the process of updating
> tree-sitter-dhall, and any of its future dependencies, can be mostly
> automated.

[abnf-to-tree-sitter][] compiled the standard dhall.abnf grammar from
[dhall-lang][] into [generated_grammar.js](./generated_grammar.js), a
starting point for a tree-sitter input grammar. Adjustments were
needed, so manual changes were implemented in
[`grammar.js`](./grammar.js).

Realizing full automation requires:

1. Manually resolving bugs in [`grammar.js`](./grammar.js) through
   changes that could conceivably be automated, and would ideally make
   sense for all ABNF grammars.
2. Improving [abnf-to-tree-sitter][] so it can deterministically
   generate the working `grammar.js` based on
   - [dhall.abnf][grammar]
   - initial production rule (unspecified in [RFC 5234][])
   - production rules to hide in the parse tree
   - set of pure heuristics to transform the grammar into an
     equivalent one that's preferable for some reason
   - parameters for deterministic search which is informed by
     - feedback from `tree-sitter generate`
	 - feedback from `tree-sitter parse` on a set of known valid inputs
	 - associativity and relative production precedence hints in case
       it's ambiguous in the ABNF
     - specification defining semantic reductions in terms of
       syntactic productions
   - ... (hopefully not much more)

### Tradeoffs

Depending on your objectives this might not be the right approach.

#### Incremental and ambiguous parsing are overkill

This _could_ be an issue when optimizing for one-shot parsing
time/space.

_Word to the wise: performance optimizations should be informed by
benchmarking and profiling realistic input, and also balanced against
potential performance regressions elsewhere._

[Tree-sitter][tree-sitter] is designed to incrementally parse code as
it is modified (common in code editors). The data structures and
algorithms to support this may incur unnecessary overhead. I have not
yet had a reason to compare performance of tree-sitter parsers against
optimized parsers. NB: `tree-sitter parse --time` (used in CI tests)
may be convenient for initial benchmarking.

Additionally, tree-sitter generates [GLR parsers][] which support
ambiguous grammars and therefore may search for many potential parses
concurrently. The semantics of ABNF's `/` operator [aren't fully
specified](https://stackoverflow.com/a/54951806/204305),
[dhall.abnf][grammar] relies on backtracking, and it's generally
[undecidable whether a given context-free grammar is inherently
ambiguous](https://en.wikipedia.org/wiki/Greibach%27s_theorem#Applications)
so automation efforts must account for ambiguity by default. I also
haven't had a reason to analyze which ambiguous parse paths are
guaranteed to reach a dead-end and could therefore be safely pruned
from the search.

#### Parse trees are verbose and subject to change according to the standard grammar

Concise abstract syntax trees or other high-level interfaces for Dhall
syntax may be preferred for their relative ease of use.

However, if implementing these interfaces requires any steps which
can't be derived automatically, future changes to the standard may
conflict with those interfaces. As a result conflicts would require

- introducing a breaking change,
- implementing an unclean workaround, or
- cutting off support for current and future versions of the standard

None of the options are ideal. The next part suggests how to manage
this.

#### Automating parts that have so far been manual may cause regressions

Over the long-term permitting breaking changes is sometimes for the
best. It's the only way to avoid introducing and maintaining hacks for
the sake of short-term convenience and long-term backwards
incompatiblity.

Explicitly dividing projects into two categories should help strike a
balance.

1. Expand the set of tooling that can be deterministically generated
   from declarative specifications. Breaking changes to the
   specifications automatically translate into corresponding breaking
   changes in these tools. Open standards development and version
   control should make it simple to trace these breaking changes to
   the original source.
2. Manually build useful tools on top of this frontier of generated
   tooling. Take a best-effort approach to designing stable,
   user-friendly interfaces. Offer a vision for how future
   incompatible specification changes will be handled, for example
   support the latest N major versions of the specification
   concurrently.

Those who want to optimize for stability should primarily use the
deterministically generated tooling, and those who are willing to
sacrifice some stability for UX can instead opt for the manually
crafted interfaces.

The goal is for this project and others like [abnf-to-tree-sitter][]
to abstract any special cases particular to Dhall and automate as much
as possible. In other words, they are currently in category 2 with
aspirations of being in category 1.

### Contributing

Issues with the [help
wanted](https://github.com/jmitchell/tree-sitter-dhall/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
label are a good place to start.


References
----------

* [Dhall's ABNF grammar][grammar]
* [RFC 5234: Augmented BNF for Syntax Specifications: ABNF][RFC 5234]


[Dhall]: https://dhall-lang.org/
[tree-sitter]: https://github.com/tree-sitter/tree-sitter
[bugs]: https://github.com/jmitchell/tree-sitter-dhall/issues?q=is%3Aissue+is%3Aopen+label%3Abug
[dhall-haskell]: https://github.com/dhall-lang/dhall-haskell
[dhall-lang]: https://github.com/dhall-lang/dhall-lang
[./corpus]: https://github.com/jmitchell/tree-sitter-dhall/tree/master/corpus
[./corpus-broken]: https://github.com/jmitchell/tree-sitter-dhall/tree/master/corpus-broken
[grammar]: https://github.com/dhall-lang/dhall-lang/blob/master/standard/dhall.abnf
[corpus-coverage]: https://github.com/jmitchell/tree-sitter-dhall/blob/master/TODO.md#corpus-coverage
[using parsers]: http://tree-sitter.github.io/tree-sitter/using-parsers
[atom-language-dhall]: https://github.com/jmitchell/atom-language-dhall
[dhall-binary]: https://github.com/dhall-lang/dhall-lang/blob/master/standard/binary.md
[project plan]: https://github.com/dhall-lang/dhall-lang/issues/323
[abnf-to-tree-sitter]: https://github.com/jmitchell/abnf-to-tree-sitter
[RFC 5234]: https://tools.ietf.org/html/rfc5234
[GLR parsers]: https://en.wikipedia.org/wiki/GLR_parser
