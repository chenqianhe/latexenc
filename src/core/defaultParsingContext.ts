import {
  generatedEnvironmentParsingSpecs,
  generatedMacroParsingSpecs,
  generatedSpecialParsingSpecs,
} from '../data/generatedParsingSpec'
import type { EnvironmentParsingSpec, MacroArgumentSpec, MacroParsingSpec, SpecialsParsingSpec } from './context'
import { LatexParsingContext } from './context'

function parseArgSpecString(spec: string): MacroArgumentSpec[] {
  const args: MacroArgumentSpec[] = []
  for (const ch of spec.split('')) {
    if (ch === '{') {
      args.push({ type: 'group' })
    }
    else if (ch === '[') {
      args.push({ type: 'optional' })
    }
    else if (ch === '*') {
      args.push({ type: 'star' })
    }
  }
  return args
}

function buildMacroSpecs(): MacroParsingSpec[] {
  const manualOverrides: Record<string, Partial<MacroParsingSpec>> = {
    begin: { swallowWhitespace: true },
    end: { swallowWhitespace: true },
  }

  const specs: MacroParsingSpec[] = generatedMacroParsingSpecs.map((entry) => {
    const base: MacroParsingSpec = {
      name: entry.name,
      arguments: parseArgSpecString(entry.argspec),
      optionalArgNoSpace: entry.optionalArgNoSpace,
    }
    const override = manualOverrides[entry.name]
    if (override) {
      return { ...base, ...override }
    }
    return base
  })

  // The \ macro uses a special parser in pylatexenc that forbids spaces before the optional argument.
  const backslashSpec = specs.find(spec => spec.name === '\\')
  if (backslashSpec) {
    backslashSpec.optionalArgNoSpace = true
  }

  if (!specs.some(spec => spec.name === 'begin')) {
    specs.push({
      name: 'begin',
      arguments: parseArgSpecString('{'),
      swallowWhitespace: true,
    })
  }

  if (!specs.some(spec => spec.name === 'end')) {
    specs.push({
      name: 'end',
      arguments: parseArgSpecString('{'),
      swallowWhitespace: true,
    })
  }

  return specs
}

function buildEnvironmentSpecs(): EnvironmentParsingSpec[] {
  return generatedEnvironmentParsingSpecs.map(entry => ({
    name: entry.name,
    arguments: parseArgSpecString(entry.argspec),
    isMathMode: entry.isMathMode,
  }))
}

function buildSpecialSpecs(): SpecialsParsingSpec[] {
  return generatedSpecialParsingSpecs.map(spec => ({ chars: spec.chars }))
}

export function createDefaultParsingContext(): LatexParsingContext {
  return new LatexParsingContext({
    macros: buildMacroSpecs(),
    environments: buildEnvironmentSpecs(),
    specials: buildSpecialSpecs(),
  })
}
