export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SolutionStep {
  explanation: string;
  mathExpression: string;
  isEquation: boolean;
}

export interface ProblemApiData {
  id?: string;
  equations: string[];
  direction: string;
  answer?: string | number | Array<string | number>;
  answerLHS?: string;
  answerRHS?: string | number | Array<string | number>;
  solutionSteps: SolutionStep[];
  variables: string[];
  difficulty: Difficulty;
  problemType: string;
}

export interface ProblemBatchApiResponse {
  id: string;
  generationDate: string;
  problemCount: number;
  problems: ProblemApiData[];
}

export interface LatestInfo {
  batchId: string;
  url: string;
  hash: string;
  generatedAt: string;
  problemCount: number;
}

export interface ProblemAttemptState {
  attempts: number;
  isCompleted: boolean;
  isCorrect: boolean;
  userAnswer?: string;
  solutionViewed: boolean;
}

export interface VerificationResult {
  isCorrect: boolean;
  needsFeedback: boolean;
  userAnswerSimplified: string;
  correctAnswerSimplified: string;
  feedbackMessage?: string;
}

export interface SyncResult {
  updated: boolean;
  message: string;
}
