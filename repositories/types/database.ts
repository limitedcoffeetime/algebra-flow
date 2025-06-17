// Database row types - these represent the raw data structure from SQLite
export interface ProblemRow {
  id: string;
  batchId: string;
  equation: string;
  direction: string;
  answer: string; // JSON string or primitive
  answerLHS?: string;
  answerRHS?: string; // JSON string or primitive
  solutionSteps: string; // JSON string
  variables: string; // JSON string
  difficulty: 'easy' | 'medium' | 'hard';
  problemType: string;
  isCompleted: number; // SQLite boolean (0 or 1)
  userAnswer?: string;
  solutionStepsShown: number; // SQLite boolean (0 or 1)
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface ProblemBatchRow {
  id: string;
  generationDate: string; // ISO string
  sourceUrl?: string;
  problemCount: number;
  importedAt: string; // ISO string
}

export interface UserProgressRow {
  id: string;
  problemsAttempted: number;
  problemsCorrect: number;
  currentBatchId?: string;
  lastSyncTimestamp?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Database operation result types
export interface DatabaseInsertResult {
  insertId?: number;
  changes: number;
}

export interface DatabaseQueryResult<T> {
  rows: T[];
  rowsAffected: number;
}

// Serialized types for database operations
export interface SerializedProblem {
  id: string;
  batchId: string;
  equation: string;
  direction: string;
  answer: string; // Always string for DB storage
  answerLHS: string | null;
  answerRHS: string | null;
  solutionSteps: string; // JSON string
  variables: string; // JSON string
  difficulty: 'easy' | 'medium' | 'hard';
  problemType: string;
  isCompleted: number; // 0 or 1
  userAnswer: string | null;
  solutionStepsShown: number; // 0 or 1
  createdAt: string;
  updatedAt: string;
}
