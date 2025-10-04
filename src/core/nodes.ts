export type LatexNode =
  | LatexCharsNode
  | LatexGroupNode
  | LatexMacroNode
  | LatexEnvironmentNode
  | LatexMathNode
  | LatexCommentNode
  | LatexSpecialsNode
  | LatexVerbNode

export type LatexNodeKind =
  | 'chars'
  | 'group'
  | 'macro'
  | 'environment'
  | 'math'
  | 'comment'
  | 'specials'
  | 'verb'

export interface LatexAstNode {
  kind: LatexNodeKind
  start: number
  end: number
}

export interface LatexCharsNode extends LatexAstNode {
  kind: 'chars'
  content: string
}

export interface LatexGroupNode extends LatexAstNode {
  kind: 'group'
  delimiters: { open: string, close: string }
  children: LatexNode[]
}

export interface LatexMacroNode extends LatexAstNode {
  kind: 'macro'
  name: string
  arguments: LatexMacroArgument[]
  trailingWhitespace: string
}

export type LatexMacroArgument =
  | LatexMacroArgumentGroup
  | LatexMacroArgumentOptional
  | LatexMacroArgumentToken
  | LatexMacroArgumentStar

export interface LatexMacroArgumentBase {
  type: 'group' | 'optional' | 'token' | 'star'
}

export interface LatexMacroArgumentGroup extends LatexMacroArgumentBase {
  type: 'group'
  nodes: LatexNode[]
  delimiters: { open: string, close: string }
}

export interface LatexMacroArgumentOptional extends LatexMacroArgumentBase {
  type: 'optional'
  nodes: LatexNode[]
  delimiters: { open: string, close: string }
}

export interface LatexMacroArgumentToken extends LatexMacroArgumentBase {
  type: 'token'
  content: string
}

export interface LatexMacroArgumentStar extends LatexMacroArgumentBase {
  type: 'star'
  content: string // usually '*'
}

export interface LatexEnvironmentNode extends LatexAstNode {
  kind: 'environment'
  name: string
  arguments: LatexMacroArgument[]
  children: LatexNode[]
  rawContent?: string
}

export interface LatexMathNode extends LatexAstNode {
  kind: 'math'
  delimiter: 'inline' | 'display' | 'environment'
  leftDelimiter: string
  rightDelimiter: string
  content: LatexNode[]
}

export interface LatexCommentNode extends LatexAstNode {
  kind: 'comment'
  content: string
  startOfLine: boolean
}

export interface LatexSpecialsNode extends LatexAstNode {
  kind: 'specials'
  chars: string
}

export interface LatexVerbNode extends LatexAstNode {
  kind: 'verb'
  content: string
  delimiter: string
  starred: boolean
  trailingWhitespace: string
}
