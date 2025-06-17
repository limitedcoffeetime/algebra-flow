import { UserProgress } from '@/repositories';
import { databaseService } from '@/services/domain';
import { ErrorStrategy, handleError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';
import { create } from 'zustand';

interface UserProgressStore {
  // State
  userProgress: UserProgress | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
  recordAttempt: (isCorrect: boolean) => Promise<void>;
  clearError: () => void;
}

export const useUserProgressStore = create<UserProgressStore>((set, get) => ({
  // Initial state
  userProgress: null,
  isLoading: false,
  error: null,

  // Actions
  loadProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const progress = await databaseService.userProgress.get();
      set({ userProgress: progress, isLoading: false });
    } catch (error) {
      handleError(error, 'Failed to load user progress', ErrorStrategy.SILENT);
      set({ error: 'Failed to load progress', isLoading: false });
    }
  },

  resetProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      await databaseService.resetEverything();
      const progress = await databaseService.userProgress.get();
      set({ userProgress: progress, isLoading: false });

      logger.info('User progress reset successfully');
    } catch (error) {
      handleError(error, 'Failed to reset progress', ErrorStrategy.SILENT);
      set({ error: 'Failed to reset progress', isLoading: false });
    }
  },

  recordAttempt: async (isCorrect: boolean) => {
    try {
      await databaseService.userProgress.recordAttempt(isCorrect);
      // Refresh progress after recording
      const progress = await databaseService.userProgress.get();
      set({ userProgress: progress });
    } catch (error) {
      handleError(error, 'Failed to record attempt', ErrorStrategy.SILENT);
    }
  },

  clearError: () => set({ error: null })
}));
