import { logger } from '@/utils/logger';
import { OpenAI } from 'openai';
import { Difficulty, ProblemType } from './constants';
import { getDifficultyDescription, getProblemTypeInstructions, getSolutionStepsInstructions } from './instructions';
import { getProblemResponseSchema } from './schema';
import { parseOpenAIResponse } from './validation';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SolutionStep {
  explanation: string;
  mathExpression: string;
  isEquation: boolean;
}

export interface GeneratedProblem {
  equations: string[]; // Array of equations (always used - single item for regular problems, multiple for systems)
  direction: string;
  answer: unknown;
  answerLHS?: string; // e.g., "x = " - for problems that solve for a variable
  answerRHS?: unknown; // The RHS when LHS is present
  solutionSteps: SolutionStep[];
  variables: string[];
  difficulty: Difficulty;
  problemType: ProblemType;
  isCompleted: boolean;
}

export async function generateProblemsWithAI(
  problemType: ProblemType,
  difficulty: Difficulty,
  count: number,
): Promise<GeneratedProblem[]> {
  const typeInstructions = getProblemTypeInstructions(problemType);
  const responseSchema = getProblemResponseSchema(problemType, count);

  const systemInstructions = `You are a math teacher creating algebra problems. Follow the JSON schema exactly and separate math expressions from explanations.

Problem Type Specific Instructions:
${typeInstructions.instructions}

CRITICAL DIRECTION FIELD RULES:
- The "direction" field should NEVER contain mathematical expressions or symbols
- Do NOT restate the problem equation - the actual equation is displayed separately below
- Use simple English instructions only: "Solve for x", "Simplify the expression", "Factor the polynomial", "Solve the system of equations"
- NO LaTeX, NO fractions, NO variables, NO equations in the direction field
- Math rendering is NOT supported in this field

EXAMPLES OF GOOD DIRECTIONS:
✓ "Solve for x"
✓ "Simplify the expression" 
✓ "Factor the polynomial"
✓ "Solve the system of equations"

EXAMPLES OF BAD DIRECTIONS (DO NOT USE):
✗ "Simplify the polynomial expression \\frac{3}{4}(x+4)^2 - 3(x-2) + x(x-1)"
✗ "Solve 2x + 3 = 7 for x"
✗ "Find the value of x in the equation x^2 - 4 = 0"

${getSolutionStepsInstructions()}

CRITICAL SOLUTION STEPS EXPLANATION RULES:
- The "explanation" field in solution steps should avoid explicit mathematical notation
- Do NOT write fractions like "\\frac{2}{3}" or "2/3" in explanations
- Do NOT write exponents like "x^2" in explanations  
- Instead use descriptive language: "Add the constant term", "Divide by the coefficient", "Square both sides"
- Simple variables (x, y, z) and integers are acceptable in explanations
- Save all complex math for the "mathExpression" field

EXAMPLES OF GOOD EXPLANATIONS:
✓ "Add 5 to both sides"
✓ "Divide by the coefficient of x"  
✓ "Multiply the first equation by 2"
✓ "Substitute the value back into the original equation"

EXAMPLES OF BAD EXPLANATIONS (DO NOT USE):
✗ "Add \\frac{3}{4} to both sides"
✗ "Multiply by x^2 + 1"
✗ "The coefficient \\frac{2}{3} becomes \\frac{3}{2}"

CRITICAL CONSTRAINT - CALCULATOR-FREE PROBLEMS ONLY:
- For NUMERIC answers: must be integers or simple fractions (like 1/2, 2/3, 3/4, 5/6)
- For VARIABLE answers: variables are allowed when the problem asks to solve in terms of another variable
- NO complex decimals like 1.2839, 2.7182, 0.3333... etc.
- NO irrational numbers like √2, √3 unless they simplify to integers
- Design problems so the algebra works out to clean, simple answers
- Students should never need a calculator to verify the answer

ACCEPTABLE NUMERIC ANSWERS: 3, -2, 1/2, 2/3, 0, 7, -1/4, 5/3
ACCEPTABLE VARIABLE ANSWERS: \\frac{5-3y}{2}, \\frac{2x+7}{3}, 3x^2 + 2x - 1
UNACCEPTABLE ANSWERS: 1.2839, 2.7182, 0.3333..., √2, 3.14159, 1.7320

CRITICAL: LATEX FORMATTING for MathLive Compatibility:
- ALL mathematical expressions must use LaTeX format
- For equations: "2x + 3 = 11", "\\frac{x}{3} = 7", "x^2 - 4 = 0"
- For fractions: ALWAYS use \\frac{numerator}{denominator} format
  ✓ Correct: "\\frac{a}{3} = 7", "x = \\frac{21}{3}", "\\frac{2x + 1}{4} = \\frac{3}{2}"
  ✗ Wrong: "a/3 = 7", "x = 21/3", "(2x + 1)/4 = 3/2"
- For roots: use \\sqrt{expression}
- For exponents: use x^2 or x^{complex_exponent}
- This applies to the main equation AND all solution steps

Generate problems following the exact JSON schema structure.

Constraints:
- ${difficulty} difficulty means: ${getDifficultyDescription(difficulty)}
- For ${problemType}: ${typeInstructions.instructions}
- Solution steps should use the structured format with separated explanations and math
- Each problem should be unique
- CRITICAL: Ensure your answer matches the final step of your solution
- CRITICAL: All answers must be calculator-free (integers/simple fractions for numeric answers, variables allowed for variable answers)
- CRITICAL: Direction must clearly state what to do, answer must be just the value
- CRITICAL: List all variables used in the problem in the variables array
- CRITICAL: ALL math expressions must be in LaTeX format for MathLive compatibility`;

  const userInput = `Generate exactly ${count} ${difficulty} algebra problems of type "${problemType}".`;

  try {
    // Using the OpenAI Responses API with structured outputs
    const response = await openai.responses.create({
      model: 'o4-mini-2025-04-16',
      instructions: systemInstructions,
      input: userInput,
      text: {
        format: {
          type: 'json_schema',
          name: 'algebra_problems_response',
          description: 'Response containing algebra problems with structured solution steps',
          schema: responseSchema,
          strict: true
        }
      },
      store: false
    });

    // Extract content from the responses API format
    const content = response.output_text.trim();

    // Parse the response
    let responseObj;
    try {
      responseObj = JSON.parse(content);
    } catch (error) {
      // Fallback to our cleaning function for any edge cases
      responseObj = parseOpenAIResponse(content);
    }

    const problems = responseObj.problems;

    if (!Array.isArray(problems) || problems.length !== count) {
      throw new Error(`Expected ${count} problems, got ${problems.length}`);
    }

    return problems.map((p, index) => {
      logger.info(`🔍 Processing problem ${index + 1}:`, {
        type: p.problemType,
        difficulty: p.difficulty,
        equations: p.equations.map((eq: string) => eq.substring(0, 50) + '...'),
        hasAnswer: !!p.answer,
        hasLHS: !!p.answerLHS,
        hasRHS: !!p.answerRHS
      });

      // Determine what to validate
      let answerToValidate: string | number | number[];
      if (p.answerRHS !== undefined && p.answerRHS !== null) {
        answerToValidate = p.answerRHS;
      } else if (p.answer !== undefined && p.answer !== null) {
        answerToValidate = p.answer;
      } else {
        logger.warn(`❌ Problem ${index + 1} has no valid answer to validate`);
        throw new Error(`Problem ${index + 1} missing valid answer field`);
      }

      logger.info(`✅ Problem ${index + 1} validation target:`, answerToValidate);

      return {
        equations: p.equations, // Always use equations array
        direction: p.direction,
        answer: p.answer,
        answerLHS: p.answerLHS,
        answerRHS: p.answerRHS,
        solutionSteps: p.solutionSteps,
        variables: p.variables,
        difficulty,
        problemType,
        isCompleted: false
      };
    });
  } catch (error) {
    logger.error('❌ OpenAI API Error:', error);
    throw error;
  }
}
