import { LatexWalker } from '../core/walker'
import type { LatexEnvironmentNode, LatexMacroArgument, LatexMacroNode, LatexNode, LatexSpecialsNode } from '../core/nodes'
import type { LatexParsingContext } from '../core/context'
import { createDefaultParsingContext } from '../core/defaultParsingContext'
import type { EnvironmentTextReplacementInfo, LatexTextContext, MacroTextReplacementInfo } from './specs'
import { createDefaultTextContext } from './defaultTextContext'

export type MathModeBehavior = 'text' | 'with-delimiters' | 'verbatim' | 'remove'

export interface LatexNodes2TextOptions {
  parsingContext?: LatexParsingContext
  textContext?: LatexTextContext
  mathMode?: MathModeBehavior
  keepComments?: boolean
  strictSpaces?: boolean
  keepBracedGroups?: boolean
  keepBracedGroupsMinLength?: number
}

interface ConversionState {
  inMath: boolean
}

export class LatexNodes2Text {
  private readonly parsingContext: LatexParsingContext
  private readonly textContext: LatexTextContext
  private readonly options: Required<Omit<LatexNodes2TextOptions, 'parsingContext' | 'textContext'>>

  constructor(options: LatexNodes2TextOptions = {}) {
    this.parsingContext = options.parsingContext ?? createDefaultParsingContext()
    this.textContext = options.textContext ?? createDefaultTextContext()
    this.options = {
      mathMode: options.mathMode ?? 'text',
      keepComments: options.keepComments ?? false,
      strictSpaces: options.strictSpaces ?? false,
      keepBracedGroups: options.keepBracedGroups ?? false,
      keepBracedGroupsMinLength: options.keepBracedGroupsMinLength ?? 0,
    }
  }

  latexToText(input: string): string {
    const walker = new LatexWalker(input, { context: this.parsingContext })
    const nodes = walker.getNodes()
    return this.nodesToText(nodes)
  }

  nodesToText(nodes: LatexNode | LatexNode[]): string {
    const state: ConversionState = { inMath: false }
    if (Array.isArray(nodes)) {
      return this.nodesArrayToText(nodes, state)
    }
    return this.nodeToText(nodes, state)
  }

  private nodesArrayToText(nodes: LatexNode[], state: ConversionState): string {
    return nodes.map(node => this.nodeToText(node, { ...state })).join('')
  }

  private nodeToText(node: LatexNode, state: ConversionState): string {
    switch (node.kind) {
      case 'chars':
        return this.handleChars(node.content, state)
      case 'group':
        return this.handleGroup(node, state)
      case 'macro':
        return this.handleMacro(node, state)
      case 'environment':
        return this.handleEnvironment(node, state)
      case 'math':
        return this.handleMath(node, state)
      case 'comment':
        return this.options.keepComments ? node.content : ''
      case 'specials':
        return this.handleSpecials(node, state)
      default:
        return ''
    }
  }

  private handleChars(content: string, _state: ConversionState): string {
    if (this.options.strictSpaces) {
      return content.replace(/\s+/g, match => (match.includes('\n') ? '\n' : ' '))
    }
    return content
  }

  private handleGroup(node: LatexNode & { kind: 'group', children: LatexNode[], delimiters: { open: string, close: string } }, state: ConversionState): string {
    const inner = this.nodesArrayToText(node.children, state)
    if (!this.options.keepBracedGroups) {
      return inner
    }
    if (inner.length < this.options.keepBracedGroupsMinLength) {
      return inner
    }
    return `${node.delimiters.open}${inner}${node.delimiters.close}`
  }

  private handleMacro(node: LatexMacroNode, state: ConversionState): string {
    const spec = this.textContext.getMacro(node.name)
    const argTexts = node.arguments.map(arg => this.macroArgumentToText(arg, state))

    if (!spec) {
      return argTexts.join('') + this.trailingWhitespace(node)
    }
    if (spec.discard) {
      return ''
    }

    const replacement = spec.replacement
    let rendered = ''
    if (!replacement) {
      rendered = argTexts.join('')
    }
    else if (typeof replacement === 'string') {
      rendered = this.applyTemplate(replacement, argTexts)
    }
    else {
      rendered = replacement({
        node,
        toText: payload => this.payloadToText(payload, state),
      } as MacroTextReplacementInfo)
    }

    return rendered + this.trailingWhitespace(node)
  }

  private payloadToText(payload: LatexNode | LatexNode[] | undefined, state: ConversionState): string {
    if (!payload) {
      return ''
    }
    if (Array.isArray(payload)) {
      return this.nodesArrayToText(payload, state)
    }
    return this.nodeToText(payload, state)
  }

  private trailingWhitespace(node: LatexMacroNode): string {
    return this.options.strictSpaces ? '' : node.trailingWhitespace
  }

  private macroArgumentToText(argument: LatexMacroArgument, state: ConversionState): string {
    if (argument.type === 'group' || argument.type === 'optional') {
      return this.nodesArrayToText(argument.nodes, state)
    }
    if (argument.type === 'star' || argument.type === 'token') {
      return argument.content
    }
    return ''
  }

  private handleEnvironment(node: LatexEnvironmentNode, state: ConversionState): string {
    const spec = this.textContext.getEnvironment(node.name)
    const envSpec = this.parsingContext.getEnvironmentSpec(node.name)
    const innerState = { ...state, inMath: envSpec?.isMathMode ?? state.inMath }
    const body = this.nodesArrayToText(node.children, innerState)

    if (!spec) {
      return body
    }
    if (spec.discard) {
      return ''
    }

    const replacement = spec.replacement
    if (!replacement) {
      return body
    }

    if (typeof replacement === 'string') {
      return this.applyTemplate(replacement, node.arguments.map(arg => this.macroArgumentToText(arg, state)), {
        body,
      })
    }

    return replacement({
      node,
      toText: payload => this.payloadToText(payload, innerState),
    } as EnvironmentTextReplacementInfo)
  }

  private handleMath(node: LatexNode & { kind: 'math', content: LatexNode[], leftDelimiter: string, rightDelimiter: string }, state: ConversionState): string {
    const innerState = { ...state, inMath: true }
    const inner = this.nodesArrayToText(node.content, innerState)
    switch (this.options.mathMode) {
      case 'remove':
        return ''
      case 'verbatim':
        return `${node.leftDelimiter}${inner}${node.rightDelimiter}`
      case 'with-delimiters':
        return `${node.leftDelimiter}${inner}${node.rightDelimiter}`
      default:
        return inner
    }
  }

  private handleSpecials(node: LatexSpecialsNode, _state: ConversionState): string {
    const spec = this.textContext.getSpecials(node.chars)
    if (!spec) {
      return node.chars
    }
    if (!spec.replacement) {
      return node.chars
    }
    if (typeof spec.replacement === 'string') {
      return spec.replacement
    }
    return spec.replacement(node)
  }

  private applyTemplate(template: string, argTexts: string[], extras?: Record<string, string>): string {
    if (/%\([^)]+\)s/.test(template)) {
      return template.replace(/%\(([^)]+)\)s/g, (_, name: string) => {
        if (name === 's') {
          return argTexts.join('')
        }
        if (name === 'body') {
          return extras?.body ?? ''
        }
        const index = Number(name) - 1
        if (!Number.isNaN(index) && index >= 0 && index < argTexts.length) {
          return argTexts[index]
        }
        return ''
      })
    }
    if (template.includes('%s')) {
      return template.replace(/%s/g, argTexts.join(''))
    }
    return template
  }
}
