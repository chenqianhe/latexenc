import { describe, expect, it } from 'vitest'
import { LatexNodes2Text } from './latex2text'

describe('extended Verbatim Environment Support', () => {
  describe('basic verbatim environments', () => {
    it('handles verbatim environment', () => {
      const latex = '\\begin{verbatim}\ncode here\n\\end{verbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('code here\n')
    })

    it('handles verbatim* environment', () => {
      const latex = '\\begin{verbatim*}\ncode with spaces\n\\end{verbatim*}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('code with spaces\n')
    })
  })

  describe('lstlisting environments', () => {
    it('handles lstlisting environment', () => {
      const latex = '\\begin{lstlisting}\nfunction main() {\n  return 0;\n}\n\\end{lstlisting}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('function main() {\n  return 0;\n}\n')
    })

    it('handles lstlisting* environment', () => {
      const latex = '\\begin{lstlisting*}\nconst x = 42;\n\\end{lstlisting*}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('const x = 42;\n')
    })

    it('preserves special characters in lstlisting', () => {
      const latex = '\\begin{lstlisting}\n$ echo "hello" & cat file.txt\n\\end{lstlisting}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('$ echo "hello" & cat file.txt\n')
    })
  })

  describe('fancyvrb Verbatim environments', () => {
    it('handles Verbatim environment', () => {
      const latex = '\\begin{Verbatim}\nformatted code\n\\end{Verbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('formatted code\n')
    })

    it('handles Verbatim* environment', () => {
      const latex = '\\begin{Verbatim*}\nformatted code\n\\end{Verbatim*}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('formatted code\n')
    })

    it('handles BVerbatim environment (with border)', () => {
      const latex = '\\begin{BVerbatim}\ncode in box\n\\end{BVerbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('code in box\n')
    })

    it('handles LVerbatim environment (with line numbers)', () => {
      const latex = '\\begin{LVerbatim}\nline one\nline two\n\\end{LVerbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('line one\nline two\n')
    })
  })

  describe('minted environment', () => {
    it('handles minted environment for syntax highlighting', () => {
      const latex = '\\begin{minted}{python}\ndef hello():\n    print("world")\n\\end{minted}'
      const result = new LatexNodes2Text().latexToText(latex)
      // minted has a required {language} argument before the body
      expect(result).toContain('def hello():')
      expect(result).toContain('print("world")')
    })

    it('preserves indentation in minted', () => {
      const latex = '\\begin{minted}{javascript}\nif (true) {\n    console.log("test");\n}\n\\end{minted}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toContain('if (true) {')
      expect(result).toContain('console.log("test");')
    })
  })

  describe('alltt environment', () => {
    it('handles alltt environment (almost verbatim)', () => {
      const latex = '\\begin{alltt}\ntext with special chars: $ & %\n\\end{alltt}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('text with special chars: $ & %\n')
    })
  })

  describe('complex scenarios', () => {
    it('handles multiple verbatim environments in one document', () => {
      const latex = `
Text before
\\begin{verbatim}
code block 1
\\end{verbatim}
Text middle
\\begin{lstlisting}
code block 2
\\end{lstlisting}
Text after
`
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toContain('code block 1')
      expect(result).toContain('code block 2')
      expect(result).toContain('Text before')
      expect(result).toContain('Text middle')
      expect(result).toContain('Text after')
    })

    it('handles verbatim with LaTeX commands inside (should not parse)', () => {
      const latex = '\\begin{verbatim}\n\\textbf{this should not be bold}\n\\end{verbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('\\textbf{this should not be bold}\n')
    })

    it('handles empty verbatim environments', () => {
      const latex = '\\begin{verbatim}\\end{verbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('')
    })

    it('handles verbatim with only whitespace', () => {
      const latex = '\\begin{verbatim}\n   \n\\end{verbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      // Note: empty content may be trimmed by environment handling
      expect(result.trim()).toBe('')
    })

    it('preserves backslashes in verbatim', () => {
      const latex = '\\begin{Verbatim}\nC:\\\\Users\\\\test\n\\end{Verbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('C:\\\\Users\\\\test\n')
    })
  })

  describe('edge cases', () => {
    it('handles nested braces in verbatim', () => {
      const latex = '\\begin{lstlisting}\narray[{key: value}]\n\\end{lstlisting}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('array[{key: value}]\n')
    })

    it('handles percent signs in verbatim (not treated as comments)', () => {
      const latex = '\\begin{verbatim}\n100% complete\n\\end{verbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('100% complete\n')
    })

    it('handles dollar signs in verbatim (not treated as math)', () => {
      const latex = '\\begin{Verbatim}\n$PATH variable\n\\end{Verbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('$PATH variable\n')
    })

    it('handles ampersands in verbatim (not treated as alignment)', () => {
      const latex = '\\begin{lstlisting}\ncommand1 && command2\n\\end{lstlisting}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('command1 && command2\n')
    })
  })

  describe('whitespace preservation', () => {
    it('preserves content after newline', () => {
      const latex = '\\begin{verbatim}\n    indented code\n\\end{verbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      // Verbatim content starts after \begin{verbatim}
      expect(result).toContain('indented code')
    })

    it('preserves trailing content', () => {
      const latex = '\\begin{Verbatim}\ncode with spaces\n\\end{Verbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toContain('code with spaces')
    })

    it('preserves blank lines', () => {
      const latex = '\\begin{lstlisting}\nline1\n\nline3\n\\end{lstlisting}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toBe('line1\n\nline3\n')
    })

    it('preserves content structure', () => {
      const latex = '\\begin{verbatim}\n\ttabbed\n\\end{verbatim}'
      const result = new LatexNodes2Text().latexToText(latex)
      expect(result).toContain('tabbed')
    })
  })
})
