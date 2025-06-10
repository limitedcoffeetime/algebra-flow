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
  equation: string;
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

  const prompt = `Generate exactly ${count} ${difficulty} algebra problems of type "${problemType}".

Problem Type Specific Instructions:
${typeInstructions.instructions}

${getSolutionStepsInstructions()}

CRITICAL CONSTRAINT - CALCULATOR-FREE PROBLEMS ONLY:
- Answers must be integers or simple fractions (like 1/2, 2/3, 3/4, 5/6)
- NO complex decimals like 1.2839, 2.7182, 0.3333... etc.
- NO irrational numbers like √2, √3 unless they simplify to integers
- Design problems so the algebra works out to clean, simple answers
- Students should never need a calculator to verify the answer

ACCEPTABLE ANSWERS: 3, -2, 1/2, 2/3, 0, 7, -1/4, 5/3
UNACCEPTABLE ANSWERS: 1.2839, 2.7182, 0.3333..., √2, 3.14159, 1.7320

Generate problems following the exact JSON schema structure.

Constraints:
- ${difficulty} difficulty means: ${getDifficultyDescription(difficulty)}
- For ${problemType}: ${typeInstructions.instructions}
- Solution steps should use the structured format with separated explanations and math
- Each problem should be unique
- CRITICAL: Ensure your answer matches the final step of your solution
- CRITICAL: All answers must be calculator-free (integers or simple fractions only)
- CRITICAL: Direction must clearly state what to do, answer must be just the value
- CRITICAL: List all variables used in the problem in the variables array`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const { problems } = parseOpenAIResponse(responseText);

    if (!Array.isArray(problems) || problems.length !== count) {
      throw new Error(`Expected ${count} problems, got ${problems.length}`);
    }

    return problems.map((p, index) => ({
      id: crypto.randomUUID(),
      equation: p.equation,
      direction: p.direction,
      answer: p.answer,
      answerLHS: p.answerLHS,
      answerRHS: p.answerRHS,
      solutionSteps: Array.isArray(p.solutionSteps) ? p.solutionSteps : [p.solutionSteps],
      variables: p.variables,
      difficulty,
      problemType,
      isCompleted: false,
    }));
  } catch (error) {
    throw error;
  }
}
