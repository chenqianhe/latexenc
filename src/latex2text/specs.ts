import type { LatexEnvironmentNode, LatexMacroNode, LatexNode, LatexSpecialsNode } from '../core/nodes'

export type MacroTextReplacement = string | MacroTextReplacementFn
export type MacroTextReplacementFn = (info: MacroTextReplacementInfo) => string

export interface MacroTextReplacementInfo {
  node: LatexMacroNode
  argumentIndex?: number
  toText: (nodes: LatexNode | LatexNode[]) => string
}

export interface MacroTextSpec {
  name: string
  replacement?: MacroTextReplacement
  discard?: boolean
}

export type EnvironmentTextReplacement = string | EnvironmentTextReplacementFn
export type EnvironmentTextReplacementFn = (info: EnvironmentTextReplacementInfo) => string

export interface EnvironmentTextReplacementInfo {
  node: LatexEnvironmentNode
  toText: (nodes: LatexNode | LatexNode[]) => string
}

export interface EnvironmentTextSpec {
  name: string
  replacement?: EnvironmentTextReplacement
  discard?: boolean
}

export interface SpecialsTextSpec {
  chars: string
  replacement?: string | ((node: LatexSpecialsNode) => string)
}

export class LatexTextContext {
  private macroMap = new Map<string, MacroTextSpec>()
  private environmentMap = new Map<string, EnvironmentTextSpec>()
  private specialsMap = new Map<string, SpecialsTextSpec>()

  constructor(params?: {
    macros?: MacroTextSpec[]
    environments?: EnvironmentTextSpec[]
    specials?: SpecialsTextSpec[]
  }) {
    params?.macros?.forEach(spec => this.addMacro(spec))
    params?.environments?.forEach(spec => this.addEnvironment(spec))
    params?.specials?.forEach(spec => this.addSpecials(spec))
  }

  addMacro(spec: MacroTextSpec): void {
    this.macroMap.set(spec.name, spec)
  }

  addEnvironment(spec: EnvironmentTextSpec): void {
    this.environmentMap.set(spec.name, spec)
  }

  addSpecials(spec: SpecialsTextSpec): void {
    this.specialsMap.set(spec.chars, spec)
  }

  clone(): LatexTextContext {
    return new LatexTextContext({
      macros: Array.from(this.macroMap.values()),
      environments: Array.from(this.environmentMap.values()),
      specials: Array.from(this.specialsMap.values()),
    })
  }

  getMacro(name: string): MacroTextSpec | undefined {
    return this.macroMap.get(name)
  }

  getEnvironment(name: string): EnvironmentTextSpec | undefined {
    return this.environmentMap.get(name)
  }

  getSpecials(chars: string): SpecialsTextSpec | undefined {
    return this.specialsMap.get(chars)
  }
}
