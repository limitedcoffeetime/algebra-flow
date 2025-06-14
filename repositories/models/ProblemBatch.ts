export interface ProblemBatch {
  id: string;
  generationDate: Date;
  sourceUrl?: string;
  problemCount: number;
  importedAt: Date;
}

export interface CreateProblemBatchInput {
  id?: string; // Optional, will be generated if not provided
  generationDate: Date;
  sourceUrl?: string;
  problemCount: number;
}

export interface BatchStatistics {
  totalBatches: number;
  totalProblems: number;
  completedProblems: number;
  oldestBatch: Date | null;
  newestBatch: Date | null;
}
