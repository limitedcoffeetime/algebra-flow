export interface UserProgress {
  id: string;
  currentBatchId?: string | null;
  problemsAttempted: number;
  problemsCorrect: number;
  lastSyncTimestamp?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserProgressInput {
  currentBatchId?: string | null;
  problemsAttempted?: number;
  problemsCorrect?: number;
  lastSyncTimestamp?: Date | null;
}
