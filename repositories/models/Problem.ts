import { SolutionStep } from '../../services/problemGeneration/openaiGenerator';

export interface Problem {
  id: string;
  batchId: string;
  equation: string; // Legacy single equation
  equations?: string[]; // New: array of equations (max 2 for systems)
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
  equation: string; // Legacy single equation
  equations?: string[]; // New: array of equations (max 2 for systems)
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
