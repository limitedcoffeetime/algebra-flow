import { SolutionStep } from '../../services/problemGeneration/openaiGenerator';

export interface Problem {
  id: string;
  batchId: string;
  equations: string[]; // Array of equations (always used - single item for regular problems, multiple for systems)
  direction: string;
  answer: string | number | number[];
  answerLHS?: string;
  answerRHS?: string | number | number[];
  solutionSteps: SolutionStep[];
  variables: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  problemType: string;
  isCompleted: boolean;
  userAnswer?: string | number | null;
  solutionStepsShown: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProblemInput {
  id?: string; // Optional, will be generated if not provided
  batchId: string;
  equations: string[]; // Array of equations (always used)
  direction: string;
  answer: string | number | number[];
  answerLHS?: string;
  answerRHS?: string | number | number[];
  solutionSteps: SolutionStep[];
  variables: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  problemType: string;
  isCompleted?: boolean;
  userAnswer?: string | number | null;
  solutionStepsShown?: boolean;
}

export interface UpdateProblemInput {
  isCompleted?: boolean;
  userAnswer?: string | number | null;
  solutionStepsShown?: boolean;
}
