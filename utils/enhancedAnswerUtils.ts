/**
 * Robust answer validation system that prevents exploits and ensures users provide
 * the correct form of answer based on problem type.
 */

import { handleMathError, handleValidationError } from './errorHandler';
import { logger } from './logger';

/**
 * Main validation function with problem type awareness
 */
export async function isAnswerCorrect(
  userAnswer: string,
  correctAnswer: string | number | number[],
  answerLHS?: string,
  answerRHS?: string | number | number[],
  problemType?: string,
  originalEquation?: string
): Promise<boolean> {
  const trimmedUser = userAnswer.trim();
  if (!trimmedUser) return false;

  // Prevent users from submitting the original equation/problem
  if (originalEquation && await isSubmittingOriginalProblem(trimmedUser, originalEquation, problemType)) {
    logger.warn('🚫 User submitted original problem:', trimmedUser);
    return false;
  }

  // If we have LHS/RHS structure, validate against RHS only
  if (answerLHS && answerRHS !== undefined) {
    return validateSolutionAnswer(trimmedUser, answerRHS, problemType);
  }

  // For problems without LHS/RHS (like simplification), validate against answer
  return validateDirectAnswer(trimmedUser, correctAnswer, problemType, originalEquation);
}

/**
 * Detect if user is submitting the original problem or a variation of it
 */
async function isSubmittingOriginalProblem(userInput: string, originalEquation: string, problemType?: string): Promise<boolean> {
  const cleanUser = cleanMathExpression(userInput);
  const cleanOriginal = cleanMathExpression(originalEquation);

  // Direct match of the original equation
  if (cleanUser === cleanOriginal) {
    return true;
  }

  // Check if user input contains an equals sign (likely submitting an equation instead of solution)
  if (userInput.includes('=')) {
    // For equation-solving problems, the answer should NOT contain equals signs
    if (problemType && ['linear-one-variable', 'linear-two-variables', 'quadratic-factoring', 'quadratic-formula'].includes(problemType)) {
      return true;
    }

    // Check if it's a variation of the original equation (like adding/subtracting same value from both sides)
    if (await isEquationVariation(userInput, originalEquation)) {
      return true;
    }
  }

  // For simplification problems, check if user submitted the original unsimplified expression
  if (problemType === 'polynomial-simplification') {
    // Remove all whitespace and compare
    const normalizedUser = userInput.replace(/\s/g, '');
    const normalizedOriginal = originalEquation.replace(/\s/g, '');
    if (normalizedUser === normalizedOriginal) {
      return true;
    }
  }

  return false;
}

/**
 * Check if an equation is just a variation of the original (same equation with operations applied to both sides)
 */
async function isEquationVariation(userEquation: string, originalEquation: string): Promise<boolean> {
  try {
    const { evaluate } = await import('mathjs');

    // Split both equations into left and right sides
    const userParts = userEquation.split('=').map(s => s.trim());
    const originalParts = originalEquation.split('=').map(s => s.trim());

    if (userParts.length !== 2 || originalParts.length !== 2) {
      return false;
    }

    // Test if both equations are equivalent by checking if (userLeft - userRight) === (originalLeft - originalRight)
    // with several test values for variables
    const testValues = [-2, -1, 0, 1, 2, 3];
    const variables = await extractVariables(originalEquation);

    for (const testValue of testValues) {
      try {
        const scope: Record<string, number> = {};
        variables.forEach(v => scope[v] = testValue);

        const userDiff = evaluate(userParts[0], scope) - evaluate(userParts[1], scope);
        const originalDiff = evaluate(originalParts[0], scope) - evaluate(originalParts[1], scope);

        if (Math.abs(userDiff - originalDiff) > 1e-10) {
          return false; // Not equivalent equations
        }
      } catch (error) {
        // If evaluation fails, continue with next test value
        handleMathError(error, `evaluating equation variation with test value ${testValue}`);
        continue;
      }
    }

    return true; // All test values show the equations are equivalent
  } catch (error) {
    return handleValidationError(error, 'checking equation variation');
  }
}

/**
 * Validate answers for equation-solving problems (should be just the solution value/expression)
 */
async function validateSolutionAnswer(
  userInput: string,
  correctRHS: string | number | number[],
  problemType?: string
): Promise<boolean> {
  // User input should not contain equals signs for solution problems
  if (userInput.includes('=')) {
    return false;
  }

  return validateAgainstAnswer(userInput, correctRHS, problemType);
}

/**
 * Validate answers for direct answer problems (like simplification)
 */
async function validateDirectAnswer(
  userInput: string,
  correctAnswer: string | number | number[],
  problemType?: string,
  originalEquation?: string
): Promise<boolean> {
  // For polynomial simplification, ensure the answer is actually simplified
  if (problemType === 'polynomial-simplification') {
    return validateSimplifiedPolynomial(userInput, correctAnswer, originalEquation);
  }

  return validateAgainstAnswer(userInput, correctAnswer, problemType);
}

/**
 * Validate polynomial simplification answers
 */
async function validateSimplifiedPolynomial(
  userInput: string,
  correctAnswer: string | number | number[],
  originalEquation?: string
): Promise<boolean> {
  try {
    const { evaluate } = await import('mathjs');

    // First check if mathematically equivalent
    const isEquivalent = await areExpressionsEquivalent(userInput, String(correctAnswer));
    if (!isEquivalent) {
      return false;
    }

    // Check if the user input is actually simplified
    if (!isPolynomialSimplified(userInput)) {
      return false;
    }

    // Ensure user didn't just submit the original problem
    if (originalEquation && userInput.replace(/\s/g, '') === originalEquation.replace(/\s/g, '')) {
      return false;
    }

    return true;
  } catch (error) {
    return handleValidationError(error, 'validating simplified polynomial');
  }
}

/**
 * Check if a polynomial expression is in simplified form
 */
function isPolynomialSimplified(expression: string): boolean {
  const cleanExpr = expression.replace(/\s/g, '');

  // Look for signs that it's not simplified:

  // 1. Multiple terms with the same variable power (like "2x + 3x" or "x^2 + 4x^2")
  const termPattern = /([+-]?)(\d*)([a-zA-Z]+)(\^?\d*)/g;
  const variablePowers: Record<string, number> = {};

  let match;
  while ((match = termPattern.exec(cleanExpr)) !== null) {
    const variable = match[3];
    const power = match[4] ? match[4].replace('^', '') : '1';
    const key = `${variable}^${power}`;

    variablePowers[key] = (variablePowers[key] || 0) + 1;

    // If we see the same variable with same power more than once, it's not simplified
    if (variablePowers[key] > 1) {
      return false;
    }
  }

  // 2. Coefficient of 1 being explicitly written (like "1x" instead of "x")
  if (/\b1[a-zA-Z]/.test(cleanExpr)) {
    return false;
  }

  // 3. Terms not in descending order of powers (for same variable)
  // This is a more complex check that we could add if needed

  return true;
}

/**
 * Core validation logic with enhanced type awareness
 */
async function validateAgainstAnswer(
  userInput: string,
  correctAnswer: string | number | number[],
  problemType?: string
): Promise<boolean> {
  try {
    const { evaluate } = await import('mathjs');

    // Handle array answers (quadratic solutions like [1, 3] or ["-7/2", "5/3"])
    if (Array.isArray(correctAnswer)) {
      try {
        const userVal = evaluate(userInput);
        if (typeof userVal === 'number') {
          return correctAnswer.some(sol => {
            try {
              // Evaluate the solution if it's a string (like "-7/2")
              const solVal = typeof sol === 'string' ? evaluate(sol) : sol;
              return typeof solVal === 'number' && Math.abs(userVal - solVal) < 1e-10;
            } catch (error) {
              handleMathError(error, `evaluating array solution ${sol}`);
              return false;
            }
          });
        }
      } catch (error) {
        // If evaluation fails, try string matching for expressions
        handleMathError(error, 'evaluating user input for array answer');
        return correctAnswer.some(sol =>
          userInput.toLowerCase() === String(sol).toLowerCase()
        );
      }
    }

    // Handle comma-separated string answers (legacy format "1,3")
    const correctStr = String(correctAnswer);
    if (correctStr.includes(',')) {
      try {
        const solutions = correctStr.split(',').map(s => evaluate(s.trim()));
        const userVal = evaluate(userInput);
        if (typeof userVal === 'number') {
          return solutions.some(sol => Math.abs(userVal - sol) < 1e-10);
        }
      } catch (error) {
        // Fallback to string comparison
        handleMathError(error, 'evaluating comma-separated answers');
        return correctStr.toLowerCase().includes(userInput.toLowerCase());
      }
    }

    // Primary method: Direct numerical comparison
    try {
      const userVal = evaluate(userInput);
      const correctVal = evaluate(correctStr);

      if (typeof userVal === 'number' && typeof correctVal === 'number') {
        return Math.abs(userVal - correctVal) < 1e-10;
      }
    } catch (error) {
      // If numerical evaluation fails, continue to other methods
      handleMathError(error, 'direct numerical comparison');
    }

    // For expression problems, use algebraic equivalence but with stricter form checking
    if (problemType && ['linear-two-variables', 'polynomial-simplification'].includes(problemType)) {
      return await areExpressionsEquivalent(userInput, correctStr);
    }

    // Fallback: String comparison for exact matches
    return userInput.toLowerCase() === correctStr.toLowerCase();

  } catch (error) {
    // Final fallback: string comparison
    handleValidationError(error, 'validating answer against correct answer');
    return userInput.toLowerCase() === String(correctAnswer).toLowerCase();
  }
}

/**
 * Check if expressions are equivalent by testing with multiple variable values
 */
async function areExpressionsEquivalent(expr1: string, expr2: string): Promise<boolean> {
  try {
    const { evaluate } = await import('mathjs');

    // Extract variables from both expressions
    const vars1 = await extractVariables(expr1);
    const vars2 = await extractVariables(expr2);

    // Must have same variables
    const allVars = [...new Set([...vars1, ...vars2])];
    if (allVars.length === 0) {
      // No variables, already handled above
      return false;
    }

    // Test with several values for each variable
    const testValues = [-2, -1, 0, 1, 2, 3, 0.5];

    for (let i = 0; i < Math.min(5, testValues.length); i++) {
      const scope: Record<string, number> = {};
      allVars.forEach(v => scope[v] = testValues[i]);

      try {
        const val1 = evaluate(expr1, scope);
        const val2 = evaluate(expr2, scope);

        if (typeof val1 === 'number' && typeof val2 === 'number') {
          if (Math.abs(val1 - val2) > 1e-10) {
            return false;
          }
        } else {
          return false;
        }
      } catch (error) {
        // If evaluation fails with these values, skip this test
        handleMathError(error, `evaluating expressions with test values (iteration ${i})`);
        continue;
      }
    }

    return true;
  } catch (error) {
    return handleValidationError(error, 'checking expression equivalence');
  }
}

/**
 * Extract variable names from a mathematical expression
 */
async function extractVariables(expr: string): Promise<string[]> {
  try {
    const { parse } = await import('mathjs');
    const node = parse(expr);
    const variables: Set<string> = new Set();

    node.traverse((node: any) => {
      if (node.type === 'SymbolNode' && !node.fn) {
        // Only add if it's not a function name
        const name = node.name;
        if (!/^(sin|cos|tan|log|ln|sqrt|abs|exp|pi|e)$/i.test(name)) {
          variables.add(name);
        }
      }
    });

    return Array.from(variables);
  } catch (error) {
    // Fallback: simple regex to find variable-like patterns
    handleMathError(error, 'parsing expression to extract variables');
    const matches = expr.match(/[a-zA-Z][a-zA-Z0-9]*/g) || [];
    return [...new Set(matches.filter(m =>
      !/^(sin|cos|tan|log|ln|sqrt|abs|exp|pi|e)$/i.test(m)
    ))];
  }
}

/**
 * Clean mathematical expression for comparison (remove spaces, normalize operators)
 */
function cleanMathExpression(expr: string): string {
  return expr
    .replace(/\s/g, '') // Remove all whitespace
    .replace(/\*\*/g, '^') // Normalize exponentiation
    .replace(/\\\*/g, '*') // Normalize multiplication
    .toLowerCase();
}

/**
 * Check if user answer matches any of multiple possible correct answers
 */
export async function isAnswerInSet(userAnswer: string, correctAnswers: (string | number)[]): Promise<boolean> {
  for (const answer of correctAnswers) {
    if (await isAnswerCorrect(userAnswer, answer)) {
      return true;
    }
  }
  return false;
}

/**
 * Format answer for display (handles fractions, decimals, etc.)
 */
export function formatAnswer(answer: string | number | number[]): string {
  if (Array.isArray(answer)) {
    return answer.map(a => formatSingleAnswer(a)).join(', ');
  }
  return formatSingleAnswer(answer);
}

function formatSingleAnswer(answer: string | number): string {
  if (typeof answer === 'number') {
    // Handle common fractions
    if (Math.abs(answer - 0.5) < 1e-10) return '1/2';
    if (Math.abs(answer - 1/3) < 1e-10) return '1/3';
    if (Math.abs(answer - 2/3) < 1e-10) return '2/3';
    if (Math.abs(answer - 0.25) < 1e-10) return '1/4';
    if (Math.abs(answer - 0.75) < 1e-10) return '3/4';

    // Return integer if it's a whole number
    if (Number.isInteger(answer)) return answer.toString();

    // Return decimal with reasonable precision
    return answer.toFixed(3).replace(/\.?0+$/, '');
  }

  return String(answer);
}
