import { Difficulty, ProblemType } from './constants';

export function getProblemTypeInstructions(problemType: ProblemType): {
  instructions: string;
  answerFormat: string;
} {
  switch (problemType) {
    case 'linear-one-variable':
      return {
        instructions:
          'Solve for x. Answer should be an integer or simple fraction (like 1/2, 2/3). NO complex decimals.',
        answerFormat: 'number or simple fraction',
      };
    case 'linear-two-variables':
      return {
        instructions:
          'Solve for x in terms of y (express x = ... ). Answer should use integer coefficients only. Example: "x = 3 + 2y" or "x = (5 - 3y)/2".',
        answerFormat: 'expression with integer coefficients',
      };
    case 'quadratic-factoring':
    case 'quadratic-formula':
      return {
        instructions:
          'Find all solutions. Solutions should be integers or simple fractions. Always provide answers as an array, even for single solutions (e.g., [3] or [-2, 5]). NO irrational numbers or complex decimals.',
        answerFormat: 'array of integer(s) or simple fraction(s)',
      };
    case 'polynomial-simplification':
      return {
        instructions:
          'Simplify the polynomial expression. Use integer coefficients only. Example: "3x^2 + 2x - 5".',
        answerFormat: 'polynomial with integer coefficients',
      };
    default:
      return {
        instructions: 'Solve the equation with calculator-free answer.',
        answerFormat: 'integer or simple fraction',
      };
  }
}

export function getDifficultyDescription(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'Simple problems with small integer coefficients (1-10)';
    case 'medium':
      return 'Moderate problems with larger coefficients and some fractions';
    case 'hard':
      return 'Complex problems requiring multiple steps and algebraic manipulation';
    default:
      return 'Standard algebra problems';
  }
}

export function getSolutionStepsInstructions(): string {
  return `
SOLUTION STEPS FORMAT:
Each step should be an object with three parts:
1. "explanation": Plain English description of what you're doing (e.g., "Add 5 to both sides")
2. "mathExpression": The actual math for this step in LATEX FORMAT (e.g., "x + 5 = 10" or "2x^2 + 3x - 1")
3. "isEquation": true if the expression contains "=", false if it's just an expression

EXAMPLES:
{
  "explanation": "Start with the original equation",
  "mathExpression": "2x + 3 = 11",
  "isEquation": true
}
{
  "explanation": "Subtract 3 from both sides",
  "mathExpression": "2x = 8",
  "isEquation": true
}
{
  "explanation": "Divide both sides by 2",
  "mathExpression": "x = 4",
  "isEquation": true
}

CRITICAL: LATEX FORMATTING REQUIREMENTS for MathLive Compatibility:
- For fractions: use \\frac{numerator}{denominator} NOT "3/4" format
  ✓ Correct: "\\frac{3}{4}", "x = \\frac{21}{3}", "\\frac{a}{3} = 7"
  ✗ Wrong: "3/4", "x = 21/3", "a/3 = 7"
- For square roots: use \\sqrt{expression} NOT "sqrt(expression)"
  ✓ Correct: "\\sqrt{16}", "\\sqrt{x + 1}"
  ✗ Wrong: "sqrt(16)", "sqrt(x + 1)"
- For exponents: use x^{2} or x^2 for simple exponents
  ✓ Correct: "x^2", "x^{2n + 1}", "(x + 1)^2"
- For multiplication: use implicit multiplication or \\cdot
  ✓ Correct: "2x", "3(x + 1)", "2 \\cdot 3"
- Use proper LaTeX spacing and grouping with braces when needed

LATEX EXAMPLES:
- Division: "\\frac{x + 1}{2}" instead of "(x + 1)/2"
- Mixed operations: "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" for quadratic formula
- Complex fractions: "\\frac{\\frac{1}{x}}{x + 1}" for nested fractions
- Equations with fractions: "\\frac{2x}{3} = \\frac{5}{6}"

This LaTeX format is required for proper rendering in MathLive math fields.
`;
}
