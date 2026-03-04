import { ProblemApiData, VerificationResult } from './types';

const SIMPLIFY_FEEDBACK =
  'Almost there! Fully simplify your answer, list terms in descending order of degree, and remove extraneous parentheses.';

interface ValidationResult {
  isCorrect: boolean;
  needsFeedback: boolean;
  feedbackMessage?: string;
}

function getComputeEngine() {
  const maybeMathfieldElement = (globalThis as { MathfieldElement?: { computeEngine?: unknown } })
    .MathfieldElement;
  return maybeMathfieldElement?.computeEngine as
    | {
        parse: (value: string) => { simplify: () => { latex: string } };
      }
    | undefined;
}

function normalizeExpression(expression: string): string {
  return expression.toLowerCase().replace(/\s+/g, '');
}

function areAlgebraicallyEquivalent(expr1: string, expr2: string): boolean {
  try {
    const ce = getComputeEngine();
    if (!ce) return false;

    const userSimplified = ce.parse(expr1).simplify().latex;
    const correctSimplified = ce.parse(expr2).simplify().latex;

    return userSimplified === correctSimplified;
  } catch {
    return false;
  }
}

function isNumericScalar(expression: string): boolean {
  if (!expression || typeof expression !== 'string') return false;

  const trimmed = expression.trim();
  if (/[a-zA-Z]/.test(trimmed) || trimmed.includes(',')) return false;

  const plainish = trimmed
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/$2')
    .replace(/\\frac(\d+)(\d+)/g, '$1/$2')
    .replace(/\\left|\\right/g, '')
    .replace(/[{}\s]/g, '');

  const stripParens = (value: string): string => {
    let previous = value;
    let current = value;
    do {
      previous = current;
      if (current.startsWith('(') && current.endsWith(')')) {
        current = current.slice(1, -1);
      }
    } while (current !== previous);
    return current;
  };

  const core = stripParens(plainish);
  return /^[-+]?\d+(?:\.\d+)?(?:\/[-+]?\d+(?:\.\d+)?)?$/.test(core);
}

function extractCoefficients(expression: string): number[] {
  const coefficients: number[] = [];
  const matches = expression.match(/([+-]?\d+)/g) || [];

  for (const match of matches) {
    const coeff = parseInt(match, 10);
    if (!Number.isNaN(coeff) && coeff !== 0) {
      coefficients.push(Math.abs(coeff));
    }
  }

  return coefficients;
}

function findGCD(numbers: number[]): number {
  if (numbers.length === 0) return 1;
  if (numbers.length === 1) return numbers[0];

  const gcd = (a: number, b: number): number => {
    return b === 0 ? Math.abs(a) : gcd(b, a % b);
  };

  return numbers.reduce(gcd);
}

function hasPolynomialTerms(expression: string): boolean {
  return /[a-zA-Z]/.test(expression) && /[a-zA-Z]\^?\d*/.test(expression);
}

function getTermDegree(term: string): number {
  const explicitMatch = term.match(/[a-zA-Z]\^(\d+)/);
  if (explicitMatch) {
    return parseInt(explicitMatch[1], 10);
  }

  if (/[a-zA-Z]/.test(term)) {
    return 1;
  }

  return 0;
}

function extractPolynomialTerms(expression: string): Array<{ term: string; degree: number }> {
  const terms: Array<{ term: string; degree: number }> = [];
  const termStrings = expression.split(/(?=[+-])/).filter((part) => part.trim());

  for (const termString of termStrings) {
    const term = termString.trim();
    terms.push({ term, degree: getTermDegree(term) });
  }

  return terms;
}

function isInDescendingDegreeOrder(expression: string): boolean {
  const terms = extractPolynomialTerms(expression);
  for (let i = 1; i < terms.length; i += 1) {
    if (terms[i].degree > terms[i - 1].degree) {
      return false;
    }
  }

  return true;
}

function isInCanonicalForm(expression: string): boolean {
  if (!expression || typeof expression !== 'string') return false;

  const trimmed = expression.trim();
  const simpleFractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);

  if (simpleFractionMatch) {
    const numerator = parseInt(simpleFractionMatch[1], 10);
    const denominator = parseInt(simpleFractionMatch[2], 10);
    const gcd = findGCD([numerator, denominator]);

    if (gcd > 1) return false;
    if (numerator % denominator === 0) return false;
  }

  if (trimmed.includes('/')) {
    const fractionMatch =
      trimmed.match(/^\(([^)]+)\)\/(\d+)$/) ||
      trimmed.match(/^([^/]+)\/(\d+)$/);

    if (fractionMatch) {
      const numerator = fractionMatch[1];
      const denominator = parseInt(fractionMatch[2], 10);
      const coefficients = extractCoefficients(numerator);
      coefficients.push(denominator);
      const gcd = findGCD(coefficients);

      if (gcd > 1) return false;
    }
  }

  if (hasPolynomialTerms(trimmed)) {
    return isInDescendingDegreeOrder(trimmed);
  }

  return true;
}

function validateAnswerWithContext(
  userAnswer: string,
  correctAnswer: string,
  problemType: string,
): ValidationResult {
  if (!userAnswer || !correctAnswer) {
    return { isCorrect: false, needsFeedback: false };
  }

  const normalizedUser = normalizeExpression(userAnswer);
  const normalizedCorrect = normalizeExpression(correctAnswer);

  if (normalizedUser === normalizedCorrect) {
    if (!isInCanonicalForm(userAnswer) && problemType === 'polynomial-simplification') {
      return {
        isCorrect: false,
        needsFeedback: true,
        feedbackMessage: SIMPLIFY_FEEDBACK,
      };
    }

    return { isCorrect: true, needsFeedback: false };
  }

  const equivalent = areAlgebraicallyEquivalent(userAnswer, correctAnswer);
  const bothNumericOnly = isNumericScalar(userAnswer) && isNumericScalar(correctAnswer);

  if (problemType === 'polynomial-simplification') {
    if (equivalent) {
      return {
        isCorrect: false,
        needsFeedback: true,
        feedbackMessage: SIMPLIFY_FEEDBACK,
      };
    }

    return { isCorrect: false, needsFeedback: false };
  }

  if (bothNumericOnly) {
    return { isCorrect: false, needsFeedback: false };
  }

  if (equivalent) {
    return { isCorrect: true, needsFeedback: false };
  }

  return { isCorrect: false, needsFeedback: false };
}

function asStringArray(
  value: string | number | Array<string | number> | undefined,
): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim());
  }

  const asString = String(value).trim();
  if (asString.includes(',')) {
    return asString
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [asString];
}

function validateQuadraticAnswer(userAnswer: string, problem: ProblemApiData): VerificationResult {
  const correctAnswers = asStringArray(problem.answerRHS ?? problem.answer);
  if (correctAnswers.length === 0) {
    return {
      isCorrect: false,
      needsFeedback: false,
      userAnswerSimplified: userAnswer.trim(),
      correctAnswerSimplified: '',
      feedbackMessage: 'Problem does not contain a valid answer.',
    };
  }

  const userAnswers = userAnswer
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  let isDoubleRoot = correctAnswers.length === 1;
  if (!isDoubleRoot && correctAnswers.length === 2) {
    const [a, b] = correctAnswers.map((value) => normalizeExpression(value));
    isDoubleRoot = a === b;
  }

  if (isDoubleRoot) {
    if (userAnswers.length === 0 || userAnswers.length > 2) {
      return {
        isCorrect: false,
        needsFeedback: false,
        userAnswerSimplified: userAnswer.trim(),
        correctAnswerSimplified: correctAnswers[0],
        feedbackMessage: 'For double roots, provide one value or two matching values.',
      };
    }

    if (userAnswers.length === 2 && normalizeExpression(userAnswers[0]) !== normalizeExpression(userAnswers[1])) {
      return {
        isCorrect: false,
        needsFeedback: false,
        userAnswerSimplified: userAnswer.trim(),
        correctAnswerSimplified: correctAnswers[0],
        feedbackMessage: 'This equation has a double root. Use one value or duplicate values.',
      };
    }

    const candidate = userAnswers[0];
    const validation = validateAnswerWithContext(candidate, correctAnswers[0], problem.problemType);
    return {
      isCorrect: validation.isCorrect,
      needsFeedback: validation.needsFeedback,
      userAnswerSimplified: candidate,
      correctAnswerSimplified: correctAnswers[0],
      feedbackMessage: validation.feedbackMessage,
    };
  }

  if (userAnswers.length !== 2) {
    return {
      isCorrect: false,
      needsFeedback: false,
      userAnswerSimplified: userAnswer.trim(),
      correctAnswerSimplified: correctAnswers.join(', '),
      feedbackMessage: 'Please provide both roots separated by a comma.',
    };
  }

  const unmatchedCorrect = [...correctAnswers];
  let needsFeedback = false;
  let feedbackMessage: string | undefined;

  for (const currentUser of userAnswers) {
    let matchedIndex = -1;

    for (let i = 0; i < unmatchedCorrect.length; i += 1) {
      const validation = validateAnswerWithContext(currentUser, unmatchedCorrect[i], problem.problemType);
      if (validation.isCorrect) {
        matchedIndex = i;
        break;
      }

      if (validation.needsFeedback && !feedbackMessage) {
        needsFeedback = true;
        feedbackMessage = validation.feedbackMessage;
      }
    }

    if (matchedIndex >= 0) {
      unmatchedCorrect.splice(matchedIndex, 1);
    }
  }

  if (unmatchedCorrect.length === 0) {
    return {
      isCorrect: true,
      needsFeedback: false,
      userAnswerSimplified: userAnswers.join(', '),
      correctAnswerSimplified: correctAnswers.join(', '),
    };
  }

  return {
    isCorrect: false,
    needsFeedback,
    userAnswerSimplified: userAnswers.join(', '),
    correctAnswerSimplified: correctAnswers.join(', '),
    feedbackMessage,
  };
}

function validateSystemsAnswer(userAnswer: string, problem: ProblemApiData): VerificationResult {
  const answers = asStringArray(problem.answer);
  if (answers.length !== 2) {
    return {
      isCorrect: false,
      needsFeedback: false,
      userAnswerSimplified: userAnswer.trim(),
      correctAnswerSimplified: '',
      feedbackMessage: 'Problem does not contain a valid ordered pair answer.',
    };
  }

  let userValues: string[] = [];
  const orderedPairMatch = userAnswer.match(/^\(\s*([^,]+)\s*,\s*([^)]+)\s*\)$/);
  if (orderedPairMatch) {
    userValues = [orderedPairMatch[1].trim(), orderedPairMatch[2].trim()];
  } else {
    userValues = userAnswer
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (userValues.length !== 2) {
    return {
      isCorrect: false,
      needsFeedback: false,
      userAnswerSimplified: userAnswer.trim(),
      correctAnswerSimplified: `(${answers[0]}, ${answers[1]})`,
      feedbackMessage: 'Provide your answer as x, y or (x, y).',
    };
  }

  const xValidation = validateAnswerWithContext(userValues[0], answers[0], problem.problemType);
  const yValidation = validateAnswerWithContext(userValues[1], answers[1], problem.problemType);

  return {
    isCorrect: xValidation.isCorrect && yValidation.isCorrect,
    needsFeedback: xValidation.needsFeedback || yValidation.needsFeedback,
    userAnswerSimplified: `(${userValues[0]}, ${userValues[1]})`,
    correctAnswerSimplified: `(${answers[0]}, ${answers[1]})`,
    feedbackMessage: xValidation.feedbackMessage || yValidation.feedbackMessage,
  };
}

function expectedSingleAnswer(problem: ProblemApiData): string {
  const answerSource = problem.answerRHS ?? problem.answer;
  const candidates = asStringArray(answerSource);
  return candidates[0] ?? '';
}

export function verifyAnswer(userAnswer: string, problem: ProblemApiData): VerificationResult {
  const trimmed = userAnswer.trim();

  if (!trimmed) {
    return {
      isCorrect: false,
      needsFeedback: false,
      userAnswerSimplified: '',
      correctAnswerSimplified: '',
      feedbackMessage: 'Enter an answer before verifying.',
    };
  }

  if (problem.problemType === 'quadratic-completing-square') {
    return validateQuadraticAnswer(trimmed, problem);
  }

  if (problem.problemType === 'systems-of-equations') {
    return validateSystemsAnswer(trimmed, problem);
  }

  const expectedAnswer = expectedSingleAnswer(problem);
  const result = validateAnswerWithContext(trimmed, expectedAnswer, problem.problemType);

  return {
    isCorrect: result.isCorrect,
    needsFeedback: result.needsFeedback,
    userAnswerSimplified: trimmed,
    correctAnswerSimplified: expectedAnswer,
    feedbackMessage: result.feedbackMessage,
  };
}
