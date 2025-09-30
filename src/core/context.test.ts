import { describe, expect, it } from 'vitest'
import { LatexParsingContext } from './context'
import { createDefaultParsingContext } from './defaultParsingContext'

describe('latexParsingContext', () => {
  it('clones into an independent instance', () => {
    const base = new LatexParsingContext()
    base.addMacro({ name: 'foo', arguments: [] })
    base.addEnvironment({ name: 'env', arguments: [] })
    base.addSpecials({ chars: '%%' })

    const clone = base.clone()
    clone.addMacro({ name: 'bar', arguments: [] })
    clone.addEnvironment({ name: 'env2', arguments: [] })
    clone.addSpecials({ chars: '##' })

    expect(base.getMacroSpec('foo')).toBeDefined()
    expect(base.getMacroSpec('bar')).toBeUndefined()
    expect(base.getEnvironmentSpec('env')).toBeDefined()
    expect(base.getEnvironmentSpec('env2')).toBeUndefined()
    expect(base.getSpecials()).toEqual([{ chars: '%%' }])
  })
})

describe('createDefaultParsingContext', () => {
  const context = createDefaultParsingContext()

  it('includes begin/end macros with manual overrides', () => {
    const begin = context.getMacroSpec('begin')
    const end = context.getMacroSpec('end')

    expect(begin?.swallowWhitespace).toBe(true)
    expect(end?.swallowWhitespace).toBe(true)
    expect(begin?.arguments.map(arg => arg.type)).toEqual(['group'])
    expect(end?.arguments.map(arg => arg.type)).toEqual(['group'])
  })

  it('marks the \\ macro as requiring tightly coupled optional args', () => {
    const lineBreak = context.getMacroSpec('\\')
    expect(lineBreak?.optionalArgNoSpace).toBe(true)
    expect(lineBreak?.arguments.map(arg => arg.type)).toEqual(['star', 'optional'])
  })

  it('parses environment argspec strings into concrete argument descriptors', () => {
    const tabularx = context.getEnvironmentSpec('tabularx')
    expect(tabularx).toBeDefined()
    expect(tabularx?.arguments.map(arg => arg.type)).toEqual(['group', 'optional', 'group'])

    const align = context.getEnvironmentSpec('align')
    expect(align?.isMathMode).toBe(true)
    expect(align?.arguments).toHaveLength(0)
  })
})
