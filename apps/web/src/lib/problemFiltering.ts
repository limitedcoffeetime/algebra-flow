import { Difficulty, ProblemBatchApiResponse, ProblemApiData } from './types';

export type DifficultyFilter = Difficulty | 'all';
export type ProblemTypeFilter = string | 'all';

export interface PracticeFilters {
  difficulty: DifficultyFilter;
  problemType: ProblemTypeFilter;
}

export function matchesPracticeFilters(
  problem: ProblemApiData,
  filters: PracticeFilters,
): boolean {
  const difficultyMatch =
    filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
  const typeMatch =
    filters.problemType === 'all' || problem.problemType === filters.problemType;

  return difficultyMatch && typeMatch;
}

export function getFilteredProblemIndices(
  batch: ProblemBatchApiResponse | null,
  filters: PracticeFilters,
): number[] {
  if (!batch) {
    return [];
  }

  const indices: number[] = [];

  for (let i = 0; i < batch.problems.length; i += 1) {
    if (matchesPracticeFilters(batch.problems[i], filters)) {
      indices.push(i);
    }
  }

  return indices;
}

export function getProblemTypeOptions(batch: ProblemBatchApiResponse | null): string[] {
  if (!batch) {
    return [];
  }

  return [...new Set(batch.problems.map((problem) => problem.problemType))].sort();
}
