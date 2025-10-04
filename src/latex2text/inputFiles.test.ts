import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { LatexNodes2Text } from './latex2text'

const fixturesDir = path.join(__dirname, '../__tests__/fixtures')

describe('input file support', () => {
  describe('setTexInputDirectory', () => {
    it('sets the input directory', () => {
      const converter = new LatexNodes2Text()
      expect(() => converter.setTexInputDirectory(fixturesDir)).not.toThrow()
    })

    it('throws on non-existent directory', () => {
      const converter = new LatexNodes2Text()
      expect(() => converter.setTexInputDirectory('/nonexistent/path')).toThrow('Directory does not exist')
    })
  })

  describe('readInputFile', () => {
    it('throws when directory not set', () => {
      const converter = new LatexNodes2Text()
      expect(() => converter.readInputFile('chapter1.tex')).toThrow('TeX input directory not set')
    })

    it('reads a file with .tex extension', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir)
      const content = converter.readInputFile('chapter1.tex')
      expect(content).toContain('Chapter 1')
      expect(content).toContain('bold text')
    })

    it('reads a file without .tex extension (auto-adds it)', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir)
      const content = converter.readInputFile('chapter1')
      expect(content).toContain('Chapter 1')
    })

    it('throws on missing file when strict', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir, true)
      expect(() => converter.readInputFile('missing.tex')).toThrow('Cannot read input file')
    })

    it('returns placeholder on missing file when not strict', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir, false)
      const content = converter.readInputFile('missing.tex')
      expect(content).toBe('[Could not read file: missing.tex]')
    })
  })

  describe('\\input macro', () => {
    it('reads and parses input files', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir)

      const result = converter.latexToText('Before input.\\input{chapter1}After input.')
      expect(result).toContain('Before input.')
      expect(result).toContain('Chapter 1')
      expect(result).toContain('bold text')
      expect(result).toContain('italic text')
      expect(result).toContain('After input.')
    })

    it('handles input files without extension', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir)

      const result = converter.latexToText('\\input{chapter1}')
      expect(result).toContain('Chapter 1')
    })

    it('handles nested input files', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir)

      const result = converter.latexToText('\\input{nested}')
      expect(result).toContain('Nested file content')
      expect(result).toContain('Chapter 1')
      expect(result).toContain('End of nested file')
    })

    it('returns placeholder when directory not set', () => {
      const converter = new LatexNodes2Text()
      const result = converter.latexToText('\\input{chapter1}')
      expect(result).toBe('[\\input{chapter1}]')
    })

    it('returns placeholder for missing files when not strict', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir, false)
      const result = converter.latexToText('\\input{missing}')
      expect(result).toBe('[Could not read file: missing]')
    })
  })

  describe('\\include macro', () => {
    it('reads and parses include files with page breaks', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir)

      const result = converter.latexToText('Before include.\\include{chapter2}After include.')
      expect(result).toContain('Before include.')
      expect(result).toContain('Chapter 2')
      expect(result).toContain('mathematical notation')
      expect(result).toContain('After include.')
      // Check for page breaks (double newlines)
      expect(result).toMatch(/Before include\.\s*\n\n/)
      expect(result).toMatch(/\n\n\s*After include\./)
    })

    it('handles multiple includes', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir)

      const result = converter.latexToText('\\include{chapter1}\\include{chapter2}')
      expect(result).toContain('Chapter 1')
      expect(result).toContain('Chapter 2')
    })

    it('returns placeholder when directory not set', () => {
      const converter = new LatexNodes2Text()
      const result = converter.latexToText('\\include{chapter1}')
      expect(result).toBe('[\\include{chapter1}]')
    })

    it('returns placeholder for missing files when not strict', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir, false)
      const result = converter.latexToText('\\include{missing}')
      expect(result).toBe('\n\n[Could not read file: missing]\n\n')
    })
  })

  describe('complex scenarios', () => {
    it('handles mix of input and include', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir)

      const latex = `
\\title{My Document}
\\input{chapter1}
\\include{chapter2}
`
      const result = converter.latexToText(latex)
      expect(result).toContain('Chapter 1')
      expect(result).toContain('Chapter 2')
    })

    it('preserves LaTeX processing in input files', () => {
      const converter = new LatexNodes2Text()
      converter.setTexInputDirectory(fixturesDir)

      const result = converter.latexToText('\\input{chapter1}')
      // Check that \textbf and \textit were processed
      expect(result).not.toContain('\\textbf')
      expect(result).not.toContain('\\textit')
      expect(result).toContain('bold text')
      expect(result).toContain('italic text')
    })
  })
})
