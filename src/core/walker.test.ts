import { describe, expect, it } from 'vitest'
import type { LatexMacroArgumentGroup, LatexMacroArgumentOptional } from './nodes'
import { LatexWalker } from './walker'
import { createDefaultParsingContext } from './defaultParsingContext'

function nodesToString(nodes: LatexMacroArgumentGroup['nodes']): string {
  return nodes.map((node) => {
    if (node.kind === 'chars') {
      return node.content
    }
    if (node.kind === 'group') {
      return nodesToString(node.children)
    }
    if (node.kind === 'macro') {
      return `\\${node.name}`
    }
    if (node.kind === 'specials') {
      return node.chars
    }
    return ''
  }).join('')
}

const context = createDefaultParsingContext()

describe('latexWalker macro parsing', () => {
  it('parses optional and required arguments following the spec', () => {
    const walker = new LatexWalker('\\section[Short]{Title}', { context })
    const nodes = walker.getNodes()
    expect(nodes).toHaveLength(1)
    const section = nodes[0]
    expect(section.kind).toBe('macro')
    if (section.kind !== 'macro') {
      throw new Error('Expected macro node')
    }
    expect(section.name).toBe('section')
    expect(section.arguments.map(arg => arg.type)).toEqual(['optional', 'group'])

    const optional = section.arguments[0] as LatexMacroArgumentOptional
    expect(nodesToString(optional.nodes)).toBe('Short')

    const group = section.arguments[1] as LatexMacroArgumentGroup
    expect(nodesToString(group.nodes)).toBe('Title')
  })

  it('treats the longest specials sequence as a single node', () => {
    const walker = new LatexWalker('A---B', { context })
    const nodes = walker.getNodes()
    expect(nodes.map(node => node.kind)).toEqual(['chars', 'specials', 'chars'])
    const specials = nodes[1]
    if (specials.kind !== 'specials') {
      throw new Error('Expected specials node')
    }
    expect(specials.chars).toBe('---')
  })

  it('parses verb macros with and without star modifiers', () => {
    const walker = new LatexWalker('\\verb|text| \\verb*|a b|', { context })
    const nodes = walker.getNodes()
    expect(nodes).toHaveLength(2)

    const verb = nodes[0]
    expect(verb.kind).toBe('verb')
    if (verb.kind !== 'verb') {
      throw new Error('Expected verb node')
    }
    expect(verb.content).toBe('text')
    expect(verb.delimiter).toBe('|')
    expect(verb.starred).toBe(false)
    expect(verb.trailingWhitespace).toBe(' ')

    const verbStar = nodes[1]
    expect(verbStar.kind).toBe('verb')
    if (verbStar.kind !== 'verb') {
      throw new Error('Expected verb node')
    }
    expect(verbStar.content).toBe('a b')
    expect(verbStar.starred).toBe(true)
  })

  it('parses bare mandatory arguments for accent macros', () => {
    const walker = new LatexWalker('\\hat x', { context })
    const nodes = walker.getNodes()
    expect(nodes).toHaveLength(1)
    const macro = nodes[0]
    expect(macro.kind).toBe('macro')
    if (macro.kind !== 'macro') {
      throw new Error('Expected macro node')
    }
    expect(macro.arguments).toHaveLength(1)
    const group = macro.arguments[0]
    expect(group.type).toBe('group')
    if (group.type !== 'group') {
      throw new Error('Expected group argument')
    }
    expect(group.delimiters).toEqual({ open: '', close: '' })
    expect(group.nodes).toHaveLength(1)
    const charNode = group.nodes[0]
    expect(charNode.kind).toBe('chars')
    if (charNode.kind !== 'chars') {
      throw new Error('Expected chars node')
    }
    expect(charNode.content).toBe('x')
  })
})

describe('latexWalker environment parsing', () => {
  it('parses additional environment arguments defined in the context', () => {
    const latex = '\\begin{tabularx}{100pt}[c]{ab}X\\end{tabularx}'
    const walker = new LatexWalker(latex, { context })
    const nodes = walker.getNodes()
    expect(nodes).toHaveLength(1)

    const env = nodes[0]
    expect(env.kind).toBe('environment')
    if (env.kind !== 'environment') {
      throw new Error('Expected environment node')
    }

    expect(env.name).toBe('tabularx')
    expect(env.arguments.map(arg => arg.type)).toEqual(['group', 'optional', 'group'])
    const [widthArg, posArg, colsArg] = env.arguments as [LatexMacroArgumentGroup, LatexMacroArgumentOptional, LatexMacroArgumentGroup]
    expect(nodesToString(widthArg.nodes)).toBe('100pt')
    expect(nodesToString(posArg.nodes)).toBe('c')
    expect(nodesToString(colsArg.nodes)).toBe('ab')
    expect(env.children.some(node => node.kind === 'chars' && node.content === 'X')).toBe(true)
  })

  it('captures math environments and their contents', () => {
    const latex = '\\begin{align}a+b\\\\ c+d\\end{align}'
    const walker = new LatexWalker(latex, { context })
    const nodes = walker.getNodes()
    expect(nodes).toHaveLength(1)
    const env = nodes[0]
    expect(env.kind).toBe('environment')
    if (env.kind !== 'environment') {
      throw new Error('Expected environment node')
    }
    expect(env.name).toBe('align')
    expect(env.arguments).toHaveLength(0)
    expect(env.children.some(node => node.kind === 'macro' && node.name === '\\')).toBe(true)
  })

  it('treats verbatim environments as raw text', () => {
    const latex = ['\\begin{verbatim}', 'line1', '\\textbf{not a macro}', '\\end{verbatim}'].join('\n')
    const walker = new LatexWalker(latex, { context })
    const nodes = walker.getNodes()
    expect(nodes).toHaveLength(1)
    const env = nodes[0]
    expect(env.kind).toBe('environment')
    if (env.kind !== 'environment') {
      throw new Error('Expected environment node')
    }
    expect(env.name).toBe('verbatim')
    const expectedBody = `line1\n\\textbf{not a macro}\n`
      .replace(/\\n/g, '\n')
    expect(env.rawContent).toBe(expectedBody)
    expect(env.children).toHaveLength(1)
    const child = env.children[0]
    expect(child.kind).toBe('chars')
    if (child.kind !== 'chars') {
      throw new Error('Expected chars node inside verbatim environment')
    }
    expect(child.content).toBe(expectedBody)
  })
})
