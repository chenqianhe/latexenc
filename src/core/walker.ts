import type {
  LatexCharsNode,
  LatexCommentNode,
  LatexEnvironmentNode,
  LatexGroupNode,
  LatexMacroArgument,
  LatexMacroArgumentGroup,
  LatexMacroArgumentOptional,
  LatexMacroArgumentStar,
  LatexMacroArgumentToken,
  LatexMacroNode,
  LatexMathNode,
  LatexNode,
  LatexSpecialsNode,
} from './nodes'
import type {
  EnvironmentParsingSpec,
  LatexParsingContext,
  MacroArgumentSpec,
} from './context'

import { createDefaultParsingContext } from './defaultParsingContext'

interface ParseStopSpec {
  chars?: string[]
  environmentName?: string
  mathDelimiter?: string
}

const LETTER_REGEX = /[A-Z@]/i

export interface LatexWalkerOptions {
  context?: LatexParsingContext
}

export class LatexWalker {
  private readonly input: string
  private readonly length: number
  private pos = 0
  private readonly context: LatexParsingContext
  private readonly specialsSorted: { chars: string, length: number }[]

  constructor(input: string, options: LatexWalkerOptions = {}) {
    this.input = input
    this.length = input.length
    this.context = options.context ?? createDefaultParsingContext()
    this.specialsSorted = this.context
      .getSpecials()
      .map(s => ({ chars: s.chars, length: s.chars.length }))
      .sort((a, b) => b.length - a.length)
  }

  getNodes(): LatexNode[] {
    this.pos = 0
    return this.parseNodes()
  }

  private parseNodes(stop?: ParseStopSpec): LatexNode[] {
    const nodes: LatexNode[] = []
    let textBuffer = ''

    const flushText = () => {
      if (!textBuffer) {
        return
      }
      const node: LatexCharsNode = {
        kind: 'chars',
        start: this.pos - textBuffer.length,
        end: this.pos,
        content: textBuffer,
      }
      nodes.push(node)
      textBuffer = ''
    }

    while (this.pos < this.length) {
      if (stop?.chars && stop.chars.includes(this.peek())) {
        break
      }
      if (stop?.mathDelimiter && this.matchString(stop.mathDelimiter)) {
        break
      }
      if (stop?.environmentName && this.looksLikeEndEnvironment(stop.environmentName)) {
        break
      }

      const ch = this.peek()

      // Comments
      if (ch === '%') {
        flushText()
        nodes.push(this.parseComment())
        continue
      }

      // Group delimiters
      if (ch === '{') {
        flushText()
        nodes.push(this.parseGroup('{', '}', 'group'))
        continue
      }
      if (ch === '}') {
        break
      }
      // Math delimiters with single characters
      if (ch === '$') {
        flushText()
        nodes.push(this.parseMathDollar())
        continue
      }

      if (ch === '\\') {
        // Control sequence
        flushText()
        const macro = this.parseControlSequence(stop)
        if (macro) {
          nodes.push(macro)
        }
        continue
      }

      // Specials
      const specials = this.matchSpecials()
      if (specials) {
        flushText()
        nodes.push(this.createSpecialsNode(specials))
        continue
      }

      // Regular char
      textBuffer += ch
      this.pos += 1
    }

    if (textBuffer) {
      flushText()
    }

    return nodes
  }

  private parseGroup(open: string, close: string, _kind: 'group' | 'optional'): LatexGroupNode {
    const start = this.pos
    this.expectChar(open)
    this.pos += 1

    const children = this.parseNodes({ chars: [close] })
    if (this.peek() !== close) {
      throw new Error(`Unclosed group starting at position ${start}`)
    }
    this.pos += 1 // consume closing delimiter

    return {
      kind: 'group',
      start,
      end: this.pos,
      delimiters: { open, close },
      children,
    }
  }

  private parseComment(): LatexCommentNode {
    const start = this.pos
    let content = ''
    const startOfLine = start === 0 || this.input[start - 1] === '\n'

    while (this.pos < this.length) {
      const ch = this.input[this.pos]
      if (ch === '\n') {
        break
      }
      content += ch
      this.pos += 1
    }

    // Do not consume the newline, leave it to main loop
    return {
      kind: 'comment',
      start,
      end: this.pos,
      content,
      startOfLine,
    }
  }

  private parseMathDollar(): LatexMathNode {
    const start = this.pos
    const leftDelimiter = this.matchString('$$') ? '$$' : '$'
    const rightDelimiter = leftDelimiter
    const delimiterType = leftDelimiter === '$$' ? 'display' : 'inline'
    this.pos += leftDelimiter.length

    const content = this.parseNodes({ mathDelimiter: rightDelimiter })

    if (!this.matchString(rightDelimiter)) {
      throw new Error(`Unclosed math delimiter starting at ${start}`)
    }
    this.pos += rightDelimiter.length

    return {
      kind: 'math',
      start,
      end: this.pos,
      delimiter: delimiterType,
      leftDelimiter,
      rightDelimiter,
      content,
    }
  }

  private parseMathCommand(command: string, rightDelimiter: string, delimiterType: 'inline' | 'display'): LatexMathNode {
    const start = this.pos
    this.pos += command.length
    const content = this.parseNodes({ mathDelimiter: rightDelimiter })
    if (!this.matchString(rightDelimiter)) {
      throw new Error(`Expected math delimiter ${rightDelimiter} to close sequence starting at ${start}`)
    }
    this.pos += rightDelimiter.length
    return {
      kind: 'math',
      start,
      end: this.pos,
      delimiter: delimiterType,
      leftDelimiter: command,
      rightDelimiter,
      content,
    }
  }

  private parseControlSequence(stop?: ParseStopSpec): LatexNode | null {
    const start = this.pos
    this.pos += 1 // consume backslash

    const read = this.readControlSequenceName()
    if (read.kind === 'char') {
      return {
        kind: 'chars',
        start,
        end: this.pos,
        content: read.char,
      } as LatexCharsNode
    }

    const name = read.name

    // Math delimiters via \( ... \) or \[ ... \]
    if (name === '(') {
      return this.parseMathCommand('\\(', '\\)', 'inline')
    }
    if (name === ')') {
      // closing delimiter handled by caller via stop condition
      this.pos -= name.length + 1 // step back to before backslash for caller
      return null
    }
    if (name === '[') {
      return this.parseMathCommand('\\[', '\\]', 'display')
    }
    if (name === ']') {
      this.pos -= name.length + 1
      return null
    }

    // Environment closing detection
    if (stop?.environmentName && name === 'end') {
      this.pos = start // revert to allow caller to handle \end detection
      return null
    }

    if (name === 'begin') {
      return this.parseEnvironment(start)
    }

    const macroNode = this.finishMacro(start, name)

    return macroNode
  }

  private finishMacro(start: number, name: string): LatexMacroNode {
    const spec = this.context.getMacroSpec(name)
    const argumentsList: LatexMacroArgument[] = []

    if (spec) {
      for (const argSpec of spec.arguments) {
        const parsedArg = this.parseMacroArgument(argSpec)
        if (parsedArg) {
          argumentsList.push(parsedArg)
        }
      }
    }

    const trailingWhitespace = this.consumeWhitespace()

    return {
      kind: 'macro',
      start,
      end: this.pos,
      name,
      arguments: argumentsList,
      trailingWhitespace,
    }
  }

  private parseMacroArgument(argSpec: MacroArgumentSpec): LatexMacroArgument | null {
    switch (argSpec.type) {
      case 'group': {
        this.consumeWhitespace()
        if (this.peek() !== '{') {
          return null
        }
        const groupNode = this.parseGroup('{', '}', 'group')
        const arg: LatexMacroArgumentGroup = {
          type: 'group',
          nodes: groupNode.children,
          delimiters: groupNode.delimiters,
        }
        return arg
      }
      case 'optional': {
        const snapshot = this.pos
        this.consumeWhitespace()
        if (this.peek() !== '[') {
          this.pos = snapshot
          return null
        }
        const groupNode = this.parseGroup('[', ']', 'optional')
        const arg: LatexMacroArgumentOptional = {
          type: 'optional',
          nodes: groupNode.children,
          delimiters: groupNode.delimiters,
        }
        return arg
      }
      case 'star': {
        const snapshot = this.pos
        this.consumeWhitespace()
        if (this.peek() !== '*') {
          this.pos = snapshot
          return null
        }
        this.pos += 1
        const arg: LatexMacroArgumentStar = { type: 'star', content: '*' }
        return arg
      }
      case 'token': {
        this.consumeWhitespace()
        const token = this.consumeToken()
        if (!token) {
          return null
        }
        const arg: LatexMacroArgumentToken = { type: 'token', content: token }
        return arg
      }
      default:
        return null
    }
  }

  private parseEnvironment(start: number): LatexEnvironmentNode {
    const beginMacro = this.finishMacro(start, 'begin')
    if (beginMacro.arguments.length === 0 || beginMacro.arguments[0].type !== 'group') {
      throw new Error('Expected environment name for \\begin')
    }
    const envNameArg = beginMacro.arguments[0] as LatexMacroArgumentGroup
    const envName = this.nodesToText(envNameArg.nodes).trim()

    const envSpec: EnvironmentParsingSpec | undefined = this.context.getEnvironmentSpec(envName)

    const envArgs: LatexMacroArgument[] = []
    if (beginMacro.arguments.length > 1) {
      envArgs.push(...beginMacro.arguments.slice(1))
    }

    if (envSpec) {
      // Parse additional expected arguments according to spec beyond the environment name
      const expectedArgs = envSpec.arguments
      for (const argSpec of expectedArgs) {
        const parsed = this.parseMacroArgument(argSpec)
        if (parsed) {
          envArgs.push(parsed)
        }
      }
    }

    const content = this.parseNodes({ environmentName: envName })

    // consume the \end{envName}
    if (!this.matchString('\\end')) {
      throw new Error(`Expected \\end{${envName}} for environment starting at ${start}`)
    }
    const endStart = this.pos
    this.consumeString('\\end')
    const endMacro = this.finishMacro(endStart, 'end')
    if (endMacro.arguments.length === 0 || endMacro.arguments[0].type !== 'group') {
      throw new Error(`Expected environment name in \\end near position ${endStart}`)
    }
    const endName = this.nodesToText((endMacro.arguments[0] as LatexMacroArgumentGroup).nodes).trim()
    if (endName !== envName) {
      throw new Error(`Mismatched environment name: expected ${envName}, got ${endName}`)
    }

    return {
      kind: 'environment',
      start,
      end: this.pos,
      name: envName,
      arguments: envArgs,
      children: content,
    }
  }

  private nodesToText(nodes: LatexNode[]): string {
    return nodes
      .map((node) => {
        if (node.kind === 'chars') {
          return node.content
        }
        if (node.kind === 'group') {
          return this.nodesToText(node.children)
        }
        if (node.kind === 'macro') {
          return `\\${node.name}`
        }
        if (node.kind === 'environment') {
          return node.name
        }
        if (node.kind === 'math') {
          return node.leftDelimiter + this.nodesToText(node.content) + node.rightDelimiter
        }
        if (node.kind === 'comment') {
          return node.content
        }
        if (node.kind === 'specials') {
          return node.chars
        }
        return ''
      })
      .join('')
  }

  private consumeWhitespace(): string {
    let result = ''
    while (this.pos < this.length) {
      const ch = this.peek()
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        result += ch
        this.pos += 1
      }
      else {
        break
      }
    }
    return result
  }

  private consumeToken(): string | null {
    if (this.pos >= this.length) {
      return null
    }
    const ch = this.peek()
    if (ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === ' ' || ch === '\n') {
      return null
    }
    this.pos += 1
    return ch
  }

  private createSpecialsNode(chars: string): LatexSpecialsNode {
    const node: LatexSpecialsNode = {
      kind: 'specials',
      start: this.pos,
      end: this.pos + chars.length,
      chars,
    }
    this.pos += chars.length
    return node
  }

  private matchSpecials(): string | null {
    for (const spec of this.specialsSorted) {
      if (this.matchString(spec.chars)) {
        return spec.chars
      }
    }
    return null
  }

  private looksLikeEndEnvironment(name: string): boolean {
    if (!this.matchString('\\end')) {
      return false
    }
    let idx = this.pos + 4 // after "\\end"
    while (idx < this.length && /\s/.test(this.input[idx])) {
      idx += 1
    }
    if (idx >= this.length || this.input[idx] !== '{') {
      return false
    }
    idx += 1 // skip opening brace
    let depth = 1
    let content = ''
    while (idx < this.length && depth > 0) {
      const ch = this.input[idx]
      if (ch === '{') {
        depth += 1
        content += ch
      }
      else if (ch === '}') {
        depth -= 1
        if (depth > 0) {
          content += ch
        }
      }
      else {
        content += ch
      }
      idx += 1
    }
    if (depth !== 0) {
      return false
    }
    return content.trim() === name
  }

  private readControlSequenceName(): { kind: 'macro', name: string } | { kind: 'char', char: string } {
    if (this.pos >= this.length) {
      return { kind: 'char', char: '\\' }
    }
    const next = this.peek()
    if (LETTER_REGEX.test(next)) {
      let name = next
      this.pos += 1
      while (this.pos < this.length && LETTER_REGEX.test(this.peek())) {
        name += this.peek()
        this.pos += 1
      }
      return { kind: 'macro', name }
    }
    if (next === '\n' || next === ' ' || next === '\t') {
      this.pos += 1
      return { kind: 'char', char: next === '\n' ? '\n' : ' ' }
    }
    // single-character control sequence -> treat as macro name consisting of that char
    this.pos += 1
    return { kind: 'macro', name: next }
  }

  private consumeString(expected: string): void {
    if (!this.matchString(expected)) {
      throw new Error(`Expected "${expected}" at position ${this.pos}`)
    }
    this.pos += expected.length
  }

  private consumeChar(): string {
    if (this.pos >= this.length) {
      return ''
    }
    const ch = this.peek()
    this.pos += 1
    return ch
  }

  private expectChar(ch: string): void {
    if (this.peek() !== ch) {
      throw new Error(`Expected '${ch}' at position ${this.pos}`)
    }
  }

  private peek(): string {
    return this.input[this.pos]
  }

  private matchString(s: string): boolean {
    if (this.input.substr(this.pos, s.length) === s) {
      return true
    }
    return false
  }
}
