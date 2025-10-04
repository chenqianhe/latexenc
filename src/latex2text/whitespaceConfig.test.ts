import { describe, expect, it } from 'vitest'
import { getEquationWhitespaceConfig, parseStrictLatexSpacesConfig } from './whitespaceConfig'

describe('whitespaceConfig', () => {
  describe('parseStrictLatexSpacesConfig', () => {
    it('returns macros preset by default', () => {
      const config = parseStrictLatexSpacesConfig(undefined)
      expect(config.betweenMacroAndChars).toBe(true)
      expect(config.betweenLatexConstructs).toBe(true)
      expect(config.afterComment).toBe(false)
      expect(config.inEquations).toBe(false)
    })

    it('handles boolean true (all strict)', () => {
      const config = parseStrictLatexSpacesConfig(true)
      expect(config.betweenMacroAndChars).toBe(true)
      expect(config.betweenLatexConstructs).toBe(true)
      expect(config.afterComment).toBe(true)
      expect(config.inEquations).toBe(true)
    })

    it('handles boolean false (macros preset)', () => {
      const config = parseStrictLatexSpacesConfig(false)
      expect(config.betweenMacroAndChars).toBe(true)
      expect(config.betweenLatexConstructs).toBe(true)
      expect(config.afterComment).toBe(false)
      expect(config.inEquations).toBe(false)
    })

    it('parses based-on-source preset', () => {
      const config = parseStrictLatexSpacesConfig('based-on-source')
      expect(config.betweenMacroAndChars).toBe(false)
      expect(config.betweenLatexConstructs).toBe(false)
      expect(config.afterComment).toBe(false)
      expect(config.inEquations).toBe(false)
    })

    it('parses macros preset', () => {
      const config = parseStrictLatexSpacesConfig('macros')
      expect(config.betweenMacroAndChars).toBe(true)
      expect(config.betweenLatexConstructs).toBe(true)
      expect(config.afterComment).toBe(false)
      expect(config.inEquations).toBe(false)
    })

    it('parses except-in-equations preset', () => {
      const config = parseStrictLatexSpacesConfig('except-in-equations')
      expect(config.betweenMacroAndChars).toBe(true)
      expect(config.betweenLatexConstructs).toBe(true)
      expect(config.afterComment).toBe(true)
      expect(config.inEquations).toBe(false)
    })

    it('handles custom partial config', () => {
      const config = parseStrictLatexSpacesConfig({
        betweenMacroAndChars: false,
        afterComment: true,
      })
      expect(config.betweenMacroAndChars).toBe(false)
      expect(config.betweenLatexConstructs).toBe(true) // default
      expect(config.afterComment).toBe(true)
      expect(config.inEquations).toBe(false) // default
    })

    it('throws on unknown preset', () => {
      expect(() => {
        parseStrictLatexSpacesConfig('invalid' as any)
      }).toThrow('Unknown strict_latex_spaces preset')
    })
  })

  describe('getEquationWhitespaceConfig', () => {
    it('returns based-on-source when inEquations is false', () => {
      const config = parseStrictLatexSpacesConfig('macros')
      const eqConfig = getEquationWhitespaceConfig(config)
      expect(eqConfig.betweenMacroAndChars).toBe(false)
      expect(eqConfig.betweenLatexConstructs).toBe(false)
    })

    it('returns same config when inEquations is true', () => {
      const config = parseStrictLatexSpacesConfig(true)
      const eqConfig = getEquationWhitespaceConfig(config)
      expect(eqConfig).toEqual(config)
    })

    it('returns custom equation config when provided', () => {
      const config = parseStrictLatexSpacesConfig({
        betweenMacroAndChars: true,
        betweenLatexConstructs: true,
        afterComment: true,
        inEquations: {
          betweenMacroAndChars: false,
          betweenLatexConstructs: false,
          afterComment: false,
          inEquations: false,
        },
      })
      const eqConfig = getEquationWhitespaceConfig(config)
      expect(eqConfig.betweenMacroAndChars).toBe(false)
      expect(eqConfig.afterComment).toBe(false)
    })
  })
})
