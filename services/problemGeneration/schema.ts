import { ProblemType } from './constants';

export function getProblemResponseSchema(problemType: ProblemType, count: number) {
  let answerSchema: any;
  switch (problemType) {
    case 'linear-one-variable':
      answerSchema = { type: 'number' };
      break;
    case 'linear-two-variables':
    case 'polynomial-simplification':
      answerSchema = { type: 'string' };
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
      break;
    default:
      answerSchema = { type: 'number' };
  }

  return {
    type: 'object',
    properties: {
      problems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            equation: { type: 'string', description: 'The algebra problem equation' },
            direction: {
              type: 'string',
              description: 'Clear instruction for what to do (e.g., "Solve for x", "Simplify", "Factor")'
            },
            answer: {
              ...answerSchema,
              description: 'The solution value only (e.g., "5" not "x = 5")',
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
                    description: 'The mathematical expression/equation for this step (LaTeX or plain text)'
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
              description: 'Step-by-step solution with separated explanations and math',
            },
            variables: {
              type: 'array',
              items: { type: 'string' },
              description: 'All variables used in this problem (e.g., ["x", "y"])'
            }
          },
          required: ['equation', 'direction', 'answer', 'solutionSteps', 'variables'],
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
