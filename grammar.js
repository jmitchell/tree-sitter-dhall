// Manually modified version of generated_grammar.js

const whitespace = $ => repeat($._whitespace_chunk);
const directory = $ => repeat($.path_component);
const authority = $ => seq(optional(seq(userinfo($), "@")), host($), optional(seq(":", port($))));
const userinfo = $ => repeat(choice($.unreserved, $.pct_encoded, $.sub_delims, ":"));
const host = $ => choice($.IP_literal, $.IPv4address, reg_name($));
const port = $ => repeat($._DIGIT);
const reg_name = $ => repeat(choice($.unreserved, $.pct_encoded, $.sub_delims));
const query = $ => repeat(choice($.pchar, "/", "?"));
const fragment = $ => repeat(choice($.pchar, "/", "?"));

const record_type_or_literal = $ => optional(choice($.equal, $.non_empty_record_type_or_literal));
const union_type_or_literal = $ => optional($.non_empty_union_type_or_literal);


module.exports = grammar({
  name: 'dhall',

  extras: $ => [],

  conflicts: $ => [
    [$.missing],
    [$.natural_literal],
    [$.label],
    [$.text_literal],
    [$.reserved_namespaced],
    [$.double_literal, $.natural_literal_raw],
    [$.http],
    [$.local],
    [$.reserved],
    [$.env],
    [$.primitive_expression],
    [$.integer_literal],
    [$.identifier_reserved_namespaced_prefix],
    [$.double_literal],
    [$.simple_label],
    [$.natural_literal_raw],
    [$.selector_expression],
    [$.file, $.local_raw],
    [$.reserved, $.identifier_reserved_prefix],
    [$.reserved_namespaced, $.identifier_reserved_namespaced_prefix],
    [$.identifier_reserved_prefix],
    [$.close_brace],
    [$.Text],
    [$.close_angle],
    [$.http_raw],
    [$.import_hashed],
    [$.path_component],
    [$.bash_environment_variable],
    [$.close_bracket],
    [$.non_empty_optional, $.non_empty_list_literal],
    [$.close_parens],
    [$.identifier],
    [$.exponent],
    [$.file, $.http_raw],
    [$.hash],
    [$.import]
  ],

  rules: {
    // start rule
    source_file: $ => $.complete_expression,

    // ; ABNF syntax based on RFC 5234,
    // ;,
    // ; The character encoding for Dhall is UTF-8,
    // ;,
    // ; Some notes on implementing this grammar:,
    // ;,
    // ; First, do not use a lexer to tokenize the file before parsing.  Instead, treat,
    // ; the individual characters of the file as the tokens to feed into the parser.,
    // ; You should not use a lexer because Dhall's grammar supports two features which,
    // ; cannot be correctly supported by a lexer:,
    // ;,
    // ; * String interpolation (i.e. "foo ${Natural/toInteger bar} baz"),
    // ; * Nested block comments (i.e. "{- foo {- bar -} baz -}"),
    // ;,
    // ; Second, this grammar assumes that your parser can backtrack and/or try,
    // ; multiple parses simultaneously.  For example, consider this expression:,
    // ;,
    // ;     List ./MyType,
    // ;,
    // ; A parser might first try to parse the period as the beginning of a field,
    // ; selector, only to realize immediately afterwards that `/MyType` is not a valid,
    // ; name for a field.  A conforming parser must backtrack so that the expression,
    // ; `./MyType` can instead be correctly interpreted as a relative path,
    // ;,
    // ; Third, if there are multiple valid parses then prefer the first parse,
    // ; according to the ordering of alternatives. That is, the order of evaluation,
    // ; of the alternatives is left-to-right.,
    // ;,

    // TODO: Add a corpus test case for this and consider how to
    // convey the left-to-right alternation preference to tree-sitter.

    // ; For example, the grammar for single quoted string literals is:,
    // ;,
    // ;     single-quote-continue =,
    // ;           "'''"               single-quote-continue,
    // ;         / "${" complete-expression "}" single-quote-continue,
    // ;         / "''${"              single-quote-continue,
    // ;         / "''",
    // ;         / %x20-10FFFF         single-quote-continue,
    // ;         / tab                 single-quote-continue,
    // ;         / end-of-line         single-quote-continue,
    // ;,
    // ;         single-quote-literal = "''" single-quote-continue,
    // ;,
    // ; ... which permits valid parses for the following code:,
    // ;,
    // ;     "''''''''''''''''",
    // ;,
    // ; If you tried to parse all alternatives then there are at least two valid,
    // ; interpretations for the above code:,
    // ;,
    // ; * A single quoted literal with four escape sequences of the form "'''",
    // ;     * i.e. "''" followed by "'''"  four times in a row followed by "''",
    // ; * Four empty single quoted literals,
    // ;     * i.e. "''''" four times in a row,
    // ;,
    // ; The correct interpretation is the first one because parsing the escape,
    // ; sequence "'''" takes precedence over parsing the termination sequence "''",,
    // ; according to the order of the alternatives in the `single-quote-continue`,
    // ; rule.,
    // ;,
    // ; Some parsing libraries do not backtrack by default but allow the user to,
    // ; selectively backtrack in certain parts of the grammar.  Usually parsing,
    // ; libraries do this to improve efficiency and error messages.  Dhall's grammar,
    // ; takes that into account by minimizing the number of rules that require the,
    // ; parser to backtrack and comments below will highlight where you need to,
    // ; explicitly backtrack,
    // ;,
    // ; Specifically, if you see an uninterrupted literal in a grammar rule such as:,
    // ;,
    // ;     "->",
    // ;,
    // ; ... or:,
    // ;,
    // ;     %x66.6F.72.61.6C.6C,
    // ;,
    // ; ... then that string literal is parsed as a single unit, meaning that you,
    // ; should backtrack if you parse only part of the literal,
    // ;,
    // ; In all other cases you can assume that you do not need to backtrack unless,
    // ; there is a comment explicitly asking you to backtrack,
    // ;,
    // ; When parsing a repeated construct, prefer alternatives that parse as many,
    // ; repetitions as possible.  On in other words:,
    // ;,
    // ;     [a] = a / "",
    // ;,
    // ;     a* = a* a / "",
    // ;,
    // ; Note that the latter rule also specifies that repetition produces,
    // ; left-associated expressions.  For example, function application is,
    // ; left-associative and all operators are left-associative when they are not,
    // ; parenthesized.,
    // ;,

    // TODO: Consider how to test whether tree-sitter behaves this way
    // and, if not, whether it can be persuaded to through a
    // mechanical grammar translation.

    // ; Additionally, try alternatives in an order that minimizes backtracking,
    // ; according to the following rule:,
    // ;,
    // ;     (a / b) (c / d) = a c / a d / b c / b d,
    // ; NOTE: There are many line endings in the wild,
    // ;,
    // ; See: https://en.wikipedia.org/wiki/Newline,
    // ;,
    // ; For simplicity this supports Unix and Windows line-endings, which are the most,
    // ; common,
    _end_of_line: $ =>
      choice("\x0A", "\x0D\x0A"),
    _tab: $ =>
      "\x09",
    block_comment: $ =>
      seq("{-", $._block_comment_continue),
    _block_comment_chunk: $ =>
      choice($.block_comment, /[\x20-\uD7FF]/, $._tab, $._end_of_line),
    _block_comment_continue: $ =>
      choice("-}", seq($._block_comment_chunk, $._block_comment_continue)),
    _not_end_of_line: $ =>
      choice(/[\x20-\uD7FF]/, $._tab),
    // ; NOTE: Slightly different from Haskell-style single-line comments because this,
    // ; does not require a space after the dashes,
    line_comment: $ =>
      seq("--", repeat($._not_end_of_line), $._end_of_line),
    _whitespace_chunk: $ =>
      choice(" ", $._tab, $._end_of_line, $.line_comment, $.block_comment),
    _nonempty_whitespace: $ =>
      repeat1($._whitespace_chunk),
    // ; Uppercase or lowercase ASCII letter,
    _ALPHA: $ =>
      choice("A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
	     "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"),
    // ; ASCII digit,
    _DIGIT: $ =>
      choice("0", "1", "2", "3", "4", "5", "6", "7", "8", "9"),
    _HEXDIG: $ =>
      choice($._DIGIT, "A", "B", "C", "D", "E", "F", "a", "b", "c", "d", "e", "f"),
    // ; A simple label cannot be one of the following reserved names:,
    // ;,
    // ; * Bool,
    // ; * Optional,
    // ; * None,
    // ; * Natural,
    // ; * Integer,
    // ; * Double,
    // ; * Text,
    // ; * List,
    // ; * True,
    // ; * False,
    // ; * NaN,
    // ; * Infinity,
    // ; * Type,
    // ; * Kind,
    // ; * Sort,
    // ; * Natural/fold,
    // ; * Natural/build,
    // ; * Natural/isZero,
    // ; * Natural/even,
    // ; * Natural/odd,
    // ; * Natural/toInteger,
    // ; * Natural/show,
    // ; * Integer/toDouble,
    // ; * Integer/show,
    // ; * Double/show,
    // ; * List/build,
    // ; * List/fold,
    // ; * List/length,
    // ; * List/head,
    // ; * List/last,
    // ; * List/indexed,
    // ; * List/reverse,
    // ; * Optional/fold,
    // ; * Optional/build,
    // ; * Text/show,
    // ; * if,
    // ; * then,
    // ; * else,
    // ; * let,
    // ; * in,
    // ; * as,
    // ; * using,
    // ; * merge,
    // ; * Some,
    simple_label: $ =>
      seq(choice($._ALPHA, "_"), repeat(choice($._ALPHA, $._DIGIT, "-", "/", "_"))),
    quoted_label: $ =>
      repeat1(choice($._ALPHA, $._DIGIT, "-", "/", "_", ":", ".", "$")),
    // ; NOTE: Dhall does not support Unicode labels, mainly to minimize the potential,
    // ; for code obfuscation,
    label: $ =>
      seq(choice(seq("`", $.quoted_label, "`"), $.simple_label), whitespace($)),
    // ; Dhall's double-quoted strings are equivalent to JSON strings except with,
    // ; support for string interpolation (and escaping string interpolation),
    // ;,
    // ; Dhall uses almost the same escaping rules as JSON (RFC7159) with one,
    // ; exception: Dhall adds a new `\$` escape sequence for dollar signs.  This,
    // ; additional escape sequences lets you escape string interpolation by writing,
    // ; `\${`,
    // ;,
    // ; > The representation of strings is similar to conventions used in the C,
    // ; > family of programming languages.  A string begins and ends with,
    // ; > quotation marks.  All Unicode characters may be placed within the,
    // ; > quotation marks, except for the characters that must be escaped:,
    // ; > quotation mark, reverse solidus, and the control characters (U+0000,
    // ; > through U+001F).,
    // ; >,
    // ; > Any character may be escaped.  If the character is in the Basic,
    // ; > Multilingual Plane (U+0000 through U+FFFF), then it may be,
    // ; > represented as a six-character sequence: a reverse solidus, followed,
    // ; > by the lowercase letter u, followed by four hexadecimal digits that,
    // ; > encode the character's code point.  The hexadecimal letters A though,
    // ; > F can be upper or lower case.  So, for example, a string containing,
    // ; > only a single reverse solidus character may be represented as,
    // ; > "\u005C".,
    // ; >,
    // ; > Alternatively, there are two-character sequence escape,
    // ; > representations of some popular characters.  So, for example, a,
    // ; > string containing only a single reverse solidus character may be,
    // ; > represented more compactly as "\\".,
    // ; >,
    // ; > To escape an extended character that is not in the Basic Multilingual,
    // ; > Plane, the character is represented as a 12-character sequence,,
    // ; > encoding the UTF-16 surrogate pair.  So, for example, a string,
    // ; > containing only the G clef character (U+1D11E) may be represented as,
    // ; > "\uD834\uDD1E".,
    double_quote_chunk: $ =>
      choice(seq("${", $.complete_expression, "}"), seq("\x5C", choice("\x22", "\x24", "\x5C", "\x2F", "\x62", "\x66", "\x6E", "\x72", "\x74", seq("\x75", seq($._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG)))), /[\x20-\x21]/, /[\x23-\x5B]/, /[\x5D-\uD7FF]/),
    double_quote_literal: $ =>
      seq("\x22", repeat($.double_quote_chunk), "\x22"),
    // ; NOTE: The only way to end a single-quote string literal with a single quote is,
    // ; to either interpolate the single quote, like this:,
    // ;,
    // ;     ''ABC${"'"}'',
    // ;,
    // ; ... or concatenate another string, like this:,
    // ;,
    // ;     ''ABC'' ++ "'",
    // ;,
    // ; If you try to end the string literal with a single quote then you get "'''",,
    // ; which is interpreted as an escaped pair of single quotes,
    single_quote_continue: $ =>
      choice(seq("'''", $.single_quote_continue), seq("${", $.complete_expression, "}", $.single_quote_continue), seq("''${", $.single_quote_continue), "''", seq(/[\u0020-\uD7FF]/, $.single_quote_continue), seq($._tab, $.single_quote_continue), seq($._end_of_line, $.single_quote_continue)),
    single_quote_literal: $ =>
      seq("''", $._end_of_line, $.single_quote_continue),
    text_literal: $ =>
      seq(choice($.double_quote_literal, $.single_quote_literal), whitespace($)),
    // ; RFC 5234 interprets string literals as case-insensitive and recommends using,
    // ; hex instead for case-sensitive strings,
    // ;,
    // ; If you don't feel like reading hex, these are all the same as the rule name,,
    // ; except without the '-raw' ending, and converting dashes in the rule name,
    // ; to forward slashes,
    if_raw: $ =>
      "if",
    then_raw: $ =>
      "then",
    else_raw: $ =>
      "else",
    let_raw: $ =>
      "let",
    in_raw: $ =>
      "in",
    as_raw: $ =>
      "as",
    using_raw: $ =>
      "using",
    merge_raw: $ =>
      "merge",
    missing_raw: $ =>
      "missing",
    Some_raw: $ =>
      "some",
    Natural_fold_raw: $ =>
      "Natural/fold",
    Natural_build_raw: $ =>
      "Natural/build",
    Natural_isZero_raw: $ =>
      "Natural/isZero",
    Natural_even_raw: $ =>
      "Natural/even",
    Natural_odd_raw: $ =>
      "Natural/odd",
    Natural_toInteger_raw: $ =>
      "Natural/toInteger",
    Natural_show_raw: $ =>
      "Natural/show",
    Integer_toDouble_raw: $ =>
      "Integerl/toDouble",
    Integer_show_raw: $ =>
      "Integer/show",
    Double_show_raw: $ =>
      "Double/show",
    List_build_raw: $ =>
      "List/build",
    List_fold_raw: $ =>
      "List/fold",
    List_length_raw: $ =>
      "List/length",
    List_head_raw: $ =>
      "List/head",
    List_last_raw: $ =>
      "List/last",
    List_indexed_raw: $ =>
      "List/indexed",
    List_reverse_raw: $ =>
      "List/reverse",
    Optional_fold_raw: $ =>
      "Optional/fold",
    Optional_build_raw: $ =>
      "Optional/build",
    Text_show_raw: $ =>
      "Text/show",
    Bool_raw: $ =>
      "Bool",
    Optional_raw: $ =>
      "Optional",
    None_raw: $ =>
      "None",
    Natural_raw: $ =>
      "Natural",
    Integer_raw: $ =>
      "Integer",
    Double_raw: $ =>
      "Double",
    Text_raw: $ =>
      "Text",
    List_raw: $ =>
      "List",
    True_raw: $ =>
      "True",
    False_raw: $ =>
      "False",
    NaN_raw: $ =>
      "NaN",
    Infinity_raw: $ =>
      "Infinity",
    Type_raw: $ =>
      "Type",
    Kind_raw: $ =>
      "Kind",
    Sort_raw: $ =>
      "Sort",
    reserved_raw: $ =>
      choice($.Bool_raw, $.Optional_raw, $.None_raw, $.Natural_raw, $.Integer_raw, $.Double_raw, $.Text_raw, $.List_raw, $.True_raw, $.False_raw, $.NaN_raw, $.Infinity_raw, $.Type_raw, $.Kind_raw, $.Sort_raw),
    reserved_namespaced_raw: $ =>
      choice($.Natural_fold_raw, $.Natural_build_raw, $.Natural_isZero_raw, $.Natural_even_raw, $.Natural_odd_raw, $.Natural_toInteger_raw, $.Natural_show_raw, $.Integer_toDouble_raw, $.Integer_show_raw, $.Double_show_raw, $.List_build_raw, $.List_fold_raw, $.List_length_raw, $.List_head_raw, $.List_last_raw, $.List_indexed_raw, $.List_reverse_raw, $.Optional_fold_raw, $.Optional_build_raw, $.Text_show_raw),
    reserved: $ =>
      seq($.reserved_raw, whitespace($)),
    reserved_namespaced: $ =>
      seq($.reserved_namespaced_raw, whitespace($)),
    // ; Whitespaced rules for reserved words, to be used when matching expressions,
    if: $ =>
      seq($.if_raw, $._nonempty_whitespace),
    then: $ =>
      seq($.then_raw, $._nonempty_whitespace),
    else: $ =>
      seq($.else_raw, $._nonempty_whitespace),
    let: $ =>
      seq($.let_raw, $._nonempty_whitespace),
    in: $ =>
      seq($.in_raw, $._nonempty_whitespace),
    as: $ =>
      seq($.as_raw, $._nonempty_whitespace),
    using: $ =>
      seq($.using_raw, $._nonempty_whitespace),
    merge: $ =>
      seq($.merge_raw, $._nonempty_whitespace),
    Some: $ =>
      seq($.Some_raw, $._nonempty_whitespace),
    Optional: $ =>
      seq($.Optional_raw, whitespace($)),
    Text: $ =>
      seq($.Text_raw, whitespace($)),
    List: $ =>
      seq($.List_raw, whitespace($)),
    equal: $ =>
      seq("=", whitespace($)),
    or: $ =>
      seq("||", whitespace($)),
    plus: $ =>
      seq("+", $._nonempty_whitespace),
    text_append: $ =>
      seq("++", whitespace($)),
    list_append: $ =>
      seq("#", $._nonempty_whitespace),
    and: $ =>
      seq("&&", whitespace($)),
    times: $ =>
      seq("*", whitespace($)),
    double_equal: $ =>
      seq("==", whitespace($)),
    not_equal: $ =>
      seq("!=", whitespace($)),
    dot: $ =>
      seq(".", whitespace($)),
    open_brace: $ =>
      seq("{", whitespace($)),
    close_brace: $ =>
      seq("}", whitespace($)),
    open_bracket: $ =>
      seq("[", whitespace($)),
    close_bracket: $ =>
      seq("]", whitespace($)),
    open_angle: $ =>
      seq("<", whitespace($)),
    close_angle: $ =>
      seq(">", whitespace($)),
    bar: $ =>
      seq("|", whitespace($)),
    comma: $ =>
      seq(",", whitespace($)),
    open_parens: $ =>
      seq("(", whitespace($)),
    close_parens: $ =>
      seq(")", whitespace($)),
    at: $ =>
      seq("@", whitespace($)),
    colon: $ =>
      seq(":", $._nonempty_whitespace),
    import_alt: $ =>
      seq("?", $._nonempty_whitespace),
    combine: $ =>
      seq(choice("\u2227", "/\\"), whitespace($)),
    combine_types: $ =>
      seq(choice("\u2A53", "//\\\\"), whitespace($)),
    prefer: $ =>
      seq(choice("\u2AFD", "//"), whitespace($)),
    lambda: $ =>
      seq(choice("\u03BB", "\\"), whitespace($)),
    forall: $ =>
      seq(choice("\u2200", "\x66\x6F\x72\x61\x6C\x6C"), whitespace($)),
    arrow: $ =>
      seq(choice("\u2192", "->"), whitespace($)),
    exponent: $ =>
      seq("e", optional(choice("+", "-")), repeat1($._DIGIT)),
    double_literal: $ =>
      seq(optional(choice("+", "-")), repeat1($._DIGIT), choice(seq(".", repeat1($._DIGIT), optional($.exponent)), $.exponent), whitespace($)),
    natural_literal_raw: $ =>
      repeat1($._DIGIT),
    integer_literal: $ =>
      seq(choice("+", "-"), $.natural_literal_raw, whitespace($)),
    natural_literal: $ =>
      seq($.natural_literal_raw, whitespace($)),
    identifier: $ =>
      seq($.label, optional(seq($.at, $.natural_literal_raw, whitespace($)))),
    identifier_reserved_prefix: $ =>
      seq($.reserved_raw, repeat1(choice($._ALPHA, $._DIGIT, "-", "/", "_")), whitespace($), optional(seq($.at, $.natural_literal_raw, whitespace($)))),
    identifier_reserved_namespaced_prefix: $ =>
      seq($.reserved_namespaced_raw, repeat1(choice($._ALPHA, $._DIGIT, "-", "/", "_")), whitespace($), optional(seq($.at, $.natural_literal_raw, whitespace($)))),
    missing: $ =>
      seq($.missing_raw, whitespace($)),
    // ; Printable characters other than " ()[]{}<>/\,",
    // ;,
    // ; Excluding those characters ensures that paths don't have to end with trailing,
    // ; whitespace most of the time,
    path_character: $ =>
      choice("\x21", /[\u0024-\u0027]/, /[\u002A-\u002B]/, /[\u002D-\u002E]/, /[\u0030-\u003B]/, "\x3D", /[\u0040-\u005A]/, /[\x5E-\x7A]/, "\x7C", "\x7E"),
    quoted_path_character: $ =>
      choice(/[\u0020-\u0021]/, /[\u0023-\u002E]/, /[\u0030-\uD7FF]/),
    path_component: $ =>
      seq("/", choice(repeat1($.path_character), seq("\x22", repeat1($.quoted_path_character), "\x22"))),
    file: $ =>
      $.path_component,
    local_raw: $ =>
      choice(seq("..", directory($), $.file), seq(".", directory($), $.file), seq("~", directory($), $.file), seq(directory($), $.file)),
    local: $ =>
      seq($.local_raw, whitespace($)),
    // ; `http[s]` URI grammar based on RFC7230 and RFC 3986 with some differences,
    // ; noted below,
    scheme: $ =>
      seq("\x68\x74\x74\x70", optional("\x73")),
    // ; NOTE: This does not match the official grammar for a URI.  Specifically, this,
    // ; replaces `path-abempty` with `directory file`,
    http_raw: $ =>
      seq($.scheme, "://", authority($), directory($), $.file, optional(seq("?", query($))), optional(seq("#", fragment($)))),
    // ; NOTE: Backtrack if parsing the optional user info prefix fails,
    IP_literal: $ =>
      seq("[", choice($.IPv6address, $.IPvFuture), "]"),
    IPvFuture: $ =>
      seq("v", repeat1($._HEXDIG), ".", repeat1(choice($.unreserved, $.sub_delims, ":"))),
    // ; NOTE: Backtrack when parsing each alternative,
    IPv6address: $ =>
      choice(seq(seq(seq($.h16, ":"), seq($.h16, ":"), seq($.h16, ":"), seq($.h16, ":"), seq($.h16, ":"), seq($.h16, ":")), $.ls32), seq("::", seq(seq($.h16, ":"), seq($.h16, ":"), seq($.h16, ":"), seq($.h16, ":"), seq($.h16, ":")), $.ls32), seq(optional($.h16), "::", seq(seq($.h16, ":"), seq($.h16, ":"), seq($.h16, ":"), seq($.h16, ":")), $.ls32), seq(optional(seq(seq(optional(seq($.h16, ":"))), $.h16)), "::", seq(seq($.h16, ":"), seq($.h16, ":"), seq($.h16, ":")), $.ls32), seq(optional(seq(seq(optional(seq($.h16, ":")), optional(seq($.h16, ":"))), $.h16)), "::", seq(seq($.h16, ":"), seq($.h16, ":")), $.ls32), seq(optional(seq(seq(optional(seq($.h16, ":")), optional(seq($.h16, ":")), optional(seq($.h16, ":"))), $.h16)), "::", $.h16, ":", $.ls32), seq(optional(seq(seq(optional(seq($.h16, ":")), optional(seq($.h16, ":")), optional(seq($.h16, ":")), optional(seq($.h16, ":"))), $.h16)), "::", $.ls32), seq(optional(seq(seq(optional(seq($.h16, ":")), optional(seq($.h16, ":")), optional(seq($.h16, ":")), optional(seq($.h16, ":")), optional(seq($.h16, ":"))), $.h16)), "::", $.h16), seq(optional(seq(seq(optional(seq($.h16, ":")), optional(seq($.h16, ":")), optional(seq($.h16, ":")), optional(seq($.h16, ":")), optional(seq($.h16, ":")), optional(seq($.h16, ":"))), $.h16)), "::")),
    h16: $ =>
      seq($._HEXDIG, optional($._HEXDIG), optional($._HEXDIG), optional($._HEXDIG)),
    ls32: $ =>
      choice(seq($.h16, ":", $.h16), $.IPv4address),
    IPv4address: $ =>
      seq($.dec_octet, ".", $.dec_octet, ".", $.dec_octet, ".", $.dec_octet),
    // ; NOTE: Backtrack when parsing these alternatives and try them in reverse order,
    dec_octet: $ =>
      prec(1, choice(
	$._DIGIT,
	seq(choice("1", "2", "3", "4", "5", "6", "7", "8", "9"), $._DIGIT),
	seq("1", seq($._DIGIT, $._DIGIT)),
	seq("2", choice("0", "1", "2", "3", "4"), $._DIGIT),
	seq("25", choice("0", "1", "2", "3", "4", "5")))),
    pchar: $ =>
      choice($.unreserved, $.pct_encoded, $.sub_delims, ":", "@"),
    pct_encoded: $ =>
      seq("%", $._HEXDIG, $._HEXDIG),
    unreserved: $ =>
      choice($._ALPHA, $._DIGIT, "-", ".", "_", "~"),
    sub_delims: $ =>
      choice("!", "$", "&", "'", "(", ")", "*", "+", ",", ";", "="),
    http: $ =>
      seq($.http_raw, whitespace($), optional(seq($.using, choice($.import_hashed, seq($.open_parens, $.import_hashed, $.close_parens))))),
    // ; Dhall supports unquoted environment variables that are Bash-compliant or,
    // ; quoted environment variables that are POSIX-compliant,
    env: $ =>
      seq("env:", choice($.bash_environment_variable, seq("\x22", $.posix_environment_variable, "\x22")), whitespace($)),
    // ; Bash supports a restricted subset of POSIX environment variables.  From the,
    // ; Bash `man` page, an environment variable name is:,
    // ;,
    // ; > A word consisting only of  alphanumeric  characters  and  under-scores,  and,
    // ; > beginning with an alphabetic character or an under-score,
    bash_environment_variable: $ =>
      seq(choice($._ALPHA, "_"), repeat(choice($._ALPHA, $._DIGIT, "_"))),
    // ; The POSIX standard is significantly more flexible about legal environment,
    // ; variable names, which can contain alerts (i.e. '\a'), whitespace, or,
    // ; punctuation, for example.  The POSIX standard says about environment variable,
    // ; names:,
    // ;,
    // ; > The value of an environment variable is a string of characters. For a,
    // ; > C-language program, an array of strings called the environment shall be made,
    // ; > available when a process begins. The array is pointed to by the external,
    // ; > variable environ, which is defined as:,
    // ; >,
    // ; >     extern char **environ;,
    // ; >,
    // ; > These strings have the form name=value; names shall not contain the,
    // ; > character '='. For values to be portable across systems conforming to IEEE,
    // ; > Std 1003.1-2001, the value shall be composed of characters from the portable,
    // ; > character set (except NUL and as indicated below).,
    // ;,
    // ; Note that the standard does not explicitly state that the name must have at,
    // ; least one character, but `env` does not appear to support this and `env`,
    // ; claims to be POSIX-compliant.  To be safe, Dhall requires at least one,
    // ; character like `env`,
    posix_environment_variable: $ =>
      repeat1($.posix_environment_variable_character),
    // ; These are all the characters from the POSIX Portable Character Set except for,
    // ; '\0' (NUL) and '='.  Note that the POSIX standard does not explicitly state,
    // ; that environment variable names cannot have NUL.  However, this is implicit,
    // ; in the fact that environment variables are passed to the program as,
    // ; NUL-terminated `name=value` strings, which implies that the `name` portion of,
    // ; the string cannot have NUL characters,
    posix_environment_variable_character: $ =>
      choice(seq("\x5C", choice("\x22", "\x5C", "\x61", "\x62", "\x66", "\x6E", "\x72", "\x74", "\x76")), /[\u0020-\u0021]/, /[\u0023-\u003C]/, /[\u003E-\u005B]/, /[\u005D-\u007E]/),
    import_type: $ =>
      choice($.missing, $.local, $.http, $.env),
    hash: $ =>
      seq("\x73\x68\x61\x32\x35\x36\x3A", seq($._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG, $._HEXDIG), whitespace($)),
    import_hashed: $ =>
      seq($.import_type, optional($.hash)),
    // ; "http://example.com",
    // ; "./foo/bar",
    // ; "env:FOO",
    import: $ =>
      // TODO: Consider whether dhall.abnf ought to be patched to
      // require 'nonempty-whitespace' before 'as'.

      // seq($.import_hashed, optional(seq($.as, $.Text))),
      seq($.import_hashed, optional(seq($._nonempty_whitespace, $.as, $.Text))),
    // ; NOTE: Every rule past this point should only reference rules that end with,
    // ; whitespace.  This ensures consistent handling of whitespace in the absence of,
    // ; a separate lexing step,
    expression: $ =>
      choice(seq($.lambda, $.open_parens, $.label, $.colon, $.expression, $.close_parens, $.arrow, $.expression), seq($.if, $.expression, $.then, $.expression, $.else, $.expression), seq(repeat1(seq($.let, $.label, optional(seq($.colon, $.expression)), $.equal, $.expression)), $.in, $.expression), seq($.forall, $.open_parens, $.label, $.colon, $.expression, $.close_parens, $.arrow, $.expression), seq($.operator_expression, $.arrow, $.expression), $.annotated_expression),
    annotated_expression: $ =>
      choice(seq($.merge, $.import_expression, $.import_expression, optional(seq($.colon, $.application_expression))), seq($.open_bracket, choice($.empty_collection, $.non_empty_optional)), seq($.operator_expression, optional(seq($.colon, $.expression)))),
    empty_collection: $ =>
      seq($.close_bracket, $.colon, choice($.List, $.Optional), $.import_expression),
    non_empty_optional: $ =>
      seq($.expression, $.close_bracket, $.colon, $.Optional, $.import_expression),
    operator_expression: $ =>
      $.import_alt_expression,
    import_alt_expression: $ =>
      seq($.or_expression, repeat(seq($.import_alt, $.or_expression))),
    or_expression: $ =>
      seq($.plus_expression, repeat(seq($.or, $.plus_expression))),
    plus_expression: $ =>
      seq($.text_append_expression, repeat(seq($.plus, $.text_append_expression))),
    text_append_expression: $ =>
      seq($.list_append_expression, repeat(seq($.text_append, $.list_append_expression))),
    list_append_expression: $ =>
      seq($.and_expression, repeat(seq($.list_append, $.and_expression))),
    and_expression: $ =>
      seq($.combine_expression, repeat(seq($.and, $.combine_expression))),
    combine_expression: $ =>
      seq($.prefer_expression, repeat(seq($.combine, $.prefer_expression))),
    prefer_expression: $ =>
      seq($.combine_types_expression, repeat(seq($.prefer, $.combine_types_expression))),
    combine_types_expression: $ =>
      seq($.times_expression, repeat(seq($.combine_types, $.times_expression))),
    times_expression: $ =>
      seq($.equal_expression, repeat(seq($.times, $.equal_expression))),
    equal_expression: $ =>
      seq($.not_equal_expression, repeat(seq($.double_equal, $.not_equal_expression))),
    not_equal_expression: $ =>
      seq($.application_expression, repeat(seq($.not_equal, $.application_expression))),
    // ; Import expressions need to be separated by some whitespace, otherwise there,
    // ; would be ambiguity: `./ab` could be interpreted as "import the file `./ab`",,
    // ; or "apply the import `./a` to label `b`",
    application_expression: $ =>
      prec.left(seq(optional($.Some), $.import_expression, repeat(seq($._whitespace_chunk, $.import_expression)))),
    import_expression: $ =>
      choice($.import, $.selector_expression),
    // ; `record.field` extracts one field of a record,
    // ;,
    // ; `record.{ field0, field1, field2 }` projects out several fields of a record,
    // ;,
    // ; NOTE: Backtrack when parsing the `*(dot ...)`.  The reason why is that you,
    // ; can't tell from parsing just the period whether "foo." will become "foo.bar",
    // ; (i.e. accessing field `bar` of the record `foo`) or `foo./bar` (i.e. applying,
    // ; the function `foo` to the relative path `./bar`),
    selector_expression: $ =>
      seq($.primitive_expression, repeat(seq($.dot, choice($.label, $.labels)))),
    // ; NOTE: Backtrack when parsing the first three alternatives (i.e. the numeric,
    // ; literals).  This is because they share leading characters in common,
    // ; NOTE: The reason why we have three different types of identifiers (that is:,
    // ; identifier, identifier-reserved-prefix, identifier-reserved-namespaced-prefix),
    // ; is that it's the only way to parse correctly identifiers that start with reserved,
    // ; words, other than using a lexer and use the longest match rule.,
    // ;,
    // ; Since reserved words can include themselves (e.g. 'List/build' includes 'List'),,
    // ; we have to match the "namespaced" reserved words before the identifiers prefixed,
    // ; by a reserved word.,
    primitive_expression: $ =>
      choice(
        $.double_literal,
        $.natural_literal,
        $.integer_literal,
        seq("-", $.Infinity_raw, whitespace($)),
        $.text_literal,
        seq($.open_brace, record_type_or_literal($), $.close_brace),
        seq($.open_angle, union_type_or_literal($), $.close_angle),
        $.non_empty_list_literal,
        $.identifier_reserved_namespaced_prefix,
        $.reserved_namespaced,
        $.identifier_reserved_prefix,
        $.reserved,
        $.identifier,
        seq($.open_parens, $.expression, $.close_parens)
      ),
    labels: $ =>
      seq($.open_brace, optional(seq($.label, repeat(seq($.comma, $.label)))), $.close_brace),
    non_empty_record_type_or_literal: $ =>
      seq($.label, choice($.non_empty_record_literal, $.non_empty_record_type)),
    non_empty_record_type: $ =>
      seq($.colon, $.expression, repeat(seq($.comma, $.label, $.colon, $.expression))),
    non_empty_record_literal: $ =>
      seq($.equal, $.expression, repeat(seq($.comma, $.label, $.equal, $.expression))),
    non_empty_union_type_or_literal: $ =>
      seq($.label, choice(seq($.equal, $.expression, repeat(seq($.bar, $.label, $.colon, $.expression))), seq($.colon, $.expression, optional(seq($.bar, $.non_empty_union_type_or_literal))))),
    non_empty_list_literal: $ =>
      seq($.open_bracket, $.expression, repeat(seq($.comma, $.expression)), $.close_bracket),
    // ; All expressions end with trailing whitespace.  This just adds a final,
    // ; whitespace prefix for the top-level of the program,
    complete_expression: $ =>
      seq(whitespace($), $.expression)

  }
});
