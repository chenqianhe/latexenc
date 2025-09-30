# latexenc (TypeScript)

This package reimplements a subset of the functionality provided by the
[`pylatexenc`](pylatexenc/README.rst) Python project in TypeScript.  It is
focused on parsing LaTeX snippets and producing a plain text representation,
mirroring the role of the original project's `latexwalker` and `latex2text`
modules.

## Features

- Recursive-descent LaTeX parser (`LatexWalker`) that builds an AST of LaTeX
  nodes (macros, groups, environments, math segments, comments, specials).
- Configurable parsing context for known macros/environments with default specs
  derived from the Python implementation.
- Text conversion engine (`LatexNodes2Text`) with macro, environment, and
  specials handlers, including accent resolution and a collection of common
  math/text macros.
- Extensible contexts so callers can register their own parsing or text
  handling behaviour.
- Starter tests demonstrating conversion of common LaTeX constructs.

## Usage

```ts
import { LatexNodes2Text } from 'latexenc'

const latex = 'Fran\\c{c}ais $= \\alpha + \\frac{1}{2}$'
const text = new LatexNodes2Text().latexToText(latex)
console.log(text) // Français = α + 1/2
```

To use custom contexts:

```ts
import {
  LatexNodes2Text,
  LatexParsingContext,
  LatexTextContext,
  createDefaultParsingContext,
  createDefaultTextContext,
} from 'latexenc'

const parsing = createDefaultParsingContext()
const textContext = createDefaultTextContext()
// add your own macro definitions here

const converter = new LatexNodes2Text({ parsingContext: parsing, textContext })
```

## Development

1. Install dependencies (TypeScript is required for compilation):

   ```sh
   npm install
   ```

2. Build the project:

   ```sh
   npm run build
   ```

3. Run the example test suite with Vitest:

   ```sh
   npm test
   ```

4. Lint the codebase using the Antfu ESLint rules:

   ```sh
   npm run lint
   ```

> **Note**: The automated tests use [Vitest](https://vitest.dev/) in a Node
> environment. Ensure you are using Node.js 18+.

## Limitations & Future Work

- The parser and text conversion cover a representative subset of `pylatexenc`
  but do not yet achieve feature parity. Complex argument parsers, verbatim
  environments, math spacing rules, and many specialised macros are currently
  simplified.
- Whitespace handling is intentionally conservative; LaTeX's exhaustive spacing
  rules are not fully replicated.
- Math mode conversion defaults to a textual approximation. Rendering delimited
  or verbatim math can be enabled via the `mathMode` option but equation layout
  remains heuristic.
- `npm install` is required before running the build, lint, or test scripts
  because the sandbox does not ship with TypeScript or Vitest preinstalled.

Contributions are welcome—extending the default contexts or porting additional
`pylatexenc` features is straightforward thanks to the modular structure.
