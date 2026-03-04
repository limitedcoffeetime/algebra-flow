import { z } from 'zod';

const answerSchema = z.union([
  z.string(),
  z.number(),
  z.array(z.union([z.string(), z.number()])),
]);

export const solutionStepSchema = z.object({
  explanation: z.string().min(1),
  mathExpression: z.string().min(1),
  isEquation: z.boolean(),
});

export const problemSchema = z.object({
  id: z.string().optional(),
  equations: z.array(z.string().min(1)).min(1),
  direction: z.string().min(1),
  answer: answerSchema,
  answerLHS: z.string().optional(),
  answerRHS: answerSchema.optional(),
  solutionSteps: z.array(solutionStepSchema),
  variables: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  problemType: z.string().min(1),
});

export const problemBatchSchema = z.object({
  id: z.string().min(1),
  generationDate: z.string().min(1),
  problemCount: z.number().int().nonnegative(),
  problems: z.array(problemSchema),
});

export const latestInfoSchema = z.object({
  batchId: z.string().min(1),
  url: z.string().url(),
  hash: z.string().min(1),
  generatedAt: z.string().min(1),
  problemCount: z.number().int().nonnegative(),
});

export type LatestInfoSchema = z.infer<typeof latestInfoSchema>;
export type ProblemBatchSchema = z.infer<typeof problemBatchSchema>;
