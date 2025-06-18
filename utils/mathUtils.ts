/**
 * Utility functions for handling LaTeX mathematical expressions
 */

/**
 * Normalizes a LaTeX string by removing unnecessary whitespace and formatting
 * @param latex - The LaTeX string to normalize
 * @returns The normalized LaTeX string
 */
export function normalizeLaTeX(latex: string): string {
  if (!latex) return '';

  return latex
    .trim()
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Normalize common patterns
    .replace(/\{\s*(\w+)\s*\}/g, '{$1}')
    // Remove spaces around operators in simple expressions
    .replace(/\s*([+\-=])\s*/g, '$1')
    .trim();
}

/**
 * Checks if a LaTeX expression appears to be valid
 * @param latex - The LaTeX string to validate
 * @returns true if the expression seems valid, false otherwise
 */
export function isValidLaTeX(latex: string): boolean {
  if (!latex || typeof latex !== 'string') return false;

  const trimmed = latex.trim();
  if (trimmed.length === 0) return false;

  // Check for basic LaTeX syntax issues
  const openBraces = (trimmed.match(/\{/g) || []).length;
  const closeBraces = (trimmed.match(/\}/g) || []).length;

  // Braces should be balanced
  if (openBraces !== closeBraces) return false;

  // Check for basic mathematical content
  const hasContent = /[a-zA-Z0-9+\-=\/\*\^_{}\\]/.test(trimmed);

  return hasContent;
}

/**
 * Compares two LaTeX expressions for mathematical equality
 * This is a basic implementation - for production, you'd want more sophisticated comparison
 * @param latex1 - First LaTeX expression
 * @param latex2 - Second LaTeX expression
 * @returns true if expressions are likely equivalent
 */
export function compareLaTeX(latex1: string, latex2: string): boolean {
  const normalized1 = normalizeLaTeX(latex1);
  const normalized2 = normalizeLaTeX(latex2);

  // Direct string comparison after normalization
  if (normalized1 === normalized2) return true;

  // Handle some common equivalent forms
  const variations1 = getCommonVariations(normalized1);
  const variations2 = getCommonVariations(normalized2);

  for (const var1 of variations1) {
    for (const var2 of variations2) {
      if (var1 === var2) return true;
    }
  }

  return false;
}

/**
 * Generates common mathematical variations of a LaTeX expression
 * @param latex - The LaTeX expression
 * @returns Array of equivalent expressions
 */
function getCommonVariations(latex: string): string[] {
  const variations = [latex];

  // Add variation without spaces
  variations.push(latex.replace(/\s/g, ''));

  // Handle fraction representations
  if (latex.includes('\\frac')) {
    // Convert \frac{a}{b} to a/b
    const simplified = latex.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
    variations.push(simplified);
  }

  // Handle division to fraction conversion
  if (latex.includes('/') && !latex.includes('\\frac')) {
    // Convert a/b to \frac{a}{b} for simple cases
    const fractionized = latex.replace(/([^\/\s]+)\/([^\/\s]+)/g, '\\frac{$1}{$2}');
    variations.push(fractionized);
  }

  // Remove duplicate variations
  return [...new Set(variations)];
}

/**
 * Extracts plain text/numerical values from simple LaTeX expressions
 * @param latex - The LaTeX expression
 * @returns The extracted plain text, or original if cannot extract
 */
export function extractPlainValue(latex: string): string {
  if (!latex) return '';

  // For simple expressions, try to extract the numerical/algebraic value
  let simplified = latex
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\{([^}]+)\}/g, '$1')
    .replace(/\\/g, '')
    .trim();

  return simplified || latex;
}

/**
 * Formats a LaTeX expression for display
 * @param latex - The LaTeX expression
 * @returns A formatted display string
 */
export function formatLaTeXForDisplay(latex: string): string {
  if (!latex) return '';

  // For now, just return the LaTeX as-is
  // In a production app, you might want to render this with a math renderer
  return latex;
}
