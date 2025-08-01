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
      console.warn('MathLive Compute Engine not available, falling back to string comparison');
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
  
  // Match patterns like: 12y, -4, +6x, etc.
  const termRegex = /([+-]?)(\d*)([a-zA-Z]*)/g;
  let match;
  
  while ((match = termRegex.exec(expression)) !== null) {
    const [, sign, coeff, variable] = match;
    if (coeff || sign) {
      const coefficient = parseInt(`${sign}${coeff || '1'}`) || (sign === '-' ? -1 : 1);
      if (!isNaN(coefficient) && coefficient !== 0) {
        coefficients.push(Math.abs(coefficient));
      }
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
 * Performs strict validation with helpful feedback
 * Returns correct/incorrect/feedback based on the answer quality
 */
export function validateAnswer(userAnswer: string, correctAnswer: string): ValidationResult {
  if (!userAnswer || !correctAnswer) {
    return { isCorrect: false, needsFeedback: false };
  }
  
  const normalizedUser = normalizeExpression(userAnswer);
  const normalizedCorrect = normalizeExpression(correctAnswer);
  
  // Check for exact match first
  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true, needsFeedback: false };
  }
  
  // IMPORTANT: Check if user's answer is in canonical form FIRST
  // If it's not simplified, we should give feedback regardless of algebraic equivalence
  const userCanonical = isInCanonicalForm(normalizedUser);
  const userInOrder = !hasPolynomialTerms(normalizedUser) || isInDescendingDegreeOrder(normalizedUser);
  
  // If the answer is not in canonical form, check if it's algebraically equivalent
  if (!userCanonical || !userInOrder) {
    // Only check algebraic equivalence if the form is wrong
    if (areAlgebraicallyEquivalent(userAnswer, correctAnswer)) {
      let feedbackMessage = "Your answer is mathematically correct, but please ";
      const issues: string[] = [];
      
      if (!userCanonical) {
        issues.push("simplify your answer fully");
      }
      
      if (!userInOrder) {
        issues.push("write terms in descending degree order");
      }
      
      feedbackMessage += issues.join(" and ") + ".";
      return { 
        isCorrect: false, 
        needsFeedback: true, 
        feedbackMessage 
      };
    }
  } else {
    // User's answer is in canonical form, check if algebraically equivalent
    if (areAlgebraicallyEquivalent(userAnswer, correctAnswer)) {
      return { isCorrect: true, needsFeedback: false };
    }
  }
  
  // Not equivalent at all
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
 * but preserves the exact mathematical form
 */
function normalizeExpression(expression: string): string {
  return expression
    .trim()
    .replace(/\s+/g, '') // Remove all whitespace
    .replace(/\+\-/g, '-') // Normalize +- to -
    .replace(/^\+/, ''); // Remove leading +
}