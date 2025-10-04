import { describe, expect, it } from 'vitest'
import { LatexNodes2Text } from './latex2text'

describe('matrixFormatter', () => {
  function latexToText(latex: string): string {
    return new LatexNodes2Text().latexToText(latex)
  }

  describe('pmatrix environment', () => {
    it('formats 2x2 matrix', () => {
      const latex = '\\begin{pmatrix}1 & 2 \\\\ 3 & 4\\end{pmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[ 1 2; 3 4 ]')
    })

    it('formats 3x3 matrix', () => {
      const latex = '\\begin{pmatrix}a & b & c \\\\ d & e & f \\\\ g & h & i\\end{pmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[ a b c; d e f; g h i ]')
    })

    it('aligns columns by width', () => {
      const latex = '\\begin{pmatrix}1 & 22 \\\\ 333 & 4\\end{pmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[   1  22; 333   4 ]')
    })

    it('handles empty matrix', () => {
      const latex = '\\begin{pmatrix}\\end{pmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[  ]')
    })

    it('handles single element', () => {
      const latex = '\\begin{pmatrix}x\\end{pmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[ x ]')
    })

    it('handles single row', () => {
      const latex = '\\begin{pmatrix}1 & 2 & 3\\end{pmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[ 1 2 3 ]')
    })

    it('handles single column', () => {
      const latex = '\\begin{pmatrix}1 \\\\ 2 \\\\ 3\\end{pmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[ 1; 2; 3 ]')
    })

    it('handles complex expressions in cells', () => {
      const latex = '\\begin{pmatrix}\\alpha & \\beta \\\\ \\gamma & \\delta\\end{pmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[ α β; γ δ ]')
    })
  })

  describe('bmatrix environment', () => {
    it('formats 2x2 matrix', () => {
      const latex = '\\begin{bmatrix}1 & 2 \\\\ 3 & 4\\end{bmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[ 1 2; 3 4 ]')
    })
  })

  describe('array environment', () => {
    it('formats array with alignment spec', () => {
      const latex = '\\begin{array}{cc}1 & 2 \\\\ 3 & 4\\end{array}'
      const result = latexToText(latex)
      expect(result).toBe('[ 1 2; 3 4 ]')
    })

    it('formats array with different alignment', () => {
      const latex = '\\begin{array}{lcr}a & b & c \\\\ d & e & f\\end{array}'
      const result = latexToText(latex)
      expect(result).toBe('[ a b c; d e f ]')
    })
  })

  describe('smallmatrix environment', () => {
    it('formats small matrix', () => {
      const latex = '\\begin{smallmatrix}a & b \\\\ c & d\\end{smallmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[ a b; c d ]')
    })
  })

  describe('edge cases', () => {
    it('handles trailing row separator', () => {
      const latex = '\\begin{pmatrix}1 & 2 \\\\ 3 & 4 \\\\\\end{pmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[ 1 2; 3 4;   ]')
    })

    it('handles irregular row lengths', () => {
      const latex = '\\begin{pmatrix}1 & 2 & 3 \\\\ 4 & 5\\end{pmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[ 1 2 3; 4 5 ]')
    })

    it('handles nested macros', () => {
      const latex = '\\begin{pmatrix}\\frac{1}{2} & \\sqrt{2} \\\\ 0 & 1\\end{pmatrix}'
      const result = latexToText(latex)
      expect(result).toBe('[ 1/2 √();   0   1 ]')
    })
  })
})
