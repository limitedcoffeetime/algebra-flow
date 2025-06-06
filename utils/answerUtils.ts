import { evaluate } from 'mathjs';

/**
 * Simple math answer checker - evaluates expressions and compares values
 */
export function isAnswerCorrect(userAnswer: string, correctAnswer: string | number | number[]): boolean {
  const trimmedUser = userAnswer.trim();
  if (!trimmedUser) return false;

  try {
    const userVal = evaluate(trimmedUser);

    // Handle array answers (quadratic solutions like [1, 3])
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.some(sol => Math.abs(userVal - sol) < 1e-10);
    }

    // Handle comma-separated string answers (legacy format "1,3")
    const correctStr = String(correctAnswer);
    if (correctStr.includes(',')) {
      const solutions = correctStr.split(',').map(s => evaluate(s.trim()));
      return solutions.some(sol => Math.abs(userVal - sol) < 1e-10);
    }

    // Single answer - just evaluate both and compare
    const correctVal = evaluate(correctStr);
    return Math.abs(userVal - correctVal) < 1e-10;

  } catch {
    return false;
  }
}
