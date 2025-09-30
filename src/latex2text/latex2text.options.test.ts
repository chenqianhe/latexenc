import { describe, expect, it } from 'vitest'
import { LatexNodes2Text } from './latex2text'

describe('latexNodes2Text options', () => {
  it('keeps math delimiters when mathMode is set to with-delimiters', () => {
    const converter = new LatexNodes2Text({ mathMode: 'with-delimiters' })
    expect(converter.latexToText('$a+b$')).toBe('$a+b$')
  })

  it('drops math content when mathMode is set to remove', () => {
    const converter = new LatexNodes2Text({ mathMode: 'remove' })
    expect(converter.latexToText('$x^2$')).toBe('')
  })

  it('retains braces for long groups when keepBracedGroups is enabled', () => {
    const converter = new LatexNodes2Text({
      keepBracedGroups: true,
      keepBracedGroupsMinLength: 2,
    })
    expect(converter.latexToText('{AB}{C}')).toBe('{AB}C')
  })

  it('normalises whitespace when strictSpaces is enabled', () => {
    const converter = new LatexNodes2Text({ strictSpaces: true })
    expect(converter.latexToText('alpha    beta')).toBe('alpha beta')
    expect(converter.latexToText('alpha   \n   beta')).toBe('alpha\nbeta')
  })
})
