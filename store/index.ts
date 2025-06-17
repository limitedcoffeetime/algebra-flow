// Import individual stores
import { useAppStore } from './appStore';
import { useProblemStore } from './problemStore';
import { useSyncStore } from './syncStore';
import { useUserProgressStore } from './userProgressStore';

// Export individual stores
export { useAppStore } from './appStore';
export { useProblemStore } from './problemStore';
export { useSyncStore } from './syncStore';
export { useUserProgressStore } from './userProgressStore';

// Composition hook for components that need multiple stores
export const useAppStores = () => {
  const problemStore = useProblemStore();
  const userProgressStore = useUserProgressStore();
  const syncStore = useSyncStore();
  const appStore = useAppStore();

  return {
    problem: problemStore,
    userProgress: userProgressStore,
    sync: syncStore,
    app: appStore
  };
};

// Initialization hook
export const useInitializeApp = () => {
  const { initialize: initializeApp } = useAppStore();
  const { initializeSync } = useSyncStore();
  const { loadProgress } = useUserProgressStore();
  const { loadNextProblem } = useProblemStore();

  const initializeAll = async () => {
    // 1. Initialize app (database, etc.)
    await initializeApp();

    // 2. Initialize sync (check for updates)
    await initializeSync();

    // 3. Load user progress
    await loadProgress();

    // 4. Load first problem
    await loadNextProblem();
  };

  return { initializeAll };
};
