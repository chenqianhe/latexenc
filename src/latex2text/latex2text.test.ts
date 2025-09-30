import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { generatedEnvironmentParsingSpecs, generatedMacroParsingSpecs, generatedSpecialParsingSpecs } from '../data/generatedParsingSpec'
import { LatexNodes2Text } from './latex2text'

const projectRoot = path.resolve(process.cwd())
const pythonModulePath = path.join(projectRoot, 'pylatexenc')

const pythonScript = `import sys, json, os
sys.path.insert(0, os.path.abspath(${JSON.stringify(pythonModulePath)}))
from pylatexenc.latex2text import LatexNodes2Text
latex = sys.stdin.read()
text = LatexNodes2Text().latex_to_text(latex)
sys.stdout.write(json.dumps(text))
`

function pythonLatexToText(latex: string): string {
  const output = execFileSync('python3', ['-c', pythonScript], {
    input: latex,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    encoding: 'utf-8',
  })
  return JSON.parse(output)
}

function tsLatexToText(latex: string): string {
  return new LatexNodes2Text().latexToText(latex)
}

function buildMacroInvocation(name: string, argspec: string): string {
  let latex = `\\${name}`
  let mandatoryIndex = 1
  let optionalIndex = 1
  for (const ch of argspec) {
    if (ch === '*') {
      latex += '*'
    }
    else if (ch === '[') {
      latex += `[opt${optionalIndex++}]`
    }
    else if (ch === '{') {
      latex += `{ARG${mandatoryIndex++}}`
    }
  }
  return latex
}

const equationEnvironmentNames = new Set([
  'equation',
  'equation*',
  'eqnarray',
  'eqnarray*',
  'align',
  'align*',
  'multline',
  'multline*',
  'gather',
  'gather*',
  'dmath',
  'dmath*',
])

const matrixEnvironmentNames = new Set([
  'array',
  'pmatrix',
  'bmatrix',
  'smallmatrix',
  'psmallmatrix',
  'bsmallmatrix',
])

function buildEnvironmentInvocation(name: string, argspec: string): string {
  let begin = `\\begin{${name}}`
  let mandatoryIndex = 1
  let optionalIndex = 1
  for (const ch of argspec) {
    if (ch === '*') {
      begin += '*'
    }
    else if (ch === '[') {
      begin += `[opt${optionalIndex++}]`
    }
    else if (ch === '{') {
      begin += `{ARG${mandatoryIndex++}}`
    }
  }

  let body = 'BODY'
  if (matrixEnvironmentNames.has(name)) {
    body = 'a & b \\ c & d'
  }
  else if (equationEnvironmentNames.has(name)) {
    body = 'a + b = c'
  }

  const end = `\\end{${name}}`
  return `${begin}${body}${end}`
}

const skipMacros = new Set<string>(['document'])

describe('latexNodes2Text parity with pylatexenc', () => {
  it('matches python conversion for default macros', () => {
    for (const spec of generatedMacroParsingSpecs) {
      const lowered = spec.name.toLowerCase()
      if (lowered.includes('uebung') || lowered.includes('exercise')) {
        continue
      }
      if (skipMacros.has(spec.name)) {
        continue
      }
      const latex = buildMacroInvocation(spec.name, spec.argspec)
      const ts = tsLatexToText(latex)
      let py: string
      try {
        py = pythonLatexToText(latex)
      }
      catch (error) {
        const errorMessage = `${error}`
        if (errorMessage.includes('len(node.nodeargs) == 0')) {
          // pylatexenc raises this TypeError for legacy bare macros such as \verb; treat it as an expected warning.
          console.warn('Expected pylatexenc warning while exercising legacy macros (e.g. \\verb).')
        }
        // Some pylatexenc macros rely on additional state and may raise; skip parity check for those.
        continue
      }
      expect(ts, `macro ${spec.name}`).toBe(py)
    }
  })

  it('matches python conversion for default environments', () => {
    for (const spec of generatedEnvironmentParsingSpecs) {
      const latex = buildEnvironmentInvocation(spec.name, spec.argspec)
      let ts: string
      try {
        ts = tsLatexToText(latex)
      }
      catch (error) {
        throw new Error(`environment ${spec.name}: ${(error as Error).message}`)
      }
      const py = pythonLatexToText(latex)
      expect(ts, `environment ${spec.name}`).toBe(py)
    }
  })

  it('matches python conversion for specials', () => {
    for (const spec of generatedSpecialParsingSpecs) {
      const latex = `alpha${spec.chars}omega`
      const ts = tsLatexToText(latex)
      const py = pythonLatexToText(latex)
      expect(ts, `special ${spec.chars}`).toBe(py)
    }
  })

  it('matches python for document metadata macros', () => {
    const latex = '\\title{Document}\\author{Alice}\\date{June 2024}\\maketitle'
    const ts = tsLatexToText(latex)
    const py = pythonLatexToText(latex)
    expect(ts).toBe(py)
  })

  it('matches python for matrix environments', () => {
    const latex = '\\begin{pmatrix}1 & 2 \\ 3 & 4\\end{pmatrix}'
    let ts: string
    try {
      ts = tsLatexToText(latex)
    }
    catch (error) {
      throw new Error(`matrix environment: ${(error as Error).message}`)
    }
    const py = pythonLatexToText(latex)
    expect(ts).toBe(py)
  })

  it('matches python for placeholder macros', () => {
    const latex = 'before \\includegraphics{foo} after'
    const ts = tsLatexToText(latex)
    const py = pythonLatexToText(latex)
    expect(ts).toBe(py)
  })
})
