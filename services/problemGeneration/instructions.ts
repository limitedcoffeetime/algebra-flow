import { Difficulty, ProblemType } from './constants';

export function getProblemTypeInstructions(problemType: ProblemType): {
  instructions: string;
  answerFormat: string;
} {
  switch (problemType) {
    case 'linear-one-variable':
      return {
        instructions:
          'Solve for x. For fractions, use LaTeX format like \\frac{2}{3} - NEVER use decimal approximations like 0.6666. For integers, use plain numbers like 5. ANSWER SUBMISSION: Submit your answer in fully simplified form.',
        answerFormat: 'LaTeX fractions (\\frac{a}{b}) or integers',
      };
    case 'linear-two-variables':
      return {
        instructions:
          'Solve for x in terms of y (express x = ... ). Use LaTeX fractions like \\frac{5-3y}{2} instead of decimal approximations. Use integer coefficients when possible. ANSWER SUBMISSION: Submit your answer in fully simplified form.',
        answerFormat: 'LaTeX expression with fractions and integer coefficients',
      };
    case 'quadratic-factoring':
    case 'quadratic-formula':
      return {
        instructions:
          'Find all solutions using COMPLETING THE SQUARE method. This method transforms any quadratic equation into the form (x + h)² = k, which is easy to solve. Always show the complete the square process with detailed explanations in your solution steps: 1) Start with the standard form and isolate x² and x terms on one side, 2) Identify the coefficient of x (call it "b") and calculate what to add: (b/2)², 3) Add this value to both sides to create a perfect square trinomial, 4) Factor the left side as (x + number)², 5) Take the square root of both sides (remember ± for the square root), 6) Solve for x. Explain WHY we add (b/2)² - because it creates a perfect square that factors nicely. Use clear language like "We add 9 to both sides because (6/2)² = 9, which will complete the square" rather than just stating the operation. For fractions, use LaTeX format like \\frac{2}{3} - NEVER use decimal approximations. Always provide BOTH solutions as an array of exactly 2 elements, even if one is repeated (e.g., ["3", "3"] or ["\\frac{-2}{3}", "5"]). NO irrational numbers or decimal approximations. ANSWER SUBMISSION: Submit both answers separated by a comma (e.g., "3, -2"). The order does not matter.',
        answerFormat: 'array of exactly 2 LaTeX fractions (\\frac{a}{b}) or integers',
      };
    case 'systems-of-equations':
      return {
        instructions:
          'Solve the system of linear equations using substitution or elimination method. Show detailed step-by-step work: 1) For substitution: solve one equation for one variable, then substitute into the other equation, 2) For elimination: multiply equations as needed to eliminate one variable when adding/subtracting equations, 3) Solve for the remaining variable, 4) Substitute back to find the other variable, 5) Check your solution in both original equations. Use LaTeX format like \\frac{2}{3} for fractions - NEVER use decimal approximations. Provide the solution as an ordered pair (x, y). NO irrational numbers or decimal approximations. ANSWER SUBMISSION: Submit your answer as an ordered pair in the form (x, y), for example: (3, -2) or (\\frac{1}{2}, \\frac{3}{4}).',
        answerFormat: 'ordered pair (x, y) with LaTeX fractions or integers',
      };
    case 'polynomial-simplification':
      return {
        instructions:
          'Simplify the polynomial expression. Use LaTeX fractions like \\frac{3}{4}x^2 for fractional coefficients. Use integer coefficients when possible. ANSWER SUBMISSION: Submit your answer in standard form (terms in ascending order of degree) and fully simplified (distribute all parentheses and combine like terms).',
        answerFormat: 'polynomial with LaTeX fractions and integer coefficients',
      };
    default:
      return {
        instructions: 'Solve the equation with calculator-free answer. Use LaTeX \\frac{a}{b} for fractions, never decimal approximations. ANSWER SUBMISSION: Submit your answer in fully simplified form.',
        answerFormat: 'LaTeX fractions (\\frac{a}{b}) or integers',
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
