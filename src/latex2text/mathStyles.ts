/**
 * Unicode Mathematical Alphanumeric Symbols support
 * See: https://unicode.org/charts/PDF/U1D400.pdf
 *
 * This module provides formatting functions to convert regular ASCII letters
 * to their Unicode mathematical styled variants (bold, italic, script, etc.)
 */

export type MathStyle =
  | 'bold'
  | 'italic'
  | 'bold-italic'
  | 'script'
  | 'bold-script'
  | 'fraktur'
  | 'doublestruck'
  | 'bold-fraktur'
  | 'sans'
  | 'sans-bold'
  | 'sans-italic'
  | 'sans-bold-italic'
  | 'monospace'

/**
 * Base offsets for uppercase and lowercase letters in each math style
 * Format: [uppercase_offset, lowercase_offset]
 */
const MATH_STYLE_OFFSETS: Record<MathStyle, [number, number]> = {
  'bold': [0x1D400, 0x1D41A],
  'italic': [0x1D434, 0x1D44E],
  'bold-italic': [0x1D468, 0x1D482],
  'script': [0x1D49C, 0x1D4B6],
  'bold-script': [0x1D4D0, 0x1D4EA],
  'fraktur': [0x1D504, 0x1D51E],
  'doublestruck': [0x1D538, 0x1D552],
  'bold-fraktur': [0x1D56C, 0x1D586],
  'sans': [0x1D5A0, 0x1D5BA],
  'sans-bold': [0x1D5D4, 0x1D5EE],
  'sans-italic': [0x1D608, 0x1D622],
  'sans-bold-italic': [0x1D63C, 0x1D656],
  'monospace': [0x1D670, 0x1D68A],
}

/**
 * Exceptions for certain styles where specific characters have been allocated
 * to earlier code points in the Unicode standard
 */
const MATH_STYLE_EXCEPTIONS: Record<string, Record<number, string>> = {
  italic: {
    0x68: '\u210E', // h -> PLANCK CONSTANT
  },
  script: {
    0x42: '\u212C', // B
    0x45: '\u2130', // E
    0x46: '\u2131', // F
    0x48: '\u210B', // H
    0x49: '\u2110', // I
    0x4C: '\u2112', // L
    0x4D: '\u2133', // M
    0x52: '\u211B', // R
    0x65: '\u212F', // e
    0x67: '\u210A', // g
    0x6F: '\u2134', // o
  },
  fraktur: {
    0x43: '\u212D', // C
    0x48: '\u210C', // H
    0x49: '\u2111', // I
    0x52: '\u211C', // R
    0x5A: '\u2128', // Z
  },
  doublestruck: {
    0x43: '\u2102', // C
    0x48: '\u210D', // H
    0x4E: '\u2115', // N
    0x50: '\u2119', // P
    0x51: '\u211A', // Q
    0x52: '\u211D', // R
    0x5A: '\u2124', // Z
  },
}

const CHAR_CODE_A = 'A'.charCodeAt(0) // 0x41
const CHAR_CODE_Z = 'Z'.charCodeAt(0) // 0x5A
const CHAR_CODE_a = 'a'.charCodeAt(0) // 0x61
const CHAR_CODE_z = 'z'.charCodeAt(0) // 0x7A

/**
 * Convert a single character to its mathematical styled variant
 * @param char - The character to convert (should be an ASCII letter)
 * @param style - The mathematical style to apply
 * @returns The styled character, or the original if it cannot be styled
 */
function formatMathStyleChar(char: string, style: MathStyle): string {
  const charCode = char.charCodeAt(0)

  // Check for exceptions first
  const exceptions = MATH_STYLE_EXCEPTIONS[style]
  if (exceptions?.[charCode]) {
    return exceptions[charCode]
  }

  const [uppercaseOffset, lowercaseOffset] = MATH_STYLE_OFFSETS[style]

  // Convert uppercase letters
  if (charCode >= CHAR_CODE_A && charCode <= CHAR_CODE_Z) {
    return String.fromCodePoint(uppercaseOffset + charCode - CHAR_CODE_A)
  }

  // Convert lowercase letters
  if (charCode >= CHAR_CODE_a && charCode <= CHAR_CODE_z) {
    return String.fromCodePoint(lowercaseOffset + charCode - CHAR_CODE_a)
  }

  // Return original character if not a letter
  return char
}

/**
 * Apply mathematical styling to a text string
 * @param text - The text to style (only ASCII letters will be converted)
 * @param style - The mathematical style to apply
 * @returns The styled text with Unicode mathematical characters
 *
 * @example
 * formatMathTextStyle('Hello', 'bold') // Returns: '𝐇𝐞𝐥𝐥𝐨'
 * formatMathTextStyle('x', 'italic') // Returns: '𝑥'
 * formatMathTextStyle('R', 'doublestruck') // Returns: 'ℝ'
 */
export function formatMathTextStyle(text: string, style: MathStyle): string {
  return text
    .split('')
    .map(char => formatMathStyleChar(char, style))
    .join('')
}

/**
 * Check if a style is supported
 */
export function isSupportedMathStyle(style: string): style is MathStyle {
  return style in MATH_STYLE_OFFSETS
}
