import type { LatexMacroArgument, LatexNode } from '../core/nodes'
import type { EnvironmentTextSpec, MacroTextReplacementInfo, MacroTextSpec, SpecialsTextSpec } from './specs'
import { LatexTextContext } from './specs'

const greekLetters: Record<string, string> = {
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  varepsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  vartheta: 'ϑ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  omicron: 'ο',
  pi: 'π',
  varpi: 'ϖ',
  rho: 'ρ',
  varrho: 'ϱ',
  sigma: 'σ',
  varsigma: 'ς',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  varphi: 'ϕ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
  Gamma: 'Γ',
  Delta: 'Δ',
  Theta: 'Θ',
  Lambda: 'Λ',
  Xi: 'Ξ',
  Pi: 'Π',
  Sigma: 'Σ',
  Upsilon: 'Υ',
  Phi: 'Φ',
  Psi: 'Ψ',
  Omega: 'Ω',
}

const mathSymbols: Record<string, string> = {
  pm: '±',
  times: '×',
  div: '÷',
  cdot: '·',
  leq: '≤',
  geq: '≥',
  neq: '≠',
  approx: '≈',
  infty: '∞',
  partial: '∂',
  nabla: '∇',
  to: '→',
  leftarrow: '←',
  Rightarrow: '⇒',
  implies: '⇒',
  mapsto: '↦',
  subseteq: '⊆',
  supseteq: '⊇',
  subset: '⊂',
  supset: '⊃',
  cup: '∪',
  cap: '∩',
  forall: '∀',
  exists: '∃',
  neg: '¬',
  ge: '≥',
  le: '≤',
  ll: '≪',
  gg: '≫',
  ldots: '…',
  cdots: '⋯',
  vdots: '⋮',
  ddots: '⋱',
  aleph: 'ℵ',
}

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
}

const superscriptMap: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  'n': 'ⁿ',
  'i': 'ⁱ',
}

const subscriptMap: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  'a': 'ₐ',
  'e': 'ₑ',
  'h': 'ₕ',
  'i': 'ᵢ',
  'j': 'ⱼ',
  'k': 'ₖ',
  'l': 'ₗ',
  'm': 'ₘ',
  'n': 'ₙ',
  'o': 'ₒ',
  'p': 'ₚ',
  'r': 'ᵣ',
  's': 'ₛ',
  't': 'ₜ',
  'u': 'ᵤ',
  'v': 'ᵥ',
  'x': 'ₓ',
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
  if (base.length === 1) {
    return (base + combining).normalize('NFC')
  }
  const first = base.charAt(0)
  return (first + combining + base.slice(1)).normalize('NFC')
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
  }
}

function simpleIdentitySpec(name: string, transform?: (text: string) => string): MacroTextSpec {
  return {
    name,
    replacement: (info) => {
      const content = firstArgumentText(info)
      return transform ? transform(content) : content
    },
  }
}

function simpleTemplateSpec(name: string, template: string): MacroTextSpec {
  return { name, replacement: template }
}

function makeGreekSpecs(): MacroTextSpec[] {
  return (Object.entries(greekLetters) as Array<[string, string]>)
    .map(([name, value]) => ({ name, replacement: value }))
}

function makeMathSymbolSpecs(): MacroTextSpec[] {
  return (Object.entries(mathSymbols) as Array<[string, string]>)
    .map(([name, value]) => ({ name, replacement: value }))
}

const macros: MacroTextSpec[] = [
  simpleIdentitySpec('textbf'),
  simpleIdentitySpec('textit'),
  simpleIdentitySpec('texttt'),
  simpleIdentitySpec('textsf'),
  simpleIdentitySpec('textrm'),
  simpleIdentitySpec('textnormal'),
  simpleIdentitySpec('emph'),
  simpleIdentitySpec('em'),
  simpleIdentitySpec('underline'),
  simpleIdentitySpec('overline'),
  simpleIdentitySpec('mathbf'),
  simpleIdentitySpec('mathrm'),
  simpleIdentitySpec('mathit'),
  simpleIdentitySpec('mathsf'),
  simpleIdentitySpec('mathbb'),
  simpleIdentitySpec('operatorname'),
  {
    name: 'textsc',
    replacement: info => firstArgumentText(info).toUpperCase(),
  },
  {
    name: 'textsuperscript',
    replacement: info => convertWithMap(firstArgumentText(info), superscriptMap),
  },
  {
    name: 'textsubscript',
    replacement: info => convertWithMap(firstArgumentText(info), subscriptMap),
  },
  {
    name: 'frac',
    replacement: (info) => {
      const num = firstArgumentText(info)
      const den = secondArgumentText(info)
      return den ? `${num}/${den}` : num
    },
  },
  {
    name: 'sqrt',
    replacement: (info) => {
      const main = secondArgumentText(info) || firstArgumentText(info)
      return `√(${main})`
    },
  },
  simpleTemplateSpec('ldots', '…'),
  simpleTemplateSpec('cdots', '⋯'),
  simpleTemplateSpec('dots', '…'),
  simpleTemplateSpec('LaTeX', 'LaTeX'),
  simpleTemplateSpec('TeX', 'TeX'),
  simpleTemplateSpec('textellipsis', '…'),
  {
    name: '\\',
    replacement: '\n',
  },
  {
    name: 'par',
    replacement: '\n\n',
  },
  {
    name: 'newline',
    replacement: '\n',
  },
  {
    name: 'item',
    replacement: (info) => {
      const optArg = info.node.arguments.find(arg => arg.type === 'optional')
      const label = argumentText(info, optArg) || '*'
      return `\n  ${label} `
    },
  },
  {
    name: 'section',
    replacement: info => `\n\n${firstArgumentText(info).toUpperCase()}\n`,
  },
  {
    name: 'subsection',
    replacement: info => `\n\n${firstArgumentText(info)}\n`,
  },
  {
    name: 'subsubsection',
    replacement: info => `\n\n${firstArgumentText(info)}\n`,
  },
  {
    name: 'paragraph',
    replacement: info => `\n\n${firstArgumentText(info)} — `,
  },
  {
    name: 'footnote',
    replacement: (info) => {
      const labelArg = info.node.arguments.find(arg => arg.type === 'optional')
      const label = argumentText(info, labelArg)
      const lastArg = info.node.arguments[info.node.arguments.length - 1]
      const text = argumentText(info, lastArg)
      const prefix = label ? `${label} ` : ''
      return `[${prefix}${text}]`
    },
  },
  {
    name: 'href',
    replacement: (info) => {
      const url = firstArgumentText(info)
      const text = secondArgumentText(info)
      return text ? `${text} <${url}>` : `<${url}>`
    },
  },
  {
    name: 'url',
    replacement: info => `<${firstArgumentText(info)}>`,
  },
  {
    name: 'left',
    replacement: '',
  },
  {
    name: 'right',
    replacement: '',
  },
  {
    name: 'textcolor',
    replacement: info => secondArgumentText(info),
  },
  {
    name: 'color',
    replacement: info => firstArgumentText(info),
  },
  {
    name: 'ensuremath',
    replacement: info => firstArgumentText(info),
  },
  ...makeGreekSpecs(),
  ...makeMathSymbolSpecs(),
  ...Object.keys(accentCombining).map(name => accentSpec(name)),
]

const environments: EnvironmentTextSpec[] = [
  {
    name: 'center',
    replacement: '\n%(body)s\n',
  },
  {
    name: 'flushleft',
    replacement: '\n%(body)s\n',
  },
  {
    name: 'flushright',
    replacement: '\n%(body)s\n',
  },
  {
    name: 'equation',
    replacement: '\n%(body)s\n',
  },
  {
    name: 'equation*',
    replacement: '\n%(body)s\n',
  },
  {
    name: 'align',
    replacement: '\n%(body)s\n',
  },
  {
    name: 'align*',
    replacement: '\n%(body)s\n',
  },
  {
    name: 'itemize',
    replacement: '\n%(body)s\n',
  },
  {
    name: 'enumerate',
    replacement: '\n%(body)s\n',
  },
  {
    name: 'description',
    replacement: '\n%(body)s\n',
  },
  {
    name: 'figure',
    discard: true,
  },
  {
    name: 'table',
    discard: true,
  },
]

const specials: SpecialsTextSpec[] = [
  { chars: '~', replacement: ' ' },
  { chars: '--', replacement: '–' },
  { chars: '---', replacement: '—' },
  { chars: '``', replacement: '“' },
  { chars: '\'\'', replacement: '”' },
]

function convertWithMap(input: string, mapping: Record<string, string>): string {
  let result = ''
  for (const ch of input) {
    result += mapping[ch] ?? ch
  }
  return result
}

export function createDefaultTextContext(): LatexTextContext {
  return new LatexTextContext({ macros, environments, specials })
}
