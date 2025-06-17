import { ProblemBatch } from '@/repositories';
import { databaseService } from '@/services/domain';
import { syncService } from '@/services/sync/SyncServiceFactory';
import { ErrorStrategy, handleError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';
import { create } from 'zustand';

interface BatchInfo {
  id: string;
  generationDate: string;
  importedAt: string;
  problemCount: number;
  completedCount: number;
  isCurrentBatch: boolean;
  sourceUrl?: string | null;
}

interface SyncStore {
  // State
  lastSyncTime: string | null;
  isSyncing: boolean;
  isCleaningUp: boolean;
  error: string | null;

  // Actions
  initializeSync: () => Promise<void>;
  forceSync: () => Promise<boolean>;
  cleanupOrphanedBatches: () => Promise<number>;
  getBatchesInfo: () => Promise<BatchInfo[]>;
  clearError: () => void;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  // Initial state
  lastSyncTime: null,
  isSyncing: false,
  isCleaningUp: false,
  error: null,

  // Actions
  initializeSync: async () => {
    try {
      // Load last sync time
      const lastSync = await syncService.getLastSyncTime();
      set({ lastSyncTime: lastSync });

      // Check if we should sync
      const shouldSync = await syncService.shouldSync();
      if (shouldSync) {
        logger.info('🔄 Auto-sync triggered during initialization');
        set({ isSyncing: true });

        try {
          const hasNew = await syncService.syncProblems();
          if (hasNew) {
            logger.info('✅ Auto-sync completed with new problems');
          }

          // Update sync time
          const newSyncTime = await syncService.getLastSyncTime();
          set({ lastSyncTime: newSyncTime });
        } catch (syncError) {
          logger.error('⚠️ Auto-sync failed during initialization:', syncError);
          // Don't fail initialization if sync fails
        } finally {
          set({ isSyncing: false });
        }
      }
    } catch (error) {
      handleError(error, 'Failed to initialize sync', ErrorStrategy.SILENT);
    }
  },

  forceSync: async () => {
    set({ isSyncing: true, error: null });
    try {
      const hasNewProblems = await syncService.forceSyncCheck();

      // Update sync time
      const lastSync = await syncService.getLastSyncTime();
      set({ lastSyncTime: lastSync, isSyncing: false });

      return hasNewProblems;
    } catch (error) {
      handleError(error, 'Force sync failed', ErrorStrategy.SILENT);
      set({ error: 'Failed to sync', isSyncing: false });
      return false;
    }
  },

  cleanupOrphanedBatches: async () => {
    set({ isCleaningUp: true, error: null });
    try {
      const deletedCount = await syncService.cleanupOrphanedBatches();
      set({ isCleaningUp: false });
      return deletedCount;
    } catch (error) {
      handleError(error, 'Cleanup failed', ErrorStrategy.SILENT);
      set({ error: 'Failed to cleanup batches', isCleaningUp: false });
      return 0;
    }
  },

  getBatchesInfo: async () => {
    try {
      const allBatches = await databaseService.batches.getAll();
      const userProgress = await databaseService.userProgress.get();

      const batchesInfo = await Promise.all(
        allBatches.map(async (batch: ProblemBatch) => {
          try {
            const batchDetails = await databaseService.batches.getDetails(batch.id);

            return {
              id: batch.id,
              generationDate: batch.generationDate.toISOString(),
              importedAt: batch.importedAt.toISOString(),
              problemCount: batch.problemCount,
              completedCount: batchDetails?.problemCounts.completed || 0,
              isCurrentBatch: batch.id === userProgress?.currentBatchId,
              sourceUrl: batch.sourceUrl
            };
          } catch (batchError) {
            logger.error(`Failed to process batch ${batch.id}:`, batchError);
            return {
              id: batch.id,
              generationDate: batch.generationDate?.toISOString() || 'Unknown',
              importedAt: batch.importedAt?.toISOString() || 'Unknown',
              problemCount: batch.problemCount || 0,
              completedCount: 0,
              isCurrentBatch: false,
              sourceUrl: batch.sourceUrl
            };
          }
        })
      );

      return batchesInfo;
    } catch (error) {
      handleError(error, 'Failed to get batches info', ErrorStrategy.SILENT);
      return [];
    }
  },

  clearError: () => set({ error: null })
}));
