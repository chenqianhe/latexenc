import type { EnvironmentParsingSpec, MacroArgumentSpec, MacroParsingSpec, SpecialsParsingSpec } from './context'
import { LatexParsingContext } from './context'

const group = (): MacroArgumentSpec => ({ type: 'group' })
const optional = (): MacroArgumentSpec => ({ type: 'optional' })
const star = (): MacroArgumentSpec => ({ type: 'star' })

const defaultMacroSpecs: MacroParsingSpec[] = [
  { name: 'textbf', arguments: [group()] },
  { name: 'textit', arguments: [group()] },
  { name: 'texttt', arguments: [group()] },
  { name: 'textsf', arguments: [group()] },
  { name: 'textsc', arguments: [group()] },
  { name: 'textrm', arguments: [group()] },
  { name: 'textnormal', arguments: [group()] },
  { name: 'textsuperscript', arguments: [group()] },
  { name: 'textsubscript', arguments: [group()] },
  { name: 'emph', arguments: [group()] },
  { name: 'em', arguments: [group()] },
  { name: 'mathbf', arguments: [group()] },
  { name: 'mathrm', arguments: [group()] },
  { name: 'mathit', arguments: [group()] },
  { name: 'mathcal', arguments: [group()] },
  { name: 'mathbb', arguments: [group()] },
  { name: 'mathsf', arguments: [group()] },
  { name: 'operatorname', arguments: [group()] },

  { name: 'section', arguments: [optional(), group()] },
  { name: 'subsection', arguments: [optional(), group()] },
  { name: 'subsubsection', arguments: [optional(), group()] },
  { name: 'paragraph', arguments: [optional(), group()] },
  { name: 'subparagraph', arguments: [optional(), group()] },
  { name: 'chapter', arguments: [optional(), group()] },
  { name: 'part', arguments: [optional(), group()] },

  { name: 'footnote', arguments: [optional(), group()] },
  { name: 'item', arguments: [optional()] },
  { name: '\\', arguments: [star(), optional()] },
  { name: 'par', arguments: [] },
  { name: 'newline', arguments: [] },
  { name: 'textellipsis', arguments: [] },

  { name: 'href', arguments: [group(), group()] },
  { name: 'url', arguments: [group()] },
  { name: 'includegraphics', arguments: [optional(), group()] },

  { name: 'frac', arguments: [group(), group()] },
  { name: 'sqrt', arguments: [optional(), group()] },
  { name: 'left', arguments: [group()] },
  { name: 'right', arguments: [group()] },
  { name: 'mathrm', arguments: [group()] },
  { name: 'text', arguments: [group()] },
  { name: 'mbox', arguments: [group()] },

  { name: 'begin', arguments: [group()], swallowWhitespace: true },
  { name: 'end', arguments: [group()], swallowWhitespace: true },

  { name: 'overline', arguments: [group()] },
  { name: 'underline', arguments: [group()] },

  { name: 'hat', arguments: [group()] },
  { name: 'tilde', arguments: [group()] },
  { name: 'bar', arguments: [group()] },
  { name: 'dot', arguments: [group()] },
  { name: 'ddot', arguments: [group()] },
  { name: 'vec', arguments: [group()] },

  { name: 'mathrm', arguments: [group()] },
  { name: 'displaystyle', arguments: [group()] },
  { name: 'textstyle', arguments: [group()] },
  { name: 'scriptstyle', arguments: [group()] },
  { name: 'scriptscriptstyle', arguments: [group()] },

  { name: 'stackrel', arguments: [group(), group()] },
  { name: 'overset', arguments: [group(), group()] },
  { name: 'underset', arguments: [group(), group()] },

  { name: 'caption', arguments: [optional(), group()] },
  { name: 'label', arguments: [group()] },
  { name: 'ref', arguments: [group()] },
  { name: 'eqref', arguments: [group()] },
  { name: 'cite', arguments: [optional(), group()] },
  { name: 'citet', arguments: [optional(), group()] },
  { name: 'citep', arguments: [optional(), group()] },

  // Accent macros (single-character names)
  { name: '\'', arguments: [group()] },
  { name: '`', arguments: [group()] },
  { name: '^', arguments: [group()] },
  { name: '"', arguments: [group()] },
  { name: '~', arguments: [group()] },
  { name: '=', arguments: [group()] },
  { name: '.', arguments: [group()] },
  { name: 'r', arguments: [group()] },
  { name: 'u', arguments: [group()] },
  { name: 'v', arguments: [group()] },
  { name: 'H', arguments: [group()] },
  { name: 'c', arguments: [group()] },
  { name: 'k', arguments: [group()] },
  { name: 'b', arguments: [group()] },
  { name: 'd', arguments: [group()] },

  { name: 'textcolor', arguments: [group(), group()] },
  { name: 'color', arguments: [group()] },
  { name: 'boxed', arguments: [group()] },
  { name: 'ensuremath', arguments: [group()] },
  { name: 'DeclareMathOperator', arguments: [optional(), group(), group()] },
]

const defaultEnvironmentSpecs: EnvironmentParsingSpec[] = [
  { name: 'document', arguments: [] },
  { name: 'center', arguments: [] },
  { name: 'flushleft', arguments: [] },
  { name: 'flushright', arguments: [] },
  { name: 'itemize', arguments: [] },
  { name: 'enumerate', arguments: [optional()] },
  { name: 'description', arguments: [] },
  { name: 'figure', arguments: [optional()] },
  { name: 'table', arguments: [optional()] },
  { name: 'equation', arguments: [], isMathMode: true },
  { name: 'equation*', arguments: [], isMathMode: true },
  { name: 'align', arguments: [], isMathMode: true },
  { name: 'align*', arguments: [], isMathMode: true },
  { name: 'gather', arguments: [], isMathMode: true },
  { name: 'gather*', arguments: [], isMathMode: true },
  { name: 'multline', arguments: [], isMathMode: true },
  { name: 'multline*', arguments: [], isMathMode: true },
  { name: 'pmatrix', arguments: [], isMathMode: true },
  { name: 'bmatrix', arguments: [], isMathMode: true },
  { name: 'array', arguments: [optional()] },
  { name: 'tabular', arguments: [group()] },
]

const defaultSpecials: SpecialsParsingSpec[] = [
  { chars: '~' },
  { chars: '---' },
  { chars: '--' },
  { chars: '``' },
  { chars: '\'\'' },
]

export function createDefaultParsingContext(): LatexParsingContext {
  return new LatexParsingContext({
    macros: defaultMacroSpecs,
    environments: defaultEnvironmentSpecs,
    specials: defaultSpecials,
  })
}
