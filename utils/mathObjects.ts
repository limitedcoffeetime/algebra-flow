// Simplified math utilities - no complex rendering, just basic string operations

/**
 * Simple math utility functions for plaintext math
 */

/**
 * Clean up a math expression string
 */
export function cleanMathExpression(expression: string): string {
  return expression
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\*\*/g, '^') // Convert ** to ^
    .replace(/×/g, '*') // Convert × to *
    .replace(/÷/g, '/'); // Convert ÷ to /
}

/**
 * Check if a string contains basic math operators
 */
export function hasMathOperators(expression: string): boolean {
  return /[+\-*/^=]/.test(expression);
}

/**
 * Format a simple fraction string (like "1/2")
 */
export function formatFraction(numerator: string, denominator: string): string {
  if (!numerator || !denominator) return '';
  return `${numerator}/${denominator}`;
}

/**
 * Parse a simple fraction string like "3/4" into parts
 */
export function parseFraction(fractionStr: string): { numerator: string; denominator: string } | null {
  const match = fractionStr.match(/^(\d+)\/(\d+)$/);
  if (match) {
    return {
      numerator: match[1],
      denominator: match[2]
    };
  }
  return null;
}

/**
 * Simple validation for basic math expressions
 */
export function isValidMathExpression(expression: string): boolean {
  // Basic validation - check for balanced parentheses and valid characters
  const validChars = /^[0-9+\-*/^().=x y z a b c d e f g h i j k l m n o p q r s t u v w\s]+$/i;
  if (!validChars.test(expression)) return false;

  // Check balanced parentheses
  let count = 0;
  for (const char of expression) {
    if (char === '(') count++;
    if (char === ')') count--;
    if (count < 0) return false;
  }
  return count === 0;
}
