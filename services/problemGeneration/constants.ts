export type Difficulty = 'easy' | 'medium' | 'hard';

export const PROBLEM_TYPES = [
  'linear-one-variable',
  'linear-two-variables',
  'quadratic-factoring',
  'quadratic-formula',
  'polynomial-simplification',
  'systems-of-equations',
] as const;

export type ProblemType = typeof PROBLEM_TYPES[number];

export const PROBLEM_TYPES_BY_DIFFICULTY: Record<Difficulty, ProblemType[]> = {
  easy: ['linear-one-variable', 'polynomial-simplification'],
  medium: ['linear-two-variables', 'quadratic-factoring', 'polynomial-simplification', 'systems-of-equations'],
  hard: [
    'linear-two-variables',
    'quadratic-factoring',
    'quadratic-formula',
    'polynomial-simplification',
    'systems-of-equations',
  ],
};

// Default distribution – may be overridden via configureProblemsPerBatch()
export const TARGET_DIFFICULTY_MIX: Record<Difficulty, number> = {
  easy: 40,
  medium: 40,
  hard: 20,
};
