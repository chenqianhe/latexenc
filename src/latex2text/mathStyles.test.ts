import { describe, expect, it } from 'vitest'
import { formatMathTextStyle, isSupportedMathStyle } from './mathStyles'

describe('mathStyles', () => {
  describe('formatMathTextStyle', () => {
    it('converts to bold mathematical letters', () => {
      expect(formatMathTextStyle('ABC', 'bold')).toBe('𝐀𝐁𝐂')
      expect(formatMathTextStyle('xyz', 'bold')).toBe('𝐱𝐲𝐳')
      expect(formatMathTextStyle('Hello', 'bold')).toBe('𝐇𝐞𝐥𝐥𝐨')
    })

    it('converts to italic mathematical letters', () => {
      expect(formatMathTextStyle('x', 'italic')).toBe('𝑥')
      expect(formatMathTextStyle('ABC', 'italic')).toBe('𝐴𝐵𝐶')
      expect(formatMathTextStyle('h', 'italic')).toBe('ℎ') // Planck constant exception
    })

    it('converts to doublestruck mathematical letters', () => {
      expect(formatMathTextStyle('R', 'doublestruck')).toBe('ℝ')
      expect(formatMathTextStyle('C', 'doublestruck')).toBe('ℂ')
      expect(formatMathTextStyle('N', 'doublestruck')).toBe('ℕ')
      expect(formatMathTextStyle('Z', 'doublestruck')).toBe('ℤ')
    })

    it('converts to script mathematical letters', () => {
      expect(formatMathTextStyle('L', 'script')).toBe('ℒ')
      expect(formatMathTextStyle('B', 'script')).toBe('ℬ')
      expect(formatMathTextStyle('e', 'script')).toBe('ℯ')
    })

    it('converts to fraktur mathematical letters', () => {
      expect(formatMathTextStyle('g', 'fraktur')).toBe('𝔤')
      expect(formatMathTextStyle('R', 'fraktur')).toBe('ℜ') // Exception
      expect(formatMathTextStyle('I', 'fraktur')).toBe('ℑ') // Exception
    })

    it('converts to monospace mathematical letters', () => {
      expect(formatMathTextStyle('code', 'monospace')).toBe('𝚌𝚘𝚍𝚎')
    })

    it('converts to sans-serif mathematical letters', () => {
      expect(formatMathTextStyle('abc', 'sans')).toBe('𝖺𝖻𝖼')
    })

    it('preserves non-letter characters', () => {
      expect(formatMathTextStyle('x + y', 'bold')).toBe('𝐱 + 𝐲')
      expect(formatMathTextStyle('123', 'italic')).toBe('123')
      expect(formatMathTextStyle('α', 'bold')).toBe('α') // Greek letters not converted
    })

    it('handles empty string', () => {
      expect(formatMathTextStyle('', 'bold')).toBe('')
    })

    it('handles mixed case', () => {
      expect(formatMathTextStyle('XyZ', 'italic')).toBe('𝑋𝑦𝑍')
    })
  })

  describe('isSupportedMathStyle', () => {
    it('returns true for valid styles', () => {
      expect(isSupportedMathStyle('bold')).toBe(true)
      expect(isSupportedMathStyle('italic')).toBe(true)
      expect(isSupportedMathStyle('doublestruck')).toBe(true)
      expect(isSupportedMathStyle('script')).toBe(true)
      expect(isSupportedMathStyle('fraktur')).toBe(true)
      expect(isSupportedMathStyle('monospace')).toBe(true)
    })

    it('returns false for invalid styles', () => {
      expect(isSupportedMathStyle('invalid')).toBe(false)
      expect(isSupportedMathStyle('underline')).toBe(false)
      expect(isSupportedMathStyle('')).toBe(false)
    })
  })
})
