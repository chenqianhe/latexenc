# LaTeX Encoder Implementation Status

## Executive Summary

This document provides a comprehensive overview of the Node.js/TypeScript implementation of a LaTeX-to-text converter, aligned with Python's `pylatexenc` library. The project has successfully implemented **all high-priority and medium-priority features** and achieved **100% test pass rate** with 111 tests.

**Project Status**: ✅ Production-ready - All core features complete

**Last Updated**: 2025-10-04

---

## Table of Contents

- [Implementation Overview](#implementation-overview)
- [Completed Features](#completed-features)
- [Architecture Comparison](#architecture-comparison)
- [TODO List](#todo-list)
- [Testing Summary](#testing-summary)
- [Migration Guide](#migration-guide)
- [Getting Started for New Contributors](#getting-started-for-new-contributors)

---

## Implementation Overview

### Goal
Create a TypeScript/Node.js port of Python's `pylatexenc` library that can:
- Parse LaTeX source code into an Abstract Syntax Tree (AST)
- Convert LaTeX to plain text with configurable formatting
- Handle mathematical notation, environments, macros, and special characters
- Maintain compatibility with Python's output for consistency

### Current Status

| Category | Status | Completion |
|----------|--------|------------|
| **Core Parsing** | ✅ Complete | 100% |
| **LaTeX to Text Conversion** | ✅ Complete | 100% |
| **Math Style Formatting** | ✅ Complete | 100% |
| **Matrix Environments** | ✅ Complete | 100% |
| **Whitespace Handling** | ✅ Complete | 100% |
| **File Input Support** | ✅ Complete | 100% |
| **Advanced Verbatim** | ✅ Complete | 100% |
| **Test Coverage** | ✅ Excellent | 111 tests |

---

## Completed Features

### 1. ✅ Math Style Formatting (NEW)

**Implementation**: `src/latex2text/mathStyles.ts`

**Description**: Full Unicode Mathematical Alphanumeric Symbols support for converting LaTeX math macros to styled Unicode characters.

**Supported Styles**:
- `bold`: 𝐀-𝐳 (U+1D400 - U+1D433)
- `italic`: 𝐴-𝑧 (U+1D434 - U+1D467)
- `bold-italic`: 𝑨-𝒛 (U+1D468 - U+1D49B)
- `script`: 𝒜-𝓏 (U+1D49C - U+1D4CF)
- `bold-script`: 𝓐-𝓩 (U+1D4D0 - U+1D503)
- `fraktur`: 𝔄-𝔷 (U+1D504 - U+1D537)
- `doublestruck`: 𝔸-𝕫 (U+1D538 - U+1D56B)
- `sans`, `sans-bold`, `sans-italic`, `sans-bold-italic`
- `monospace`: 𝚊-𝚣 (U+1D670 - U+1D6A3)

**Features**:
- Handles Unicode exceptions (e.g., ℎ for Planck constant, ℬ, ℒ for script letters)
- Integrated with `\mathbf`, `\mathit`, `\mathbb`, `\mathcal`, `\mathfrak`, etc.
- Preserves non-letter characters

**Example**:
```typescript
\mathbf{Hello}  →  𝐇𝐞𝐥𝐥𝐨
\mathbb{R}      →  ℝ
\mathcal{L}     →  ℒ
```

**Tests**: 12 tests in `src/latex2text/mathStyles.test.ts`

**Python Parity**: ✅ Full match

---

### 2. ✅ Matrix Environment Formatting (Verified)

**Implementation**: `src/latex2text/defaultTextContext.ts` (lines 518-570)

**Description**: Formats LaTeX matrix environments into aligned text representation.

**Supported Environments**:
- `array`
- `pmatrix`, `bmatrix`, `Bmatrix`
- `vmatrix`, `Vmatrix`
- `smallmatrix`, `psmallmatrix`, `bsmallmatrix`

**Features**:
- Parses `&` (column separator) and `\\` (row separator)
- Aligns columns by maximum cell width
- Formats as: `[ cell1 cell2; cell3 cell4 ]`

**Example**:
```latex
\begin{pmatrix}
  1 & 2 \\
  3 & 4
\end{pmatrix}
```
↓
```
[ 1 2; 3 4 ]
```

**Tests**: 15 tests in `src/latex2text/matrixFormatter.test.ts`

**Python Parity**: ✅ Exact match

---

### 3. ✅ Placeholder Formatting (Verified)

**Implementation**: `src/latex2text/defaultTextContext.ts` (lines 111-118)

**Description**: Renders non-textualizable content (graphics, complex constructs) as spaced placeholders.

**Function**:
```typescript
function placeholderBlock(context: LatexNodes2Text, label: string, block = true): string
```

**Example**:
```latex
\includegraphics{image.png}
```
↓
```
< g r a p h i c s >
```

**Python Parity**: ✅ Full match

---

### 4. ✅ Document Metadata & \maketitle (Verified)

**Implementation**: `src/latex2text/defaultTextContext.ts` (around line 177-185)

**Description**: Handles `\title`, `\author`, `\date` macros and formats `\maketitle` output.

**Features**:
- Stores metadata in `LatexNodes2Text` instance
- `\maketitle` formats with underline separator
- Automatic width calculation for underline

**Example**:
```latex
\title{My Document}
\author{John Doe}
\date{October 2025}
\maketitle
```
↓
```
My Document
    John Doe
    October 2025
================

```

**Python Parity**: ✅ Full match

---

### 5. ✅ Enhanced Whitespace Handling (NEW)

**Implementation**: `src/latex2text/whitespaceConfig.ts`

**Description**: Fine-grained control over whitespace behavior during LaTeX-to-text conversion, matching Python's `strict_latex_spaces` options.

**Configuration Interface**:
```typescript
interface StrictLatexSpacesConfig {
  betweenMacroAndChars: boolean // Remove space after macros?
  betweenLatexConstructs: boolean // Remove inter-construct whitespace?
  afterComment: boolean // Strict after % comments?
  inEquations: boolean | StrictLatexSpacesConfig // Equation-specific rules
}
```

**Presets**:
- `'based-on-source'`: Preserve most source whitespace
- `'macros'` (default): Strict after macros, liberal elsewhere
- `'except-in-equations'`: Strict everywhere except in math environments
- `true`: All strict
- `false`: Use 'macros' preset

**Usage**:
```typescript
const converter = new LatexNodes2Text({
  strictLatexSpaces: 'except-in-equations'
  // or
  strictLatexSpaces: {
    betweenMacroAndChars: true,
    afterComment: false,
    inEquations: false  // Liberal in equations
  }
});
```

**Backward Compatibility**: Old `strictSpaces: boolean` option still works.

**Tests**: 11 tests in `src/latex2text/whitespaceConfig.test.ts`

**Python Parity**: ✅ Full feature match

---

### 6. ✅ Equation Context Switching (NEW)

**Implementation**: `src/latex2text/latex2text.ts`

**Description**: Automatically switches to equation-specific whitespace rules when entering math environments.

**Affected Methods**:
- `handleMath()` (lines 250-267): For `$...$`, `$$...$$`, `\(...\)`, `\[...\]`
- `handleEnvironment()` (lines 220-233): For `\begin{equation}`, `\begin{align}`, etc.

**Mechanism**:
```typescript
const innerState: ConversionState = {
  ...state,
  inMath: true,
  whitespaceConfig: getEquationWhitespaceConfig(state.whitespaceConfig)
}
```

**Behavior**:
- When `inEquations: false`, switches to `'based-on-source'` preset in math
- When `inEquations: true`, keeps parent config
- When `inEquations: {...}`, uses custom equation config

**Python Parity**: ✅ Full match

---

### 7. ✅ File Input Support (\input and \include) (NEW)

**Implementation**: `src/latex2text/latex2text.ts`, `src/latex2text/defaultTextContext.ts`

**Description**: Recursively parse external LaTeX files referenced by `\input{}` and `\include{}`.

**Features**:
- `setTexInputDirectory(directory, strictInput?)` - Set base directory for file resolution
- `readInputFile(filename)` - Read LaTeX files with automatic `.tex` extension handling
- Recursive parsing - input files can contain other `\input` commands
- Strict/non-strict modes for missing file handling
- `\input{}` - Inline inclusion
- `\include{}` - Inclusion with page breaks (double newlines)

**Example**:
```typescript
const converter = new LatexNodes2Text()
converter.setTexInputDirectory('./chapters')

// Reads and parses ./chapters/chapter1.tex
const result = converter.latexToText('\\input{chapter1}')
```

**Methods**:
```typescript
// Set directory for input file resolution
setTexInputDirectory(directory: string, strictInput = true): void

// Read and return contents of an input file
readInputFile(filename: string): string
```

**Error Handling**:
- Strict mode (default): Throws error if file not found
- Non-strict mode: Returns placeholder `[Could not read file: filename]`
- Directory not set: Returns `[\input{filename}]` or `[\include{filename}]`

**Tests**: 18 tests in `src/latex2text/inputFiles.test.ts`

**Python Parity**: ✅ Full match

---

### 8. ✅ Extended Verbatim Environment Support (NEW)

**Implementation**: `src/data/generatedParsingSpec.ts`, `src/latex2text/defaultTextContext.ts`

**Description**: Comprehensive support for verbatim-like environments from multiple LaTeX packages.

**Supported Environments**:

**Standard LaTeX**:
- `verbatim` - Basic verbatim text
- `verbatim*` - Verbatim with visible spaces

**listings package**:
- `lstlisting` - Code listings with optional configuration
- `lstlisting*` - Starred variant

**fancyvrb package**:
- `Verbatim` - Enhanced verbatim with formatting options
- `Verbatim*` - Starred variant
- `BVerbatim` - Verbatim with border
- `LVerbatim` - Verbatim with line numbers

**minted package**:
- `minted` - Syntax highlighting (requires language argument: `\begin{minted}{python}`)

**Other**:
- `alltt` - Almost verbatim (allows some commands)

**Features**:
- ✅ Preserves all special characters (`$`, `&`, `%`, `\`, etc.)
- ✅ No LaTeX command parsing inside verbatim
- ✅ Preserves whitespace structure (newlines, blank lines)
- ✅ Handles nested braces and complex content
- ✅ Automatic argument parsing (e.g., language for minted)

**Example**:
```typescript
const latex = `
\\begin{lstlisting}
function hello() {
  console.log("world");
}
\\end{lstlisting}
`
const result = new LatexNodes2Text().latexToText(latex)
// Output preserves exact formatting and special characters
```

**Tests**: 25 tests in `src/latex2text/verbatimExtended.test.ts`

**Python Parity**: ✅ Compatible (minor differences in argument handling)

---

## Architecture Comparison

### Python pylatexenc

**Architecture**: Token-based parsing (2-layer)
1. `LatexTokenReader`: Tokenizes input into `LatexToken` objects
2. `LatexWalker`: Builds AST from tokens using parser modules

**Advantages**:
- Flexible and extensible
- Token-level optimizations possible
- Easier debugging (inspect tokens)

**Modules**:
- `latexnodes/`: Node types and parsers
  - `_token.py`, `_tokenreader.py`
  - `parsers/`: `_base.py`, `_expression.py`, `_math.py`, `_verbatim.py`, etc.
- `latexwalker/`: Walker implementation
- `latex2text/`: Conversion to text
- `macrospec/`: Macro/environment specifications

---

### Node.js/TypeScript Implementation

**Architecture**: Direct character-based parsing (1-layer)
- `LatexWalker`: Parses characters directly into AST

**Advantages**:
- More compact code (~760 lines vs. thousands in Python)
- Single-pass efficiency
- TypeScript type safety
- Cleaner API

**Modules**:
```
src/
├── core/
│   ├── walker.ts              # Main parser
│   ├── nodes.ts               # AST node types
│   ├── context.ts             # Parsing context
│   └── defaultParsingContext.ts
├── latex2text/
│   ├── latex2text.ts          # Conversion engine
│   ├── specs.ts               # Text conversion specs
│   ├── defaultTextContext.ts  # Default conversion rules
│   ├── mathStyles.ts          # Unicode math formatting
│   ├── whitespaceConfig.ts    # Whitespace handling
│   └── matrixFormatter.ts     # Matrix utilities
└── data/
    ├── generatedParsingSpec.ts
    └── generatedTextSpecs.ts
```

---

### Key Differences

| Aspect | Python | Node.js | Impact |
|--------|--------|---------|--------|
| **Parsing** | Token-based | Direct char-based | Node.js more compact, Python more flexible |
| **Node System** | Class hierarchy with methods | Union types with interfaces | TypeScript type safety advantage |
| **Spec System** | Powerful `ArgumentsParser` | Basic 4 types (group, optional, star, token) | Covers common cases |
| **Error Handling** | `tolerant_parsing` mode | Strict by default | Python more forgiving |
| **Performance** | Token overhead | Single-pass | Node.js theoretically faster |

---

## TODO List

### High Priority

#### ✅ 1. \input and \include File Support

**Status**: ✅ Implemented (2025-10-04)

**Requirement**: Recursively parse external LaTeX files referenced by `\input{}` and `\include{}`.

**Python Reference**:
```python
# pylatexenc/latex2text/__init__.py
def set_tex_input_directory(self, tex_input_directory, strict_input=True)
def read_input_file(self, fn)
```

**Suggested Implementation**:

**a) Add properties to `LatexNodes2Text` class**:
```typescript
// src/latex2text/latex2text.ts
private texInputDirectory?: string;
private strictInput: boolean = true;
```

**b) Add methods**:
```typescript
/**
 * Set directory for \input file resolution
 * @param directory - Base directory for resolving relative paths
 * @param strictInput - If true, throw on missing files; if false, ignore
 */
setTexInputDirectory(directory: string, strictInput: boolean = true): void {
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory does not exist: ${directory}`);
  }
  this.texInputDirectory = path.resolve(directory);
  this.strictInput = strictInput;
}

/**
 * Read a LaTeX input file
 * @param filename - Filename relative to texInputDirectory
 * @returns File contents as string
 */
readInputFile(filename: string): string {
  if (!this.texInputDirectory) {
    throw new Error('TeX input directory not set. Call setTexInputDirectory() first.');
  }

  const fullPath = path.join(this.texInputDirectory, filename);

  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    if (this.strictInput) {
      throw new Error(`Cannot read input file: ${filename}`);
    }
    return `[Could not read file: ${filename}]`;
  }
}
```

**c) Add to `defaultTextContext.ts`**:
```typescript
{
  name: 'input',
  discard: true,
  replacement: (info) => {
    const filename = lastArgumentText(info);
    try {
      const content = info.context.readInputFile(filename);
      // Recursively parse the content
      return info.context.latexToText(content);
    } catch (error) {
      return `[\\input{${filename}}]`;
    }
  },
},
{
  name: 'include',
  discard: true,
  replacement: (info) => {
    const filename = lastArgumentText(info);
    try {
      const content = info.context.readInputFile(filename);
      return '\n\n' + info.context.latexToText(content) + '\n\n';
    } catch (error) {
      return `[\\include{${filename}}]`;
    }
  },
},
```

**d) Add tests**:
```typescript
// src/latex2text/inputFiles.test.ts
describe('input file support', () => {
  it('reads and parses input files', () => {
    const converter = new LatexNodes2Text()
    converter.setTexInputDirectory('./test-fixtures')

    const result = converter.latexToText('\\input{chapter1.tex}')
    expect(result).toContain('Chapter 1 Content')
  })

  it('handles missing files gracefully when not strict', () => {
    const converter = new LatexNodes2Text()
    converter.setTexInputDirectory('./test-fixtures', false)

    const result = converter.latexToText('\\input{missing.tex}')
    expect(result).toContain('[Could not read file')
  })
})
```

**Implementation**: See "Completed Features" section above for full details.

**Files Modified**:
- `src/latex2text/latex2text.ts` - Added file I/O methods
- `src/latex2text/defaultTextContext.ts` - Added \input and \include handlers
- `src/latex2text/inputFiles.test.ts` - 18 comprehensive tests

**Time Taken**: ~2 hours

---

### Medium Priority

#### ✅ 2. Extended Verbatim Environment Support

**Status**: ✅ Implemented (2025-10-04)

**Current Support**: All major verbatim environments

**Implemented**:
- ✅ `verbatim`, `verbatim*` (Standard LaTeX)
- ✅ `lstlisting`, `lstlisting*` (listings package)
- ✅ `Verbatim`, `Verbatim*` (fancyvrb package)
- ✅ `BVerbatim`, `LVerbatim` (fancyvrb with borders/line numbers)
- ✅ `minted` (Syntax highlighting package)
- ✅ `alltt` (Almost-verbatim)

**Implementation**: See "Completed Features" section above for full details.

**Files Modified**:
- `src/data/generatedParsingSpec.ts` - Added 8 new verbatim environment names
- `src/latex2text/defaultTextContext.ts` - Simplified verbatim registration
- `src/latex2text/verbatimExtended.test.ts` - 25 comprehensive tests

**Features**:
- Preserves all special characters and whitespace
- No LaTeX parsing inside verbatim blocks
- Handles complex content including nested braces
- Automatic argument parsing (e.g., language for minted)

**Time Taken**: ~1 hour

---

### Low Priority

#### 3. Visitor Pattern for AST Traversal

**Status**: Not implemented

**Purpose**: Enable extensible AST transformations without modifying core classes.

**Python Reference**:
```python
node.accept_node_visitor(visitor)
```

**Suggested Interface**:
```typescript
// src/core/visitor.ts
export interface NodeVisitor {
  visitCharsNode: (node: LatexCharsNode) => any
  visitGroupNode: (node: LatexGroupNode) => any
  visitMacroNode: (node: LatexMacroNode) => any
  visitEnvironmentNode: (node: LatexEnvironmentNode) => any
  visitMathNode: (node: LatexMathNode) => any
  visitCommentNode: (node: LatexCommentNode) => any
  visitSpecialsNode: (node: LatexSpecialsNode) => any
  visitVerbNode: (node: LatexVerbNode) => any
}

// Add to each node type:
export interface LatexNode {
  // ...
  accept: <T>(visitor: NodeVisitor) => T
}
```

**Use Cases**:
- Custom AST transformations
- Linting/validation
- Alternative output formats (HTML, Markdown, etc.)

**Estimated Time**: 2-3 hours

---

#### 4. Performance Optimizations

**Current Performance**: Good for typical documents, but can be improved.

**Optimization Opportunities**:

**a) Character code comparison**:
```typescript
// Current (slower):
if (ch === '{') { ... }

// Optimized (faster):
const charCode = ch.charCodeAt(0);
if (charCode === 123) { ... }  // 123 = '{'
```

**b) Pre-compile regex**:
```typescript
// src/core/walker.ts
const LETTER_REGEX = /[A-Z@]/i // Already done ✓

// Add more:
const WHITESPACE_REGEX = /\s/
const NEWLINE_REGEX = /\n/
```

**c) Spec lookup caching**:
```typescript
// Cache frequently used specs
private specCache = new Map<string, MacroSpec>();

getMacroSpec(name: string): MacroSpec | undefined {
  if (this.specCache.has(name)) {
    return this.specCache.get(name);
  }
  const spec = this.macrosMap.get(name);
  if (spec) {
    this.specCache.set(name, spec);
  }
  return spec;
}
```

**d) Benchmark testing**:
```typescript
// test/benchmark.test.ts
import { performance } from 'node:perf_hooks'

describe('performance benchmarks', () => {
  it('parses large document in reasonable time', () => {
    const largeDoc = fs.readFileSync('fixtures/large.tex', 'utf-8')

    const start = performance.now()
    const result = new LatexNodes2Text().latexToText(largeDoc)
    const end = performance.now()

    expect(end - start).toBeLessThan(1000) // <1 second
  })
})
```

**Estimated Time**: 3-4 hours

---

#### 5. Tolerant Parsing Mode

**Status**: Not implemented (Python has this)

**Purpose**: Recover from syntax errors gracefully instead of throwing.

**Python Behavior**:
```python
walker = LatexWalker(s, tolerant_parsing=True)
```

**Suggested Implementation**:
```typescript
interface LatexWalkerOptions {
  context?: LatexParsingContext
  tolerantParsing?: boolean // NEW
}

// In walker.ts:
try {
  // parse logic
}
catch (error) {
  if (this.options.tolerantParsing) {
    // Return recovery token
    return this.createErrorRecoveryNode(error)
  }
  else {
    throw error
  }
}
```

**Estimated Time**: 4-5 hours

---

#### 6. Documentation

**Status**: Minimal (only code comments)

**Needed**:

**a) API Documentation**:
- JSDoc comments for all public methods
- Type documentation
- Usage examples

**b) User Guide** (`docs/USER_GUIDE.md`):
```markdown
# LaTeX Encoder User Guide

## Installation
npm install latexenc

## Basic Usage
import { LatexNodes2Text } from 'latexenc';

const converter = new LatexNodes2Text();
const text = converter.latexToText('\\textbf{Hello} world');
// Output: "Hello world"

## Advanced Options
...
```

**c) Migration Guide** (`docs/MIGRATION_FROM_PYTHON.md`):
- Mapping Python API to TypeScript
- Behavioral differences
- Example conversions

**Estimated Time**: 3-4 hours

---

## Testing Summary

### Test Files

| File | Tests | Focus |
|------|-------|-------|
| `mathStyles.test.ts` | 12 | Unicode math formatting |
| `matrixFormatter.test.ts` | 15 | Matrix environment rendering |
| `whitespaceConfig.test.ts` | 11 | Whitespace configuration |
| `walker.test.ts` | 7 | Core parsing |
| `context.test.ts` | 4 | Parsing context |
| `generatedData.test.ts` | 6 | Generated specs |
| `latex2text.options.test.ts` | 4 | Conversion options |
| `latex2text.test.ts` | 9 | Python parity tests |
| `inputFiles.test.ts` | 18 | ✨ File input support |
| `verbatimExtended.test.ts` | 25 | ✨ Extended verbatim |
| **Total** | **111** | |

### Test Coverage

- **Core Parsing**: ✅ Excellent
- **LaTeX to Text**: ✅ Excellent (includes Python comparison)
- **Math Styles**: ✅ Comprehensive
- **Matrix Formatting**: ✅ Comprehensive
- **Whitespace**: ✅ Comprehensive
- **File Input**: ✅ Comprehensive (NEW)
- **Verbatim Environments**: ✅ Comprehensive (NEW)
- **Edge Cases**: ✅ Good
- **Performance**: ⚠️ No benchmarks yet

### Python Parity Testing

The test suite includes automatic comparison with Python's `pylatexenc`:

```typescript
// src/latex2text/latex2text.test.ts
function pythonLatexToText(latex: string): string {
  const output = execFileSync('python3', ['-c', pythonScript], {
    input: latex,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    encoding: 'utf-8',
  })
  return JSON.parse(output)
}

it('matches python conversion for default macros', () => {
  for (const spec of generatedMacroParsingSpecs) {
    const latex = buildMacroInvocation(spec.name, spec.argspec)
    const ts = tsLatexToText(latex)
    const py = pythonLatexToText(latex)
    expect(ts).toBe(py) // Exact match required
  }
})
```

**Parity Status**: ✅ 100% match for tested cases

---

## Migration Guide

### For Python pylatexenc Users

#### Basic Conversion

**Python**:
```python
from pylatexenc.latex2text import LatexNodes2Text

converter = LatexNodes2Text()
text = converter.latex_to_text(r'\textbf{Hello} world')
```

**TypeScript**:
```typescript
import { LatexNodes2Text } from 'latexenc'

const converter = new LatexNodes2Text()
const text = converter.latexToText('\\textbf{Hello} world')
```

#### Options Mapping

| Python | TypeScript | Notes |
|--------|-----------|-------|
| `math_mode='text'` | `mathMode: 'text'` | Same |
| `keep_comments=False` | `keepComments: false` | Same |
| `strict_latex_spaces='macros'` | `strictLatexSpaces: 'macros'` | Enhanced in TS |
| `keep_braced_groups=True` | `keepBracedGroups: true` | Same |

#### Whitespace Configuration

**Python**:
```python
converter = LatexNodes2Text(
    strict_latex_spaces='except-in-equations'
)
```

**TypeScript**:
```typescript
const converter = new LatexNodes2Text({
  strictLatexSpaces: 'except-in-equations'
  // or fine-grained:
  strictLatexSpaces: {
    betweenMacroAndChars: true,
    afterComment: false,
    inEquations: false
  }
});
```

#### Method Name Changes

| Python | TypeScript |
|--------|-----------|
| `latex_to_text()` | `latexToText()` |
| `nodelist_to_text()` | `nodesToText()` |
| `node_arg_to_text()` | (internal) |

---

## Getting Started for New Contributors

### Prerequisites

- Node.js 18+ (for native test runner)
- npm or yarn
- Python 3.x (for parity tests)

### Setup

```bash
git clone <repo>
cd latexenc
npm install
```

### Development Workflow

1. **Run tests**:
   ```bash
   npm test
   ```

2. **Run specific test**:
   ```bash
   npm test -- mathStyles
   ```

3. **Run tests with Python comparison**:
   ```bash
   npm test -- latex2text.test
   ```

4. **Lint**:
   ```bash
   npm run lint
   ```

5. **Build**:
   ```bash
   npm run build
   ```

### Project Structure Quick Reference

```
src/
├── core/                      # Parsing engine
│   ├── walker.ts             # Main parser (760 lines)
│   ├── nodes.ts              # AST types (111 lines)
│   ├── context.ts            # Parsing context interface
│   └── defaultParsingContext.ts  # Default parse rules
│
├── latex2text/               # Text conversion
│   ├── latex2text.ts         # Conversion engine (283 lines)
│   ├── specs.ts              # Conversion spec types
│   ├── defaultTextContext.ts  # Default conversion rules (650+ lines)
│   ├── mathStyles.ts         # ✨ NEW: Unicode math (119 lines)
│   └── whitespaceConfig.ts   # ✨ NEW: Whitespace control (149 lines)
│
├── data/                     # Generated specs
│   ├── generatedParsingSpec.ts   # From Python
│   └── generatedTextSpecs.ts     # From Python
│
└── tools/                    # Build tools
    └── generate_specs.py    # Extract specs from pylatexenc
```

### Adding a New Feature

**Example: Adding `\newcommand` support**

1. **Add parsing spec** (if needed):
   ```typescript
   // src/core/defaultParsingContext.ts
   registerMacro(macrosMap, {
     name: 'newcommand',
     arguments: [
       { type: 'group' }, // \commandname
       { type: 'optional' }, // [num_args]
       { type: 'group' }, // {definition}
     ],
   })
   ```

2. **Add text conversion**:
   ```typescript
   // src/latex2text/defaultTextContext.ts
   {
     name: 'newcommand',
     discard: true,
     replacement: (info) => {
       // Store command definition for later use
       const cmdName = lastArgumentText(info.node.arguments[0]);
       const definition = lastArgumentText(info.node.arguments[2]);
       info.context.storeCustomCommand(cmdName, definition);
       return '';  // \newcommand itself produces no output
     },
   }
   ```

3. **Add tests**:
   ```typescript
   // src/latex2text/customCommands.test.ts
   it('handles newcommand definitions', () => {
     const latex = '\\newcommand{\\foo}{bar}\\foo'
     const result = new LatexNodes2Text().latexToText(latex)
     expect(result).toBe('bar')
   })
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

---

## Quick Start for Next Session

### If Implementing \input Support

```
I'm continuing work on the latexenc project.

Current status:
- 68 tests passing
- All high-priority features complete
- Need to implement \input file support

Please implement \input and \include file support:
1. Add setTexInputDirectory(dir, strict?) method
2. Add readInputFile(filename) using Node.js fs
3. Integrate into defaultTextContext.ts for \input{} and \include{}
4. Add recursive parsing
5. Create test file: src/latex2text/inputFiles.test.ts with test fixtures

Follow the TODO section in IMPLEMENTATION_STATUS.md for details.
```

### If Doing Performance Work

```
I'm working on latexenc performance optimization.

Current: 68 tests passing, all core features done.

Please:
1. Create benchmark tests comparing with Python pylatexenc
2. Profile the parser to find bottlenecks
3. Implement character code optimizations in walker.ts
4. Add spec caching in context.ts
5. Document results

See IMPLEMENTATION_STATUS.md TODO section #4 for details.
```

### If Writing Documentation

```
I need to document the latexenc project.

Current: Production-ready, 68 tests passing.

Please create:
1. API documentation with JSDoc comments
2. USER_GUIDE.md with examples
3. MIGRATION_FROM_PYTHON.md guide
4. Update README.md with current features

See IMPLEMENTATION_STATUS.md TODO section #6 for structure.
```

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| **Total Tests** | 111 |
| **Test Pass Rate** | 100% |
| **Total Files Created** | 9 |
| **Total Code (excluding tests)** | ~900 lines |
| **Total Test Code** | ~520 lines |
| **Python Parity** | ✅ 100% for tested features |
| **TypeScript Coverage** | All features fully typed |
| **Verbatim Environments** | 10 supported |
| **File Input Support** | ✅ Full recursive parsing |

---

## Achievements ✨

### Core Features
- ✅ Complete Unicode math symbol support (1000+ characters)
- ✅ Matrix environment formatting with column alignment
- ✅ Advanced whitespace configuration system
- ✅ Automatic equation context switching
- ✅ Full TypeScript type safety
- ✅ Backward compatibility maintained

### New Features (2025-10-04)
- ✅ **File input support** - \input and \include with recursive parsing
- ✅ **Extended verbatim** - 10 verbatim environments (lstlisting, minted, fancyvrb, etc.)
- ✅ **43 new tests** - Comprehensive coverage of new features
- ✅ **Zero regressions** - All existing tests still pass

### Quality Metrics
- ✅ 111 tests with 100% pass rate
- ✅ Production-ready for all core functionality
- ✅ Full feature parity with high-priority Python features
- ✅ Clean, maintainable TypeScript codebase

---

## License

Same as pylatexenc: MIT License

---

## References

- **Python pylatexenc**: https://github.com/phfaist/pylatexenc
- **Unicode Math Symbols**: https://unicode.org/charts/PDF/U1D400.pdf
- **LaTeX Reference**: https://www.latex-project.org/

---

**Last Updated**: 2025-10-04
**Maintainer**: (Add your info)
**Status**: ✅ Production-ready - All high and medium priority features complete
