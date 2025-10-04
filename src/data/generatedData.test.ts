import { describe, expect, it } from 'vitest'
import {
  generatedEnvironmentParsingSpecs,
  generatedMacroParsingSpecs,
  generatedSpecialParsingSpecs,
  generatedVerbatimEnvironmentNames,
  generatedVerbatimMacroNames,
} from './generatedParsingSpec'
import {
  generatedFunctionEnvironmentNames,
  generatedFunctionMacroNames,
  generatedNoneMacroTextSpecs,
  generatedStringEnvironmentTextSpecs,
  generatedStringMacroTextSpecs,
  generatedStringSpecialTextSpecs,
} from './generatedTextSpecs'

describe('generated parsing specs', () => {
  it('do not contain duplicate macro names', () => {
    const names = generatedMacroParsingSpecs.map(spec => spec.name)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  it('exposes expected core macros/environments/specials', () => {
    const macroNames = generatedMacroParsingSpecs.map(spec => spec.name)
    expect(macroNames).toContain('newcommand')
    expect(macroNames).toContain('section')
    expect(macroNames).toContain('hint')

    const envNames = generatedEnvironmentParsingSpecs.map(spec => spec.name)
    expect(envNames).toContain('tabularx')
    expect(envNames).toContain('align')

    const specials = generatedSpecialParsingSpecs.map(spec => spec.chars)
    expect(specials).toContain('---')
    expect(specials).toContain('!`')
  })

  it('lists verbatim-aware macros and environments', () => {
    const verbMacros = generatedVerbatimMacroNames.map(spec => spec.name)
    expect(verbMacros).toContain('verb')

    const verbEnvs = generatedVerbatimEnvironmentNames.map(spec => spec.name)
    expect(verbEnvs).toContain('verbatim')
    expect(verbEnvs).toContain('lstlisting')
  })
})

describe('generated text specs', () => {
  it('distinguish between string, none, and function replacements for macros', () => {
    const stringMacros = new Set(generatedStringMacroTextSpecs.map(spec => spec.name))
    const noneMacros = new Set(generatedNoneMacroTextSpecs.map(spec => spec.name))
    const functionMacros = new Set(generatedFunctionMacroNames.map(spec => spec.name))

    expect(stringMacros.has('hint')).toBe(true)
    expect(stringMacros.has('citet')).toBe(true)
    expect(noneMacros.has('emph')).toBe(true)
    expect(functionMacros.has('href')).toBe(true)
    expect(functionMacros.has('item')).toBe(true)
  })

  it('includes matrix and equation environments with string replacements', () => {
    const envSpecs = new Map(generatedStringEnvironmentTextSpecs.map(spec => [spec.name, spec]))
    expect(envSpecs.get('center')?.replacement).toBe('\n%s\n')
    expect(envSpecs.get('figure')).toEqual(expect.objectContaining({ discard: false }))

    const functionEnvs = new Set(generatedFunctionEnvironmentNames.map(spec => spec.name))
    expect(functionEnvs.has('equation')).toBe(true)
    expect(functionEnvs.has('pmatrix')).toBe(true)
  })

  it('normalises specials coming from pylatexenc approximations', () => {
    const specials = new Map(generatedStringSpecialTextSpecs.map(spec => [spec.chars, spec.replacement]))
    expect(specials.get('&')).toBe('   ')
  })
})
