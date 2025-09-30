export type MacroArgumentType = 'group' | 'optional' | 'star' | 'token'

export interface MacroArgumentSpec {
  type: MacroArgumentType
  /**
   * When true, a mandatory argument may be provided without braces using a single token.
   * The default parser in this project only supports braced arguments.
   */
  allowBare?: boolean
}

export interface MacroParsingSpec {
  name: string
  arguments: MacroArgumentSpec[]
  swallowWhitespace?: boolean
  optionalArgNoSpace?: boolean
}

export interface EnvironmentParsingSpec {
  name: string
  arguments: MacroArgumentSpec[]
  isMathMode?: boolean
}

export interface SpecialsParsingSpec {
  chars: string
}

export class LatexParsingContext {
  private macroMap: Map<string, MacroParsingSpec>
  private environmentMap: Map<string, EnvironmentParsingSpec>
  private specials: SpecialsParsingSpec[]

  constructor(params?: {
    macros?: MacroParsingSpec[]
    environments?: EnvironmentParsingSpec[]
    specials?: SpecialsParsingSpec[]
  }) {
    this.macroMap = new Map()
    this.environmentMap = new Map()
    this.specials = []

    if (params?.macros) {
      params.macros.forEach(spec => this.addMacro(spec))
    }
    if (params?.environments) {
      params.environments.forEach(spec => this.addEnvironment(spec))
    }
    if (params?.specials) {
      params.specials.forEach(spec => this.addSpecials(spec))
    }
  }

  clone(): LatexParsingContext {
    return new LatexParsingContext({
      macros: Array.from(this.macroMap.values()),
      environments: Array.from(this.environmentMap.values()),
      specials: [...this.specials],
    })
  }

  addMacro(spec: MacroParsingSpec): void {
    this.macroMap.set(spec.name, spec)
  }

  addEnvironment(spec: EnvironmentParsingSpec): void {
    this.environmentMap.set(spec.name, spec)
  }

  addSpecials(spec: SpecialsParsingSpec): void {
    this.specials.push(spec)
  }

  getMacroSpec(name: string): MacroParsingSpec | undefined {
    return this.macroMap.get(name)
  }

  getEnvironmentSpec(name: string): EnvironmentParsingSpec | undefined {
    return this.environmentMap.get(name)
  }

  getSpecials(): SpecialsParsingSpec[] {
    return this.specials
  }
}
