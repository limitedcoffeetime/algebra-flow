/**
 * Clean LHS/RHS answer checker - no backwards compatibility
 */
export async function isAnswerCorrect(
  userAnswer: string,
  correctAnswer: string | number | number[],
  answerLHS?: string,
  answerRHS?: string | number | number[]
): Promise<boolean> {
  const trimmedUser = userAnswer.trim();
  if (!trimmedUser) return false;

  // If we have LHS/RHS structure, validate against RHS only
  if (answerLHS && answerRHS !== undefined) {
    return validateAgainstAnswer(trimmedUser, answerRHS);
  }

  // For problems without LHS/RHS (like simplification), validate against answer
  return validateAgainstAnswer(trimmedUser, correctAnswer);
}

/**
 * Core validation logic
 */
async function validateAgainstAnswer(
  userInput: string,
  correctAnswer: string | number | number[]
): Promise<boolean> {
  try {
    const { evaluate } = await import('mathjs');

    // Handle array answers (quadratic solutions like [1, 3])
    if (Array.isArray(correctAnswer)) {
      try {
        const userVal = evaluate(userInput);
        if (typeof userVal === 'number') {
          return correctAnswer.some(sol => Math.abs(userVal - sol) < 1e-10);
        }
      } catch {
        // If evaluation fails, try string matching for expressions
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
      } catch {
        // Fallback to string comparison
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
    } catch {
      // If numerical evaluation fails, continue to other methods
    }

    // Secondary method: Simple algebraic forms (basic substitution test)
    if (await areExpressionsEquivalent(userInput, correctStr)) {
      return true;
    }

    // Fallback: String comparison for exact matches
    return userInput.toLowerCase() === correctStr.toLowerCase();

  } catch {
    // Final fallback: string comparison
    return userInput.toLowerCase() === String(correctAnswer).toLowerCase();
  }
}

/**
 * Check if expressions are equivalent by testing with multiple variable values
 * This is more reliable than mathjs simplify() which can be unpredictable
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
      } catch {
        // If evaluation fails with these values, skip this test
        continue;
      }
    }

    return true;
  } catch {
    return false;
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
  } catch {
    // Fallback: simple regex to find variable-like patterns
    const matches = expr.match(/[a-zA-Z][a-zA-Z0-9]*/g) || [];
    return [...new Set(matches.filter(m =>
      !/^(sin|cos|tan|log|ln|sqrt|abs|exp|pi|e)$/i.test(m)
    ))];
  }
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
