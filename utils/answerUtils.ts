import { parse, simplify } from 'mathjs';

/**
 * Determine if the user's answer matches the correct answer.
 * Supports numeric and algebraic string expressions.
 */
export function isAnswerCorrect(userAnswer: string, correctAnswer: string | number): boolean {
  const trimmedUser = userAnswer.trim();
  if (!trimmedUser) return false;

  // Numeric comparison when possible
  const userNum = parseFloat(trimmedUser);
  const correctNum =
    typeof correctAnswer === 'number' ? correctAnswer : parseFloat(String(correctAnswer));
  if (!isNaN(userNum) && !isNaN(correctNum)) {
    return userNum === correctNum;
  }

  // Algebraic expression comparison using mathjs
  if (typeof correctAnswer === 'string') {
    try {
      const diff = simplify(`(${trimmedUser}) - (${correctAnswer})`);
      return diff.equals(parse('0'));
    } catch {
      return false;
    }
  }

  return false;
}
