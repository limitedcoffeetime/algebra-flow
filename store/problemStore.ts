import { Problem, UserProgress } from '@/repositories';
import { databaseService } from '@/services/domain';
import { ProblemSyncService } from '@/services/problemSyncService';
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

interface ProblemStore {
  // === PROBLEM STATE (Future: problemStore.ts) ===
  currentProblem: Problem | null;

  // === USER PROGRESS STATE (Future: userProgressStore.ts) ===
  userProgress: UserProgress | null;

  // === SYNC STATE (Future: syncStore.ts) ===
  lastSyncTime: string | null;

  // === APP STATE (Future: appStore.ts or keep in main) ===
  isLoading: boolean;
  error: string | null;

  // === ACTIONS ===
  initialize: () => Promise<void>;

  // Problem actions (Future: problemStore.ts)
  loadNextProblem: () => Promise<void>;
  submitAnswer: (userAnswer: string, isCorrect: boolean) => Promise<void>;

  // User progress actions (Future: userProgressStore.ts)
  resetProgress: () => Promise<void>;

  // Sync actions (Future: syncStore.ts)
  forceSync: () => Promise<boolean>;

  // Batch info (Future: might move to batchStore or stay here)
  getBatchesInfo: () => Promise<BatchInfo[]>;
}

export const useProblemStore = create<ProblemStore>((set, get) => ({
  // === INITIAL STATE ===
  currentProblem: null,
  userProgress: null,
  isLoading: false,
  error: null,
  lastSyncTime: null,

  // === APP INITIALIZATION ===
  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      // Initialize database
      const success = await databaseService.initialize();
      if (!success) {
        throw new Error('Failed to initialize database');
      }

      // Seed dummy data for development
      await databaseService.seedDummyData();

      // === SYNC LOGIC (Future: syncStore.ts) ===
      // Check for new problems if we should sync
      const shouldSync = await ProblemSyncService.shouldSync();
      if (shouldSync) {
        logger.info('🔄 Checking for new problems...');
        try {
          const newProblems = await ProblemSyncService.syncProblems();
          if (newProblems) {
            logger.info('✅ Downloaded new problems');
          }
        } catch (syncError) {
          logger.error('⚠️ Sync failed but continuing with local data:', syncError);
          // Don't fail initialization if sync fails
        }
      }

      // === USER PROGRESS LOGIC (Future: userProgressStore.ts) ===
      // Load user progress
      const progress = await databaseService.userProgress.get();
      const lastSync = await ProblemSyncService.getLastSyncTime();
      set({ userProgress: progress, lastSyncTime: lastSync });

      // === PROBLEM LOGIC (Future: problemStore.ts) ===
      // Load first problem
      await get().loadNextProblem();
    } catch (error) {
      logger.error('Initialization error:', error);
      set({ error: 'Failed to initialize app' });
    } finally {
      set({ isLoading: false });
    }
  },

  // === PROBLEM ACTIONS (Future: problemStore.ts) ===
  // Load next problem
  loadNextProblem: async () => {
    try {
      const problem = await databaseService.getNextProblem();

      if (problem) {
        set({ currentProblem: problem, error: null });
      } else {
        set({ error: 'No more problems available!' });
      }
    } catch (error) {
      logger.error('Failed to load problem:', error);
      set({ error: 'Failed to load problem' });
    }
  },

  // Submit answer - enhanced with new databaseService
  submitAnswer: async (userAnswer: string, isCorrect: boolean) => {
    const { currentProblem } = get();
    if (!currentProblem) return;

    try {
      // Use the enhanced submitAnswer that handles validation automatically
      const result = await databaseService.submitAnswer(currentProblem.id, userAnswer);

      // === USER PROGRESS UPDATE (Future: userProgressStore.ts) ===
      // Refresh user progress (this is now automatic in the new service)
      const progress = await databaseService.userProgress.get();
      set({
        userProgress: progress,
        error: null,
        currentProblem: result.problem // Update with the completed problem
      });
    } catch (error) {
      logger.error('Failed to submit answer:', error);
      set({ error: 'Failed to save answer' });
    }
  },

  // === USER PROGRESS ACTIONS (Future: userProgressStore.ts) ===
  // Reset progress
  resetProgress: async () => {
    try {
      set({ error: null }); // Clear any existing errors
      await databaseService.resetEverything(); // Resets both problems and progress
      const progress = await databaseService.userProgress.get();
      set({ userProgress: progress });
      await get().loadNextProblem();
    } catch (error) {
      logger.error('Failed to reset progress:', error);
      set({ error: 'Failed to reset progress' });
    }
  },

  // === SYNC ACTIONS (Future: syncStore.ts) ===
  // Force sync
  forceSync: async () => {
    try {
      const hasNewProblems = await ProblemSyncService.forceSyncCheck();
      const progress = await databaseService.userProgress.get();
      set({ userProgress: progress });
      return hasNewProblems;
    } catch (error) {
      logger.error('Failed to force sync:', error);
      set({ error: 'Failed to force sync' });
      return false;
    }
  },

  // === BATCH INFO (Future: might move to dedicated store) ===
  // Get batches info for debugging
  getBatchesInfo: async () => {
    try {
      const allBatches = await databaseService.batches.getAll();
      const userProgress = await databaseService.userProgress.get();

      const batchesInfo = await Promise.all(
        allBatches.map(async (batch, index) => {
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
            // Return partial info even if there's an error
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
      logger.error('Failed to get batches info:', error);
      return [];
    }
  }
}));
