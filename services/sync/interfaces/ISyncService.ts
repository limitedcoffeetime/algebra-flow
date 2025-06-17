import { BatchStatistics } from '../../../repositories/models/ProblemBatch';

export interface ISyncService {
  syncProblems(): Promise<boolean>;
  shouldSync(): Promise<boolean>;
  forceSyncCheck(): Promise<boolean>;
  getLastSyncTime(): Promise<string | null>;
  cleanupOrphanedBatches(): Promise<number>;
  getBatchInfo(): Promise<{
    local: BatchStatistics;
    lastSync: string | null;
  }>;
  deleteLocalBatches(batchIds: string[]): Promise<number>;
}
