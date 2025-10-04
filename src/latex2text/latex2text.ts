import * as fs from 'node:fs'
import * as path from 'node:path'
import { LatexWalker } from '../core/walker'
import type {
  LatexEnvironmentNode,
  LatexMacroArgument,
  LatexMacroNode,
  LatexNode,
  LatexSpecialsNode,
  LatexVerbNode,
} from '../core/nodes'
import type { LatexParsingContext } from '../core/context'
import { createDefaultParsingContext } from '../core/defaultParsingContext'
import type { LatexTextContext } from './specs'
import { createDefaultTextContext } from './defaultTextContext'
import {
  type StrictLatexSpacesConfig,
  type StrictLatexSpacesOption,
  getEquationWhitespaceConfig,
  parseStrictLatexSpacesConfig,
} from './whitespaceConfig'

export type MathModeBehavior = 'text' | 'with-delimiters' | 'verbatim' | 'remove'

export interface LatexNodes2TextOptions {
  parsingContext?: LatexParsingContext
  textContext?: LatexTextContext
  mathMode?: MathModeBehavior
  keepComments?: boolean
  /**
   * @deprecated Use strictLatexSpaces for fine-grained control
   */
  strictSpaces?: boolean
  /**
   * Fine-grained whitespace handling configuration
   * Supports presets: 'based-on-source', 'macros', 'except-in-equations'
   * Or custom configuration object
   */
  strictLatexSpaces?: StrictLatexSpacesOption
  keepBracedGroups?: boolean
  keepBracedGroupsMinLength?: number
}

interface ConversionState {
  inMath: boolean
  whitespaceConfig: StrictLatexSpacesConfig
}

export class LatexNodes2Text {
  private readonly parsingContext: LatexParsingContext
  private readonly textContext: LatexTextContext
  private readonly options: Required<Omit<LatexNodes2TextOptions, 'parsingContext' | 'textContext' | 'strictSpaces' | 'strictLatexSpaces'>>
  private readonly strictLatexSpacesConfig: StrictLatexSpacesConfig
  private docTitle?: string
  private docAuthor?: string
  private docDate?: string
  private texInputDirectory?: string
  private strictInput = true

  constructor(options: LatexNodes2TextOptions = {}) {
    this.parsingContext = options.parsingContext ?? createDefaultParsingContext()
    this.textContext = options.textContext ?? createDefaultTextContext()

    // Handle deprecated strictSpaces option
    let strictLatexSpaces = options.strictLatexSpaces
    if (options.strictSpaces !== undefined && options.strictLatexSpaces === undefined) {
      // Legacy strictSpaces boolean - map to new system
      strictLatexSpaces = options.strictSpaces
    }

    this.strictLatexSpacesConfig = parseStrictLatexSpacesConfig(strictLatexSpaces)

    this.options = {
      mathMode: options.mathMode ?? 'text',
      keepComments: options.keepComments ?? false,
      keepBracedGroups: options.keepBracedGroups ?? false,
      keepBracedGroupsMinLength: options.keepBracedGroupsMinLength ?? 0,
    }
  }

  setDocumentMetadata(field: 'title' | 'author' | 'date', value: string): void {
    if (field === 'title') {
      this.docTitle = value
    }
    else if (field === 'author') {
      this.docAuthor = value
    }
    else if (field === 'date') {
      this.docDate = value
    }
  }

  getDocumentMetadata(field: 'title' | 'author' | 'date'): string | undefined {
    if (field === 'title') {
      return this.docTitle
    }
    if (field === 'author') {
      return this.docAuthor
    }
    return this.docDate
  }

  /**
   * Set directory for \input file resolution
   * @param directory - Base directory for resolving relative paths
   * @param strictInput - If true, throw on missing files; if false, return placeholder
   */
  setTexInputDirectory(directory: string, strictInput = true): void {
    if (!fs.existsSync(directory)) {
      throw new Error(`Directory does not exist: ${directory}`)
    }
    this.texInputDirectory = path.resolve(directory)
    this.strictInput = strictInput
  }

  /**
   * Read a LaTeX input file
   * @param filename - Filename relative to texInputDirectory
   * @returns File contents as string
   */
  readInputFile(filename: string): string {
    if (!this.texInputDirectory) {
      throw new Error('TeX input directory not set. Call setTexInputDirectory() first.')
    }

    // Add .tex extension if not present
    let normalizedFilename = filename
    if (!filename.endsWith('.tex')) {
      normalizedFilename = `${filename}.tex`
    }

    const fullPath = path.join(this.texInputDirectory, normalizedFilename)

    try {
      return fs.readFileSync(fullPath, 'utf-8')
    }
    catch {
      if (this.strictInput) {
        throw new Error(`Cannot read input file: ${filename}`)
      }
      return `[Could not read file: ${filename}]`
    }
  }

  formatIndentedBlock(contents: string, indent = '    '): string {
    const normalized = contents.replace(/\n/g, `\n${indent}`)
    return `\n${indent}${normalized}\n`
  }

  latexToText(input: string): string {
    const walker = new LatexWalker(input, { context: this.parsingContext })
    const nodes = walker.getNodes()
    return this.nodesToText(nodes)
  }

  nodesToText(nodes: LatexNode | LatexNode[]): string {
    const state: ConversionState = {
      inMath: false,
      whitespaceConfig: this.strictLatexSpacesConfig,
    }
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
      case 'verb':
        return this.handleVerb(node, state)
      default:
        return ''
    }
  }

  private handleChars(content: string, state: ConversionState): string {
    // For now, keep the simple strict behavior
    // More sophisticated whitespace handling based on whitespaceConfig
    // could be implemented here in the future
    if (state.whitespaceConfig.betweenLatexConstructs) {
      // Normalize whitespace when strict
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
    if (!spec) {
      return this.trailingWhitespace(node)
    }

    const argTexts = node.arguments.map(arg => this.macroArgumentToText(arg, state))

    const replacement = spec.replacement
    let rendered = ''
    if (replacement === undefined) {
      if (spec.discard) {
        return this.trailingWhitespace(node)
      }
      rendered = argTexts.join('')
    }
    else if (typeof replacement === 'string') {
      rendered = this.applyTemplate(replacement, argTexts)
    }
    else {
      rendered = replacement({
        node,
        toText: payload => this.payloadToText(payload, state),
        context: this,
      })
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

  private trailingWhitespace(node: { trailingWhitespace: string }): string {
    return this.strictLatexSpacesConfig.betweenLatexConstructs ? '' : node.trailingWhitespace
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
    const isMathMode = envSpec?.isMathMode ?? state.inMath
    const innerState: ConversionState = {
      ...state,
      inMath: isMathMode,
      whitespaceConfig: isMathMode
        ? getEquationWhitespaceConfig(state.whitespaceConfig)
        : state.whitespaceConfig,
    }
    const body = node.rawContent !== undefined
      ? node.rawContent
      : this.nodesArrayToText(node.children, innerState)

    if (!spec) {
      return body
    }

    const replacement = spec.replacement
    if (replacement === undefined) {
      return spec.discard ? '' : body
    }

    if (typeof replacement === 'string') {
      return this.applyTemplate(replacement, node.arguments.map(arg => this.macroArgumentToText(arg, state)), {
        body,
      })
    }

    return replacement({
      node,
      toText: payload => this.payloadToText(payload, innerState),
      context: this,
    })
  }

  private handleMath(node: LatexNode & { kind: 'math', content: LatexNode[], leftDelimiter: string, rightDelimiter: string }, state: ConversionState): string {
    const innerState: ConversionState = {
      ...state,
      inMath: true,
      whitespaceConfig: getEquationWhitespaceConfig(state.whitespaceConfig),
    }
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

  private handleVerb(node: LatexVerbNode, _state: ConversionState): string {
    const visibleSpace = '␣'
    const verbText = node.starred ? node.content.replace(/ /g, visibleSpace) : node.content
    return verbText + this.trailingWhitespace(node)
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
      let index = 0
      return template.replace(/%s/g, () => {
        const value = argTexts[index]
        index += 1
        return value ?? ''
      })
    }
    return template
  }
}
