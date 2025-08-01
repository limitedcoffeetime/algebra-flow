import { ProblemType } from './constants';

export function getProblemResponseSchema(problemType: ProblemType, count: number) {
  let answerSchema: any;
  let includesAnswerLHS = false;

  switch (problemType) {
    case 'linear-one-variable':
      answerSchema = {
        type: 'string',
        description: 'Use LaTeX format for fractions like \\frac{2}{3} instead of decimals like 0.6666. For integers, use plain numbers like "5".'
      };
      includesAnswerLHS = true;
      break;
    case 'linear-two-variables':
      answerSchema = { type: 'string' };
      includesAnswerLHS = true;
      break;
    case 'quadratic-completing-square':
      answerSchema = {
        oneOf: [
          {
            type: 'string',
            description: 'Single solution for double roots (repeated solution). Use LaTeX format for fractions like \\frac{2}{3} instead of decimals. For integers, use plain numbers like "5".'
          },
          {
            type: 'array',
            items: {
              type: 'string',
              description: 'Use LaTeX format for fractions like \\frac{2}{3} instead of decimals. For integers, use plain numbers like "5".'
            },
            minItems: 2,
            maxItems: 2,
            description: 'Array of BOTH distinct solutions in LaTeX format. Use \\frac{a}{b} for fractions, plain numbers for integers.'
          }
        ],
        description: 'For double roots (repeated solution), provide a single string. For distinct solutions, provide an array of exactly 2 solutions. Use LaTeX \\frac{a}{b} for fractions, plain numbers for integers.',
      };
      includesAnswerLHS = true;
      break;
    case 'systems-of-equations':
      answerSchema = {
        type: 'array',
        items: {
          type: 'string',
          description: 'Use LaTeX format for fractions like \\frac{2}{3} instead of decimals. For integers, use plain numbers like "5".'
        },
        minItems: 2,
        maxItems: 2,
        description: 'Ordered pair [x-value, y-value] as an array of strings in LaTeX format. Order matters: first element is x-value, second is y-value.',
      };
      includesAnswerLHS = false; // Systems use coordinate pair format, not "x = " format
      break;
    case 'polynomial-simplification':
      answerSchema = { type: 'string' };
      includesAnswerLHS = false;
      break;
    default:
      answerSchema = {
        type: 'string',
        description: 'Use LaTeX format for fractions like \\frac{2}{3} instead of decimals like 0.6666. For integers, use plain numbers like "5".'
      };
      includesAnswerLHS = true;
  }

  // Build the properties object conditionally
  let problemProperties: any = {
    direction: {
      type: 'string',
      description: 'Clear instruction for what to do (e.g., "Solve for x", "Simplify", "Factor", "Solve the system of equations")'
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

  // Always use equations field for all problem types (clean and simple!)
  if (problemType === 'systems-of-equations') {
    problemProperties.equations = {
      type: 'array',
      items: {
        type: 'string',
        description: 'Each equation in LaTeX format (use \\frac{a}{b} for fractions, \\sqrt{x} for roots)'
      },
      minItems: 2,
      maxItems: 2,
      description: 'Array of exactly 2 equations for the system in LaTeX format'
    };
  } else {
    // For single equation problems, use an array with one equation
    problemProperties.equations = {
      type: 'array',
      items: {
        type: 'string',
        description: 'The equation in LaTeX format (use \\frac{a}{b} for fractions, \\sqrt{x} for roots)'
      },
      minItems: 1,
      maxItems: 1,
      description: 'Array with one equation in LaTeX format'
    };
  }

  let requiredFields = ['equations', 'direction', 'solutionSteps', 'variables'];

  if (includesAnswerLHS) {
    // For problems like "solve for x", generate LHS and RHS
    problemProperties.answerLHS = {
      type: 'string',
      description: 'The left-hand side of the answer (e.g., "x = " or "y = "). Only for problems that solve for a variable.'
    };
    // Handle answerRHS - if answerSchema has oneOf, we need to assign it directly
    if (answerSchema.oneOf) {
      problemProperties.answerRHS = {
        oneOf: answerSchema.oneOf,
        description: (answerSchema.description || 'The right-hand side value') + ' Use LaTeX \\frac{a}{b} for fractions, plain numbers for integers.'
      };
    } else {
      problemProperties.answerRHS = {
        ...answerSchema,
        description: (answerSchema.description || 'The right-hand side value') + ' Use LaTeX \\frac{a}{b} for fractions, plain numbers for integers.'
      };
    }
    requiredFields.push('answerLHS', 'answerRHS');
  } else {
    // For problems like simplification or systems, just use single answer
    problemProperties.answer = {
      ...answerSchema,
      description: answerSchema.description || 'The solution value. Use LaTeX \\frac{a}{b} for fractions.',
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
