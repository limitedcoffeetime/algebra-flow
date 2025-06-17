import { databaseService } from '@/services/domain';
import { ErrorStrategy, handleError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';
import { create } from 'zustand';

interface AppStore {
  // State
  isInitialized: boolean;
  isInitializing: boolean;
  globalError: string | null;

  // Actions
  initialize: () => Promise<void>;
  clearGlobalError: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  isInitialized: false,
  isInitializing: false,
  globalError: null,

  // Actions
  initialize: async () => {
    if (get().isInitialized || get().isInitializing) {
      return; // Already initialized or initializing
    }

    set({ isInitializing: true, globalError: null });

    try {
      // Initialize database
      const success = await databaseService.initialize();
      if (!success) {
        throw new Error('Failed to initialize database');
      }

      // Seed dummy data for development
      await databaseService.seedDummyData();

      set({ isInitialized: true, isInitializing: false });
      logger.info('✅ App initialization completed');
    } catch (error) {
      handleError(error, 'App initialization failed', ErrorStrategy.SILENT);
      set({
        globalError: 'Failed to initialize app',
        isInitialized: false,
        isInitializing: false
      });
    }
  },

  clearGlobalError: () => set({ globalError: null })
}));
