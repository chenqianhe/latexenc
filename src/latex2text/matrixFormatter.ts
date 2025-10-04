/**
 * Matrix environment formatting utility
 *
 * Formats LaTeX matrix environments (array, pmatrix, bmatrix, etc.)
 * into a text representation with aligned columns
 */

import type { LatexEnvironmentNode, LatexNode } from '../core/nodes'

/**
 * Format a matrix environment node into aligned text representation
 *
 * @param node - The environment node (array, pmatrix, bmatrix, etc.)
 * @param nodeToText - Function to convert nodes to text
 * @returns Formatted matrix text like "[ a11  a12 ; a21  a22 ]"
 *
 * @example
 * // For \begin{pmatrix}1 & 2 \\ 3 & 4\end{pmatrix}
 * // Returns: "[ 1  2 ; 3  4 ]"
 */
export function formatMatrixEnvironment(
  node: LatexEnvironmentNode,
  nodeToText: (nodes: LatexNode[]) => string,
): string {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell: LatexNode[] = []

  /**
   * Finish current cell and add to current row
   */
  const finishCell = () => {
    if (currentCell.length > 0 || currentRow.length > 0) {
      const cellText = nodeToText(currentCell).trim()
      currentRow.push(cellText)
      currentCell = []
    }
  }

  /**
   * Finish current row and start a new one
   */
  const finishRow = () => {
    finishCell()
    if (currentRow.length > 0) {
      rows.push(currentRow)
      currentRow = []
    }
  }

  // Parse the matrix body, splitting by & (columns) and \\ (rows)
  for (const child of node.children) {
    // Column separator
    if (child.kind === 'specials' && child.chars === '&') {
      finishCell()
      continue
    }

    // Row separator
    if (child.kind === 'macro' && child.name === '\\') {
      finishRow()
      continue
    }

    // Regular content - add to current cell
    currentCell.push(child)
  }

  // Finish the last row
  finishRow()

  // If no rows were created, return empty brackets
  if (rows.length === 0) {
    return '[ ]'
  }

  // Calculate maximum width for each column
  const numCols = Math.max(...rows.map(row => row.length))
  const colWidths: number[] = []
  for (let col = 0; col < numCols; col++) {
    let maxWidth = 0
    for (const row of rows) {
      if (col < row.length) {
        maxWidth = Math.max(maxWidth, row[col].length)
      }
    }
    colWidths.push(maxWidth)
  }

  // Format each row with aligned columns
  const formattedRows = rows.map((row) => {
    return row
      .map((cell, colIdx) => {
        const width = colWidths[colIdx] ?? 0
        return cell.padStart(width, ' ')
      })
      .join('  ') // Two spaces between columns
  })

  // Join rows with semicolon separator
  const matrixContent = formattedRows.join(' ; ')

  return `[ ${matrixContent} ]`
}

/**
 * Check if an environment name is a matrix-like environment
 */
export function isMatrixEnvironment(envName: string): boolean {
  const matrixEnvs = new Set([
    'array',
    'pmatrix',
    'bmatrix',
    'Bmatrix',
    'vmatrix',
    'Vmatrix',
    'smallmatrix',
    'psmallmatrix',
    'bsmallmatrix',
    'Bsmallmatrix',
    'vsmallmatrix',
    'Vsmallmatrix',
  ])
  return matrixEnvs.has(envName)
}
