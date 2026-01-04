/**
 * Prompt Combination Utility
 *
 * Parses {option1|option2|...} syntax and generates all combinations (Cartesian product)
 */

/**
 * Cartesian product of arrays
 * @param {Array<Array<string>>} arrays - Array of option arrays
 * @returns {Array<Array<string>>} All combinations
 */
function cartesianProduct(arrays) {
  if (arrays.length === 0) return [[]]
  return arrays.reduce((acc, curr) =>
    acc.flatMap(a => curr.map(c => [...a, c])), [[]])
}

/**
 * Parse prompt for combination blocks
 * @param {string} prompt - The prompt to parse
 * @returns {Array<{fullMatch: string, options: string[], index: number}>} Parsed blocks
 */
export function parseCombinations(prompt) {
  if (!prompt) return []

  const regex = /\{([^}]+)\}/g
  const blocks = []
  let match

  while ((match = regex.exec(prompt)) !== null) {
    const options = match[1].split('|').map(opt => opt.trim())
    blocks.push({
      fullMatch: match[0],
      options,
      index: match.index
    })
  }

  return blocks
}

/**
 * Generate all combinations from prompt
 * @param {string} prompt - Original prompt with {...} patterns
 * @returns {Array<string>} Array of all possible prompts
 */
export function generateAllCombinations(prompt) {
  if (!prompt) return [prompt]

  const blocks = parseCombinations(prompt)
  if (blocks.length === 0) return [prompt]

  const optionArrays = blocks.map(b => b.options)
  const combinations = cartesianProduct(optionArrays)

  return combinations.map(combo => {
    let result = prompt
    // Replace in reverse order to maintain correct indices
    for (let i = blocks.length - 1; i >= 0; i--) {
      result = result.replace(blocks[i].fullMatch, combo[i])
    }
    return result
  })
}

/**
 * Get the count of combinations without generating them
 * @param {string} prompt - The prompt to analyze
 * @returns {number} Number of combinations
 */
export function getCombinationCount(prompt) {
  if (!prompt) return 1

  const blocks = parseCombinations(prompt)
  if (blocks.length === 0) return 1

  return blocks.reduce((count, block) => count * block.options.length, 1)
}

/**
 * Check if prompt has combination syntax
 * @param {string} prompt - The prompt to check
 * @returns {boolean} True if prompt contains {...} patterns
 */
export function hasCombinations(prompt) {
  if (!prompt) return false
  return /\{[^}]+\}/.test(prompt)
}

/**
 * Expand prompt by randomly selecting one option from each combination block
 * @param {string} prompt - Original prompt with {...} patterns
 * @returns {string} Prompt with random selections applied
 *
 * Example:
 *   prompt: "a {red|blue} {cat|dog} on grass"
 *   returns: "a red dog on grass" (random selection)
 */
export function expandRandomCombination(prompt) {
  if (!prompt) return prompt
  if (!hasCombinations(prompt)) return prompt

  const blocks = parseCombinations(prompt)
  let result = prompt

  // Replace in reverse order to maintain correct indices
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i]
    const randomIndex = Math.floor(Math.random() * block.options.length)
    const selected = block.options[randomIndex]
    result = result.replace(block.fullMatch, selected)
  }

  return result
}

/**
 * Extract the substituted combination values by comparing original and used prompts
 * @param {string} originalPrompt - Original prompt with {...} patterns
 * @param {string} usedPrompt - The actual prompt used (with substitutions applied)
 * @returns {string} Comma-separated list of substituted values, or empty string
 *
 * Example:
 *   originalPrompt: "a {red|blue} {cat|dog} on grass"
 *   usedPrompt: "a red cat on grass"
 *   returns: "red, cat"
 */
export function extractUsedCombinations(originalPrompt, usedPrompt) {
  if (!originalPrompt || !usedPrompt) return ''

  // Check if original has combination syntax
  if (!hasCombinations(originalPrompt)) return ''

  // If usedPrompt still has combination syntax, it wasn't expanded (single image generation)
  // In this case, we can't show the combination result
  if (hasCombinations(usedPrompt)) return ''

  // Split original by combination blocks, keeping the delimiters
  // e.g., "a {red|blue} {cat|dog} on grass" → ["a ", "{red|blue}", " ", "{cat|dog}", " on grass"]
  const parts = originalPrompt.split(/(\{[^}]+\})/)

  // Get just the fixed (non-combination) parts
  const fixedParts = parts.filter(p => !p.startsWith('{'))

  // Use fixed parts to extract substituted values from usedPrompt
  let remaining = usedPrompt
  const values = []

  for (const fixed of fixedParts) {
    if (fixed === '') continue

    const idx = remaining.indexOf(fixed)
    if (idx > 0) {
      // There's content before this fixed part - that's a substituted value
      values.push(remaining.slice(0, idx))
    }
    remaining = remaining.slice(idx + fixed.length)
  }

  // Check if there's remaining content (substituted value at the end)
  if (remaining) {
    values.push(remaining)
  }

  return values.join(', ')
}
