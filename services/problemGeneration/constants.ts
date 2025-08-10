export type Difficulty = 'easy' | 'medium' | 'hard';

export const PROBLEM_TYPES = [
  'linear-one-variable',
  'linear-two-variables',
  'quadratic-completing-square',
  'polynomial-simplification',
  'systems-of-equations',
] as const;

export type ProblemType = typeof PROBLEM_TYPES[number];

export const PROBLEM_TYPES_BY_DIFFICULTY: Record<Difficulty, ProblemType[]> = {
  easy: ['linear-one-variable', 'polynomial-simplification'],
  medium: ['linear-two-variables', 'quadratic-completing-square', 'polynomial-simplification', 'systems-of-equations'],
  hard: [
    'linear-two-variables',
    'quadratic-completing-square',
    'polynomial-simplification',
    'systems-of-equations',
  ],
};

// Default distribution – may be overridden via configureProblemsPerBatch()
export const TARGET_DIFFICULTY_MIX: Record<Difficulty, number> = {
  easy: 33,
  medium: 50,
  hard: 17,
};
