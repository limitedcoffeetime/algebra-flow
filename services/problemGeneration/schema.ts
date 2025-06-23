import { ProblemType } from './constants';

export function getProblemResponseSchema(problemType: ProblemType, count: number) {
  let answerSchema: any;
  let includesAnswerLHS = false;

  switch (problemType) {
    case 'linear-one-variable':
      answerSchema = { type: 'number' };
      includesAnswerLHS = true;
      break;
    case 'linear-two-variables':
      answerSchema = { type: 'string' };
      includesAnswerLHS = true;
      break;
    case 'quadratic-factoring':
    case 'quadratic-formula':
      answerSchema = {
        type: 'array',
        items: { type: 'number' },
        minItems: 1,
        maxItems: 3,
        description: 'Array of solution(s). Use single-element array for one solution.',
      };
      includesAnswerLHS = true;
      break;
    case 'polynomial-simplification':
      answerSchema = { type: 'string' };
      includesAnswerLHS = false;
      break;
    default:
      answerSchema = { type: 'number' };
      includesAnswerLHS = true;
  }

  // Build the properties object conditionally
  let problemProperties: any = {
    equation: {
      type: 'string',
      description: 'The algebra problem equation in LaTeX format (use \\frac{a}{b} for fractions, \\sqrt{x} for roots)'
    },
    direction: {
      type: 'string',
      description: 'Clear instruction for what to do (e.g., "Solve for x", "Simplify", "Factor")'
    },
    solutionSteps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          explanation: {
            type: 'string',
            description: 'Plain English explanation of what we\'re doing in this step'
          },
          mathExpression: {
            type: 'string',
            description: 'The mathematical expression/equation for this step in LaTeX format (use \\frac{a}{b} for fractions, \\sqrt{x} for roots)'
          },
          isEquation: {
            type: 'boolean',
            description: 'Whether this expression is an equation (contains =) or just an expression'
          }
        },
        required: ['explanation', 'mathExpression', 'isEquation'],
        additionalProperties: false
      },
      minItems: 1,
      description: 'Step-by-step solution with separated explanations and math in LaTeX format',
    },
    variables: {
      type: 'array',
      items: { type: 'string' },
      description: 'All variables used in this problem (e.g., ["x", "y"])'
    }
  };

  let requiredFields = ['equation', 'direction', 'solutionSteps', 'variables'];

  if (includesAnswerLHS) {
    // For problems like "solve for x", generate LHS and RHS
    problemProperties.answerLHS = {
      type: 'string',
      description: 'The left-hand side of the answer (e.g., "x = " or "y = "). Only for problems that solve for a variable.'
    };
    problemProperties.answerRHS = {
      ...answerSchema,
      description: 'The right-hand side value only (e.g., "5" or "(3y-2)/4"). Used when answerLHS is present.'
    };
    requiredFields.push('answerLHS', 'answerRHS');
  } else {
    // For problems like simplification, just use single answer
    problemProperties.answer = {
      ...answerSchema,
      description: 'The solution value only (for simplification problems without a specific variable to solve for)',
    };
    requiredFields.push('answer');
  }

  return {
    type: 'object',
    properties: {
      problems: {
        type: 'array',
        items: {
          type: 'object',
          properties: problemProperties,
          required: requiredFields,
          additionalProperties: false,
        },
        minItems: count,
        maxItems: count,
        description: `Exactly ${count} algebra problems`,
      },
    },
    required: ['problems'],
    additionalProperties: false,
  };
}
