/**
 * Whitespace handling configuration
 *
 * This module provides fine-grained control over how whitespace is handled
 * during LaTeX to text conversion, matching pylatexenc's strict_latex_spaces options.
 */

/**
 * Detailed whitespace handling configuration
 */
export interface StrictLatexSpacesConfig {
  /**
   * Whether to remove whitespace between a macro (with no arguments or delimiters)
   * and following characters.
   *
   * In LaTeX, `\macro text` produces `macrotext` (no space).
   * - true: Follow strict LaTeX behavior (remove space)
   * - false: Keep space for aesthetics
   */
  betweenMacroAndChars: boolean

  /**
   * Whether to remove whitespace between consecutive LaTeX constructs
   * (groups, macros, environments, etc.)
   *
   * - true: Remove inter-construct whitespace strictly
   * - false: Preserve source whitespace for readability
   */
  betweenLatexConstructs: boolean

  /**
   * Whether to strictly handle whitespace after LaTeX comments
   *
   * In LaTeX, `% comment\n` consumes the newline.
   * - true: Remove newline after comment
   * - false: Keep newline and indentation for readability
   */
  afterComment: boolean

  /**
   * How to handle whitespace inside equations
   *
   * - true: Apply strict whitespace rules in equations
   * - false: Use more liberal whitespace (same as non-equations)
   * - StrictLatexSpacesConfig: Use custom rules for equations
   */
  inEquations: boolean | StrictLatexSpacesConfig
}

/**
 * Preset whitespace configurations matching pylatexenc presets
 */
export type StrictLatexSpacesPreset =
  | 'based-on-source' // Keep most source whitespace
  | 'macros' // Default: strict after macros, liberal elsewhere
  | 'except-in-equations' // Strict everywhere except equations
  | boolean // true = all strict, false = 'macros' preset

/**
 * Combined type for whitespace configuration
 */
export type StrictLatexSpacesOption = StrictLatexSpacesPreset | Partial<StrictLatexSpacesConfig>

/**
 * Predefined whitespace configurations
 */
const STRICT_LATEX_SPACES_PRESETS: Record<string, StrictLatexSpacesConfig> = {
  'based-on-source': {
    betweenMacroAndChars: false,
    betweenLatexConstructs: false,
    afterComment: false,
    inEquations: false,
  },
  'macros': {
    betweenMacroAndChars: true,
    betweenLatexConstructs: true,
    afterComment: false,
    inEquations: false, // Use 'based-on-source' in equations
  },
  'except-in-equations': {
    betweenMacroAndChars: true,
    betweenLatexConstructs: true,
    afterComment: true,
    inEquations: false, // Use 'based-on-source' in equations
  },
}

/**
 * Parse and normalize whitespace configuration
 *
 * @param option - User-provided whitespace configuration
 * @returns Normalized StrictLatexSpacesConfig
 */
export function parseStrictLatexSpacesConfig(
  option: StrictLatexSpacesOption | null | undefined,
): StrictLatexSpacesConfig {
  // Default: 'macros' preset
  if (option === null || option === undefined) {
    return STRICT_LATEX_SPACES_PRESETS.macros
  }

  // Boolean shortcuts
  if (option === true) {
    // All strict
    return {
      betweenMacroAndChars: true,
      betweenLatexConstructs: true,
      afterComment: true,
      inEquations: true,
    }
  }

  if (option === false) {
    // Default 'macros' preset
    return STRICT_LATEX_SPACES_PRESETS.macros
  }

  // String preset
  if (typeof option === 'string') {
    const preset = STRICT_LATEX_SPACES_PRESETS[option]
    if (!preset) {
      throw new Error(`Unknown strict_latex_spaces preset: ${option}`)
    }
    return preset
  }

  // Custom object configuration - merge with defaults
  const defaults = STRICT_LATEX_SPACES_PRESETS.macros
  return {
    betweenMacroAndChars: option.betweenMacroAndChars ?? defaults.betweenMacroAndChars,
    betweenLatexConstructs: option.betweenLatexConstructs ?? defaults.betweenLatexConstructs,
    afterComment: option.afterComment ?? defaults.afterComment,
    inEquations: option.inEquations ?? defaults.inEquations,
  }
}

/**
 * Get whitespace configuration for equation context
 *
 * @param config - Parent configuration
 * @returns Configuration to use inside equations
 */
export function getEquationWhitespaceConfig(
  config: StrictLatexSpacesConfig,
): StrictLatexSpacesConfig {
  const inEquations = config.inEquations

  if (typeof inEquations === 'boolean') {
    if (inEquations === false) {
      // Use 'based-on-source' in equations
      return STRICT_LATEX_SPACES_PRESETS['based-on-source']
    }
    // inEquations === true: use same config as parent
    return config
  }

  // Custom equation-specific config
  return inEquations
}
