/**
 * Strict validation utilities for mathematical expressions
 * Requires expressions to be in their simplest form
 * Uses MathLive Compute Engine for algebraic equivalence checking
 */

export interface ValidationResult {
  isCorrect: boolean;
  needsFeedback: boolean;
  feedbackMessage?: string;
}

/**
 * Checks if two expressions are algebraically equivalent using MathLive Compute Engine
 */
function areAlgebraicallyEquivalent(expr1: string, expr2: string): boolean {
  try {
    // Get the MathLive Compute Engine
    const ce = (window as any)?.MathfieldElement?.computeEngine;
    if (!ce) {
      console.warn('MathLive Compute Engine not available');
      return false;
    }
    
    // Parse and simplify both expressions using Compute Engine
    const userSimplified = ce.parse(expr1).simplify().latex;
    const correctSimplified = ce.parse(expr2).simplify().latex;
    
    // Check if they simplify to the same form
    return userSimplified === correctSimplified;
  } catch (error) {
    console.warn('Error in algebraic equivalence check:', error);
    return false;
  }
}

/**
 * Checks if an expression is in strict canonical form
 * - Fractions must be in lowest terms
 * - Polynomials must be in descending degree order
 * - No unnecessary parentheses or operations
 */
export function isInCanonicalForm(expression: string): boolean {
  if (!expression || typeof expression !== 'string') return false;
  
  const trimmed = expression.trim();
  
  // Check for simple fraction like 15/3, 6/2, etc.
  const simpleFractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (simpleFractionMatch) {
    const numerator = parseInt(simpleFractionMatch[1]);
    const denominator = parseInt(simpleFractionMatch[2]);
    
    // Check if the fraction can be simplified
    const gcd = findGCD([numerator, denominator]);
    if (gcd > 1) {
      return false; // Not in lowest terms
    }
    
    // Also check if it's an improper fraction that should be a whole number
    if (numerator % denominator === 0) {
      return false; // Should be simplified to whole number
    }
  }
  
  // Check for complex fractions with variables
  if (trimmed.includes('/')) {
    const fractionMatch = trimmed.match(/^\(([^)]+)\)\/(\d+)$/) || trimmed.match(/^([^/]+)\/(\d+)$/);
    if (fractionMatch) {
      const numerator = fractionMatch[1];
      const denominator = parseInt(fractionMatch[2]);
      
      // Extract coefficients from numerator to check GCD
      const coefficients = extractCoefficients(numerator);
      coefficients.push(denominator);
      
      const gcd = findGCD(coefficients);
      if (gcd > 1) {
        return false; // Not in lowest terms
      }
    }
  }
  
  // Check polynomial ordering (descending degree)
  if (hasPolynomialTerms(trimmed)) {
    return isInDescendingDegreeOrder(trimmed);
  }
  
  return true;
}

/**
 * Extracts numeric coefficients from an algebraic expression
 */
function extractCoefficients(expression: string): number[] {
  const coefficients: number[] = [];
  
  // Match patterns like: 12y, -4, +6x, 2y-6, etc.
  const matches = expression.match(/([+-]?\d+)/g) || [];
  
  for (const match of matches) {
    const coeff = parseInt(match);
    if (!isNaN(coeff) && coeff !== 0) {
      coefficients.push(Math.abs(coeff));
    }
  }
  
  return coefficients;
}

/**
 * Finds the Greatest Common Divisor of an array of numbers
 */
function findGCD(numbers: number[]): number {
  if (numbers.length === 0) return 1;
  if (numbers.length === 1) return numbers[0];
  
  const gcd = (a: number, b: number): number => {
    return b === 0 ? Math.abs(a) : gcd(b, a % b);
  };
  
  return numbers.reduce(gcd);
}

/**
 * Checks if expression contains polynomial terms
 */
function hasPolynomialTerms(expression: string): boolean {
  return /[a-zA-Z]/.test(expression) && /[a-zA-Z]\^?\d*/.test(expression);
}

/**
 * Verifies polynomial terms are in descending degree order
 */
function isInDescendingDegreeOrder(expression: string): boolean {
  // Extract terms with their degrees
  const terms = extractPolynomialTerms(expression);
  
  // Check if degrees are in descending order
  for (let i = 1; i < terms.length; i++) {
    if (terms[i].degree > terms[i-1].degree) {
      return false;
    }
  }
  
  return true;
}

/**
 * Extracts polynomial terms with their degrees
 */
function extractPolynomialTerms(expression: string): Array<{term: string, degree: number}> {
  const terms: Array<{term: string, degree: number}> = [];
  
  // Split by + and - while keeping the signs
  const termStrings = expression.split(/(?=[+-])/).filter(t => t.trim());
  
  for (const termStr of termStrings) {
    const degree = getTermDegree(termStr.trim());
    terms.push({ term: termStr.trim(), degree });
  }
  
  return terms;
}

/**
 * Gets the degree of a single term
 */
function getTermDegree(term: string): number {
  // Handle explicit exponents like x^2, y^3
  const explicitMatch = term.match(/[a-zA-Z]\^(\d+)/);
  if (explicitMatch) {
    return parseInt(explicitMatch[1]);
  }
  
  // Handle implicit degree 1 (just variable like x, y)
  if (/[a-zA-Z]/.test(term)) {
    return 1;
  }
  
  // Constant term
  return 0;
}

/**
 * Simple validation logic:
 * 1. Identical? → Correct
 * 2. Mathematically equivalent after simplification? → Tell to simplify
 * 3. Otherwise → Wrong
 */
export function validateAnswer(userAnswer: string, correctAnswer: string): ValidationResult {
  if (!userAnswer || !correctAnswer) {
    return { isCorrect: false, needsFeedback: false };
  }
  
  const normalizedUser = normalizeExpression(userAnswer);
  const normalizedCorrect = normalizeExpression(correctAnswer);
  
  // Step 1: Identical check
  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true, needsFeedback: false };
  }
  
  // Step 2: Check if mathematically equivalent after simplification
  if (areAlgebraicallyEquivalent(userAnswer, correctAnswer)) {
    return { 
      isCorrect: false, 
      needsFeedback: true, 
      feedbackMessage: "Almost there! Fully simplify your answer, list terms in descending order of degree, and remove extraneous parentheses."
    };
  }
  
  // Step 3: Not equivalent at all
  return { isCorrect: false, needsFeedback: false };
}

/**
 * Legacy function for backward compatibility
 */
export function strictCompare(userAnswer: string, correctAnswer: string): boolean {
  const result = validateAnswer(userAnswer, correctAnswer);
  return result.isCorrect;
}

/**
 * Normalizes expression by removing unnecessary whitespace
 * and standardizing LaTeX fraction and exponent formats
 */
function normalizeExpression(expression: string): string {
  return expression
    .trim()
    .replace(/\s+/g, '') // Remove all whitespace
    .replace(/\+\-/g, '-') // Normalize +- to -
    .replace(/^\+/, '') // Remove leading +
    .replace(/\\frac(\d+)(\d+)/g, '\\frac{$1}{$2}') // Convert \frac34 to \frac{3}{4}
    .replace(/\\frac([a-zA-Z]+)(\d+)/g, '\\frac{$1}{$2}') // Convert \fracx2 to \frac{x}{2}
    .replace(/\\frac\{([^}]+)\}(\d+)/g, '\\frac{$1}{$2}') // Convert \frac{3x+1}2 to \frac{3x+1}{2}
    .replace(/\\frac(\d+)\{([^}]+)\}/g, '\\frac{$1}{$2}') // Convert \frac3{x+1} to \frac{3}{x+1}
    .replace(/\^{(\d+)}/g, '^$1') // Convert x^{2} to x^2
    .replace(/\^{([^}]+)}/g, '^{$1}'); // Keep complex exponents in braces like x^{n+1}
}