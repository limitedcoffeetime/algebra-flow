/**
 * Shared syntax validation utilities
 */

/**
 * Check if a mathematical expression has obvious syntax errors
 */
export function hasObviousSyntaxErrors(input: string): boolean {
  // Check for obvious issues
  if (input.includes('//') || input.includes('**') || input.includes('++') || input.includes('--')) {
    return true;
  }

  // Check for unmatched parentheses and brackets
  let openParens = 0;
  let openBrackets = 0;
  for (const char of input) {
    if (char === '(') openParens++;
    if (char === ')') openParens--;
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;
    if (openParens < 0 || openBrackets < 0) return true; // More closing than opening
  }

  // Check for unmatched opening parentheses or brackets
  if (openParens > 0 || openBrackets > 0) return true; // Unmatched opening parentheses/brackets

  // Check for empty parentheses or brackets (often invalid in algebra)
  if (input.includes('()') || input.includes('[]')) {
    return true;
  }

  // Check for invalid starting/ending characters
  if (/^[+*/^]/.test(input) || /[+\-*/^]$/.test(input)) {
    return true; // Cannot start with +*/^ or end with any operator (- allowed at start for negative numbers)
  }

  // Check for basic invalid patterns
  if (/[^0-9a-zA-Z+\-*/()^.\s=\[\]]/.test(input)) {
    return true; // Invalid characters
  }

  // Check for consecutive numbers without operators (like "5 5")
  if (/\d\s+\d/.test(input)) {
    return true;
  }

  return false;
}
