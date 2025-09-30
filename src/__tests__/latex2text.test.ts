import { describe, expect, it } from 'vitest'
import { LatexNodes2Text } from '../latex2text/latex2text'

const toText = (input: string): string => new LatexNodes2Text().latexToText(input)

describe('latexNodes2Text', () => {
  it('converts basic formatting macros', () => {
    const result = toText('Hello \\textbf{world}!')
    expect(result).toBe('Hello world!')
  })

  it('handles accents and unicode replacements', () => {
    const result = toText('Fran\\c{c}ais \\\'{e}tudiant')
    expect(result).toBe('Français étudiant')
  })

  it('formats itemize environments with bullets', () => {
    const latex = '\\begin{itemize}\\item First\\item Second\\end{itemize}'
    const result = toText(latex)
    expect(result).toContain('First')
    expect(result).toContain('Second')
    expect(result).toContain('*')
  })

  it('converts math mode using default text mode', () => {
    const result = toText('$\\alpha + \\frac{1}{2}$')
    expect(result).toBe('α + 1/2')
  })
})
