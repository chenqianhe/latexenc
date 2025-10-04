# latexenc (TypeScript)

TypeScript reimplementation of the most commonly used pieces of the
[`pylatexenc`](pylatexenc/README.rst) toolkit. It provides a LaTeX parser and a
configurable text conversion engine that mirror `latexwalker` and `latex2text`
from the original Python project while exposing a strongly typed API.

## Feature Highlights

- Recursive-descent parser (`LatexWalker`) that produces an AST of LaTeX nodes.
- Default parsing and text contexts generated from the upstream `pylatexenc`
  specifications (macros, environments, specials).
- Token parsing that mirrors TeX: mandatory arguments accept bare tokens (so
  `\\hat x` and similar constructs work without extra braces).
- Text conversion engine (`LatexNodes2Text`) with pluggable handlers, accent and
  math macro support, and helpers for document metadata (`\title`, `\author`,
  `\date`).
- `\\verb` macros and common verbatim environments (`verbatim`, `lstlisting`, …)
  are detected automatically using metadata from the Python project, so their
  bodies are preserved exactly.
- First-class TypeScript types for all nodes, specs, and conversion hooks to
  make extending behaviour predictable.
- Source TypeScript in `src/` with ESM output in `dist/` produced by `tsc`.

## Usage

### Convert LaTeX to text

```ts
import { LatexNodes2Text } from 'latexenc'

const latex = '\n\\title{Sample Slides}\nFran\\c{c}ais $= \\alpha + \\frac{1}{2}$'

const converter = new LatexNodes2Text({ mathMode: 'text' })
const text = converter.latexToText(latex)

console.log(text)
// Français = α + 1/2
console.log(converter.getDocumentMetadata('title'))
// "Sample Slides"
```

`latexToText()` performs the parsing step internally. If you already have nodes
from `LatexWalker`, call `nodesToText(nodes)` instead.

### Customise contexts

```ts
import {
  LatexNodes2Text,
  createDefaultParsingContext,
  createDefaultTextContext,
} from 'latexenc'

const parsing = createDefaultParsingContext()
parsing.addMacro({ name: 'vect', arguments: [{ type: 'group' }] })

const textContext = createDefaultTextContext()
textContext.addMacro({
  name: 'vect',
  replacement: ({ toText, node }) => {
    const arg = node.arguments[0]
    return arg?.type === 'group' ? `->${toText(arg.nodes)}` : ''
  },
})

const converter = new LatexNodes2Text({ parsingContext: parsing, textContext })
```

Contexts can be cloned via `.clone()` before mutation if you need separate
configurations.

### Parse without conversion

```ts
import { LatexWalker } from 'latexenc'

const walker = new LatexWalker('Hello \\textbf{world}!')
const nodes = walker.getNodes()
// nodes is LatexNode[] that you can analyse or transform directly.
```

### Key conversion options

`LatexNodes2Text` accepts these notable options:

- `mathMode`: `'text' | 'with-delimiters' | 'verbatim' | 'remove'` to control
  math rendering.
- `keepComments`: include or drop `%` comments.
- `strictSpaces`: collapse runs of whitespace to a single space/newline.
- `keepBracedGroups` and `keepBracedGroupsMinLength`: preserve braces for groups
  that meet a minimum length requirement.

## Generated default specs

The default parsing/text contexts are derived from the vendored
`pylatexenc/` source. Re-run the generator whenever upstream specs change:

```sh
python3 tools/generate_specs.py
```

This refreshes `src/data/generatedParsingSpec.ts` and
`src/data/generatedTextSpecs.ts`, which are consumed by the default context
factories. The generator bakes several literal replacements (for example the
value returned by `\today`), so re-run it if you need up-to-date defaults.

## Development

1. Install dependencies (Node.js 18+ recommended):

   ```sh
   npm install
   ```

2. Build the ESM bundle in `dist/`:

   ```sh
   npm run build
   ```

3. Execute the Vitest suite:

   ```sh
   npm test
   ```

4. Lint the codebase (runs ESLint with the Antfu config; `--fix` is enabled and
   will update files in place):

   ```sh
   npm run lint
   ```

## Limitations & Future Work

- The project ports a meaningful subset of `pylatexenc` but not complete parity;
  complex argument parsers, verbatim environments, and fine-grained spacing
  rules are simplified.
- Math mode conversion is heuristic and biased toward plain-text readability.
- The default specs mirror a snapshot of upstream data. Regenerate them after
  pulling new changes from the Python project or when date-sensitive macros (for
  example `\today`) must reflect the current day.
- `npm install` must precede build/test/lint because TypeScript and Vitest are
  dev dependencies.

Contributions are welcome—extending the default contexts or porting additional
`pylatexenc` features is straightforward thanks to the modular structure.
