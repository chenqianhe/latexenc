import type { LatexMacroArgument, LatexNode } from '../core/nodes'
import {
  generatedNoneMacroTextSpecs,
  generatedStringEnvironmentTextSpecs,
  generatedStringMacroTextSpecs,
  generatedStringSpecialTextSpecs,
} from '../data/generatedTextSpecs'
import type { EnvironmentTextReplacementInfo, EnvironmentTextSpec, MacroTextReplacementInfo, MacroTextSpec, SpecialsTextSpec } from './specs'
import type { LatexNodes2Text } from './latex2text'
import { LatexTextContext } from './specs'

const accentCombining: Record<string, string> = {
  '\'': '\u0301',
  '`': '\u0300',
  '^': '\u0302',
  '"': '\u0308',
  '~': '\u0303',
  '=': '\u0304',
  '.': '\u0307',
  'r': '\u030A',
  'u': '\u0306',
  'v': '\u030C',
  'H': '\u030B',
  'c': '\u0327',
  'k': '\u0328',
  'b': '\u0331',
  'd': '\u0323',
  'vec': '\u20D7',
  'dot': '\u0307',
  'ddot': '\u0308',
  'breve': '\u0306',
  'check': '\u030C',
  'acute': '\u0301',
  'grave': '\u0300',
  'tilde': '\u0303',
  'bar': '\u0305',
  'hat': '\u0302',
  'not': '\u0338',
}

function argumentText(info: MacroTextReplacementInfo, arg: LatexMacroArgument | undefined): string {
  const nodes = argumentNodes(arg)
  return nodes ? info.toText(nodes) : ''
}

function firstArgumentText(info: MacroTextReplacementInfo): string {
  return argumentText(info, info.node.arguments[0])
}

function secondArgumentText(info: MacroTextReplacementInfo): string {
  return argumentText(info, info.node.arguments[1])
}

function argumentNodes(arg: LatexMacroArgument | undefined): LatexNode[] | undefined {
  if (!arg) {
    return undefined
  }
  if (arg.type === 'group' || arg.type === 'optional') {
    return arg.nodes
  }
  return undefined
}

function applyAccent(base: string, combining: string): string {
  if (!base) {
    return base
  }
  let result = ''
  for (const ch of base) {
    let char = ch
    if (char === '\u0131') {
      char = 'i'
    }
    else if (char === '\u0237') {
      char = 'j'
    }
    result += (char + combining).normalize('NFC')
  }
  return result
}

function accentSpec(name: string): MacroTextSpec {
  return {
    name,
    replacement: (info) => {
      const text = firstArgumentText(info)
      const combining = accentCombining[name]
      if (!combining) {
        return text
      }
      return applyAccent(text, combining)
    },
    discard: true,
  }
}

function lastArgumentText(info: MacroTextReplacementInfo): string {
  if (info.node.arguments.length === 0) {
    return ''
  }
  const last = info.node.arguments[info.node.arguments.length - 1]
  return argumentText(info, last)
}

function optionalArgumentText(info: MacroTextReplacementInfo): string | undefined {
  const opt = info.node.arguments.find(arg => arg.type === 'optional')
  return opt ? argumentText(info, opt) : undefined
}

function placeholderBlock(context: LatexNodes2Text, label: string, block = true): string {
  const spaced = label.split('').join(' ')
  const text = `< ${spaced} >`
  if (!block) {
    return ` ${text} `
  }
  return context.formatIndentedBlock(text)
}

function latexToday(): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const now = new Date()
  const month = months[now.getMonth()] ?? ''
  return `${month} ${now.getDate()}, ${now.getFullYear()}`
}

type MathStyleKey =
  | 'bold'
  | 'italic'
  | 'bold-italic'
  | 'script'
  | 'bold-script'
  | 'fraktur'
  | 'doublestruck'
  | 'bold-fraktur'
  | 'sans'
  | 'sans-bold'
  | 'sans-italic'
  | 'sans-bold-italic'
  | 'monospace'

const mathStyleOffsets: Record<MathStyleKey, [number, number]> = {
  'bold': [0x1D400, 0x1D41A],
  'italic': [0x1D434, 0x1D44E],
  'bold-italic': [0x1D468, 0x1D482],
  'script': [0x1D49C, 0x1D4B6],
  'bold-script': [0x1D4D0, 0x1D4EA],
  'fraktur': [0x1D504, 0x1D51E],
  'doublestruck': [0x1D538, 0x1D552],
  'bold-fraktur': [0x1D56C, 0x1D586],
  'sans': [0x1D5A0, 0x1D5BA],
  'sans-bold': [0x1D5D4, 0x1D5EE],
  'sans-italic': [0x1D608, 0x1D622],
  'sans-bold-italic': [0x1D63C, 0x1D656],
  'monospace': [0x1D670, 0x1D68A],
}

const mathStyleExceptions: Partial<Record<MathStyleKey, Record<number, string>>> = {
  italic: {
    0x68: '\u210E',
  },
  script: {
    0x42: '\u212C',
    0x45: '\u2130',
    0x46: '\u2131',
    0x48: '\u210B',
    0x49: '\u2110',
    0x4C: '\u2112',
    0x4D: '\u2133',
    0x52: '\u211B',
    0x65: '\u212F',
    0x67: '\u210A',
    0x6F: '\u2134',
  },
  fraktur: {
    0x43: '\u212D',
    0x48: '\u210C',
    0x49: '\u2111',
    0x52: '\u211C',
    0x5A: '\u2128',
  },
  doublestruck: {
    0x43: '\u2102',
    0x48: '\u210D',
    0x4E: '\u2115',
    0x50: '\u2119',
    0x51: '\u211A',
    0x52: '\u211D',
    0x5A: '\u2124',
  },
}

const charCodeA = 'A'.charCodeAt(0)
const charCodeZ = 'Z'.charCodeAt(0)
const charCodea = 'a'.charCodeAt(0)
const charCodez = 'z'.charCodeAt(0)

function formatMathStyleChar(ch: string, style: MathStyleKey): string {
  if (!ch) {
    return ch
  }
  const code = ch.codePointAt(0)
  if (code === undefined) {
    return ch
  }
  const exception = mathStyleExceptions[style]?.[code]
  if (exception) {
    return exception
  }
  const offsets = mathStyleOffsets[style]
  if (!offsets) {
    return ch
  }
  if (code >= charCodeA && code <= charCodeZ) {
    return String.fromCodePoint(offsets[0] + (code - charCodeA))
  }
  if (code >= charCodea && code <= charCodez) {
    return String.fromCodePoint(offsets[1] + (code - charCodea))
  }
  return ch
}

function formatMathTextStyle(text: string, style: MathStyleKey): string {
  let result = ''
  for (const ch of text) {
    result += formatMathStyleChar(ch, style)
  }
  return result
}

function makeMathStyleMacro(name: string, style: MathStyleKey): MacroTextSpec {
  return {
    name,
    discard: true,
    replacement: info => formatMathTextStyle(lastArgumentText(info), style),
  }
}

function registerMacro(target: Map<string, MacroTextSpec>, spec: MacroTextSpec): void {
  target.set(spec.name, spec)
}

const macroSpecsMap = new Map<string, MacroTextSpec>()

for (const record of generatedStringMacroTextSpecs) {
  registerMacro(macroSpecsMap, {
    name: record.name,
    replacement: record.replacement,
    discard: record.discard,
  })
}

for (const record of generatedNoneMacroTextSpecs) {
  registerMacro(macroSpecsMap, {
    name: record.name,
    discard: record.discard,
  })
}

const manualMacroSpecs: MacroTextSpec[] = [
  {
    name: 'includegraphics',
    discard: true,
    replacement: info => placeholderBlock(info.context, 'graphics'),
  },
  {
    name: 'item',
    discard: true,
    replacement: (info) => {
      const label = optionalArgumentText(info)
      if (label && label.trim().length > 0) {
        return `\n  ${label}`
      }
      return '\n  * '
    },
  },
  {
    name: 'href',
    discard: true,
    replacement: (info) => {
      const url = firstArgumentText(info)
      const text = secondArgumentText(info)
      return text ? `${text} <${url}>` : `<${url}>`
    },
  },
  {
    name: 'colorbox',
    discard: true,
    replacement: info => lastArgumentText(info),
  },
  {
    name: 'fcolorbox',
    discard: true,
    replacement: info => lastArgumentText(info),
  },
  {
    name: 'cite',
    discard: true,
    replacement: '<cit.>',
  },
  {
    name: 'citet',
    discard: true,
    replacement: '<cit.>',
  },
  {
    name: 'citep',
    discard: true,
    replacement: '<cit.>',
  },
  {
    name: 'citealt',
    discard: true,
    replacement: '',
  },
  {
    name: 'citealp',
    discard: true,
    replacement: '',
  },
  {
    name: 'citeauthor',
    discard: true,
    replacement: '',
  },
  {
    name: 'citefullauthor',
    discard: true,
    replacement: '',
  },
  {
    name: 'citeyear',
    discard: true,
    replacement: '',
  },
  {
    name: 'citeyearpar',
    discard: true,
    replacement: '',
  },
  {
    name: 'Cite',
    discard: true,
    replacement: info => lastArgumentText(info),
  },
  {
    name: 'Citet',
    discard: true,
    replacement: '',
  },
  {
    name: 'Citep',
    discard: true,
    replacement: '',
  },
  {
    name: 'Citealt',
    discard: true,
    replacement: '',
  },
  {
    name: 'Citealp',
    discard: true,
    replacement: '',
  },
  {
    name: 'Citeauthor',
    discard: true,
    replacement: '',
  },
  {
    name: 'Citefullauthor',
    discard: true,
    replacement: '',
  },
  {
    name: 'Citeyear',
    discard: true,
    replacement: '',
  },
  {
    name: 'Citeyearpar',
    discard: true,
    replacement: '',
  },
  {
    name: 'citetext',
    discard: true,
    replacement: '',
  },
  {
    name: 'Citetext',
    discard: true,
    replacement: info => lastArgumentText(info),
  },
  {
    name: 'citetalias',
    discard: true,
    replacement: '',
  },
  {
    name: 'Citetalias',
    discard: true,
    replacement: info => lastArgumentText(info),
  },
  {
    name: 'citepalias',
    discard: true,
    replacement: '',
  },
  {
    name: 'Citepalias',
    discard: true,
    replacement: info => lastArgumentText(info),
  },
  {
    name: 'citenum',
    discard: true,
    replacement: '',
  },
  {
    name: 'Citenum',
    discard: true,
    replacement: info => lastArgumentText(info),
  },
  {
    name: 'defcitealias',
    discard: true,
    replacement: '',
  },
  {
    name: 'Defcitealias',
    discard: true,
    replacement: info => info.node.arguments.map(arg => argumentText(info, arg)).join(''),
  },
  {
    name: 'title',
    discard: true,
    replacement: (info) => {
      info.context.setDocumentMetadata('title', firstArgumentText(info))
      return ''
    },
  },
  {
    name: 'author',
    discard: true,
    replacement: (info) => {
      info.context.setDocumentMetadata('author', firstArgumentText(info))
      return ''
    },
  },
  {
    name: 'date',
    discard: true,
    replacement: (info) => {
      const text = firstArgumentText(info)
      info.context.setDocumentMetadata('date', text || latexToday())
      return ''
    },
  },
  {
    name: 'maketitle',
    discard: true,
    replacement: (info) => {
      const title = info.context.getDocumentMetadata('title') ?? '[NO \\title GIVEN]'
      const author = info.context.getDocumentMetadata('author') ?? '[NO \\author GIVEN]'
      const date = info.context.getDocumentMetadata('date') ?? latexToday()
      const underlineWidth = Math.max(title.length, author.length + 4, date.length + 4)
      const underline = '='.repeat(underlineWidth)
      return `${title}\n    ${author}\n    ${date}\n${underline}\n\n`
    },
  },
  {
    name: 'part',
    discard: true,
    replacement: info => `\n\nPART: ${lastArgumentText(info).toUpperCase()}\n`,
  },
  {
    name: 'chapter',
    discard: true,
    replacement: info => `\n\nCHAPTER: ${lastArgumentText(info).toUpperCase()}\n`,
  },
  {
    name: 'section',
    discard: true,
    replacement: info => `\n\n§ ${lastArgumentText(info).toUpperCase()}\n`,
  },
  {
    name: 'subsection',
    discard: true,
    replacement: info => `\n\n §.§ ${lastArgumentText(info)}\n`,
  },
  {
    name: 'subsubsection',
    discard: true,
    replacement: info => `\n\n  §.§.§ ${lastArgumentText(info)}\n`,
  },
  {
    name: 'paragraph',
    discard: true,
    replacement: info => `\n\n  ${lastArgumentText(info)}\n`,
  },
  {
    name: 'subparagraph',
    discard: true,
    replacement: info => `\n\n    ${lastArgumentText(info)}\n`,
  },
  {
    name: 'texorpdfstring',
    discard: true,
    replacement: info => secondArgumentText(info),
  },
  makeMathStyleMacro('mathbf', 'bold'),
  makeMathStyleMacro('mathit', 'italic'),
  makeMathStyleMacro('mathsf', 'sans'),
  makeMathStyleMacro('mathbb', 'doublestruck'),
  makeMathStyleMacro('mathtt', 'monospace'),
  makeMathStyleMacro('mathcal', 'script'),
  makeMathStyleMacro('mathscr', 'script'),
  makeMathStyleMacro('mathfrak', 'fraktur'),
  {
    name: 'input',
    discard: true,
    replacement: () => '',
  },
  {
    name: 'include',
    discard: true,
    replacement: () => '',
  },
  {
    name: '%',
    discard: true,
    replacement: () => '%',
  },
]

for (const spec of manualMacroSpecs) {
  registerMacro(macroSpecsMap, spec)
}

const discardOnlyMacroNames = [
  'documentclass',
  'usepackage',
  'RequirePackage',
  'selectlanguage',
  'setlength',
  'addlength',
  'setcounter',
  'addcounter',
  'newcommand',
  'renewcommand',
  'providecommand',
  'newenvironment',
  'renewenvironment',
  'provideenvironment',
  'DeclareMathOperator',
  'mbox',
  'bibliography',
  'textmd',
  'textsf',
  'texttt',
  'textup',
  'label',
  'hypersetup',
  'keywords',
  'hphantom',
  'vphantom',
  'xleftarrow',
  'xrightarrow',
  'definecolor',
  'providecolor',
  'colorlet',
  'pagecolor',
  'nopagecolor',
  'color',
  'boxframe',
  'rowcolors',
]

for (const name of discardOnlyMacroNames) {
  registerMacro(macroSpecsMap, { name, discard: true, replacement: () => '' })
}

for (const name of Object.keys(accentCombining)) {
  registerMacro(macroSpecsMap, accentSpec(name))
}

const macros: MacroTextSpec[] = Array.from(macroSpecsMap.values())

function registerEnvironment(target: Map<string, EnvironmentTextSpec>, spec: EnvironmentTextSpec): void {
  target.set(spec.name, spec)
}

const environmentSpecsMap = new Map<string, EnvironmentTextSpec>()

for (const record of generatedStringEnvironmentTextSpecs) {
  const spec: EnvironmentTextSpec = {
    name: record.name,
    discard: record.discard,
  }
  if ('replacement' in record && record.replacement !== undefined) {
    spec.replacement = record.replacement
  }
  registerEnvironment(environmentSpecsMap, spec)
}

function formatEquationEnvironment(info: EnvironmentTextReplacementInfo): string {
  const body = info.toText(info.node.children)
  return info.context.formatIndentedBlock(body.trim())
}

function formatMatrixEnvironment(info: EnvironmentTextReplacementInfo): string {
  interface State {
    rows: string[][]
    currentRow: string[]
    buffer: LatexNode[]
  }

  const state: State = { rows: [], currentRow: [], buffer: [] }

  const flushBuffer = () => {
    if (state.buffer.length === 0) {
      state.currentRow.push('')
      return
    }
    const text = info.toText(state.buffer).trim()
    state.currentRow.push(text)
    state.buffer = []
  }

  const flushRow = () => {
    if (state.buffer.length > 0 || state.currentRow.length === 0) {
      flushBuffer()
    }
    if (state.currentRow.length > 0) {
      state.rows.push(state.currentRow)
    }
    state.currentRow = []
  }

  for (const node of info.node.children) {
    if (node.kind === 'specials' && node.chars === '&') {
      flushBuffer()
      continue
    }
    if (node.kind === 'macro' && node.name === '\\') {
      flushRow()
      continue
    }
    state.buffer.push(node)
  }

  flushRow()

  const flatCells = state.rows.flat()
  const maxWidth = flatCells.reduce((max, cell) => Math.max(max, cell.length), 0)
  const formattedRows = state.rows.map(row => row.map(cell => cell.padStart(maxWidth, ' ')).join(' '))
  return `[ ${formattedRows.join(' ; ')} ]`
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

for (const name of equationEnvironmentNames) {
  registerEnvironment(environmentSpecsMap, {
    name,
    replacement: formatEquationEnvironment,
    discard: false,
  })
}

for (const name of matrixEnvironmentNames) {
  registerEnvironment(environmentSpecsMap, {
    name,
    replacement: formatMatrixEnvironment,
    discard: false,
  })
}

registerEnvironment(environmentSpecsMap, { name: 'verbatim', discard: true })
registerEnvironment(environmentSpecsMap, { name: 'lstlisting', discard: true })

const environments: EnvironmentTextSpec[] = Array.from(environmentSpecsMap.values())

const specialsMap = new Map<string, SpecialsTextSpec>()
for (const record of generatedStringSpecialTextSpecs) {
  specialsMap.set(record.chars, { chars: record.chars, replacement: record.replacement })
}

const manualSpecials: SpecialsTextSpec[] = [
  { chars: '~', replacement: '\u00A0' },
  { chars: '--', replacement: '–' },
  { chars: '---', replacement: '—' },
  { chars: '``', replacement: '“' },
  { chars: '\'\'', replacement: '”' },
  { chars: '!`', replacement: '¡' },
  { chars: '?`', replacement: '¿' },
]

for (const spec of manualSpecials) {
  specialsMap.set(spec.chars, spec)
}

const specials: SpecialsTextSpec[] = Array.from(specialsMap.values())

export function createDefaultTextContext(): LatexTextContext {
  return new LatexTextContext({ macros, environments, specials })
}
