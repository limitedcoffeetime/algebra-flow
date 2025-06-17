export interface UserStatistics {
  problemsAttempted: number;
  problemsCorrect: number;
  problemsIncorrect: number;
  accuracyPercentage: number;
  currentBatchId: string | null;
  lastSyncTimestamp: Date | null;
}

export interface BatchProgress {
  batchId: string;
  total: number;
  completed: number;
  remaining: number;
  progressPercentage: number;
}

export interface OverallStatistics {
  totalBatches: number;
  totalProblems: number;
  completedProblems: number;
  oldestBatch: Date | null;
  newestBatch: Date | null;
}

export interface AccuracyStats {
  problemType: string;
  attempted: number;
  correct: number;
  incorrect: number;
}

export interface DashboardData {
  userStats: UserStatistics;
  currentBatchProgress: BatchProgress | null;
  overallStats: OverallStatistics;
  accuracyStats: AccuracyStats[];
}
