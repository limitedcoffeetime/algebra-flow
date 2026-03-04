'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getProblemsLatestUrl } from '@/lib/env';
import {
  DifficultyFilter,
  ProblemTypeFilter,
  getFilteredProblemIndices,
  getProblemTypeOptions,
} from '@/lib/problemFiltering';
import { S3ProblemSource } from '@/lib/problemSource';
import { SyncCache } from '@/lib/syncCache';
import {
  LatestInfo,
  ProblemApiData,
  ProblemAttemptState,
  ProblemBatchApiResponse,
  SyncResult,
} from '@/lib/types';

interface AlgebraState {
  batch: ProblemBatchApiResponse | null;
  latestInfo: LatestInfo | null;
  currentProblemIndex: number;
  problemAttempts: Record<string, ProblemAttemptState>;
  problemsAttempted: number;
  problemsCorrect: number;
  selectedDifficulty: DifficultyFilter;
  selectedProblemType: ProblemTypeFilter;
  lastProblemHash: string | null;
  lastSyncTimestamp: string | null;
  isSyncing: boolean;
  syncError: string | null;
  isInitialized: boolean;
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  initialize: () => Promise<void>;
  syncProblems: (force?: boolean) => Promise<SyncResult>;
  setDifficultyFilter: (difficulty: DifficultyFilter) => void;
  setProblemTypeFilter: (problemType: ProblemTypeFilter) => void;
  resetPracticePreferences: () => void;
  advanceProblem: () => void;
  recordAttempt: (problemId: string, userAnswer: string, isCorrect: boolean) => void;
  markSolutionViewed: (problemId: string) => void;
  resetProgress: () => void;
  clearAllData: () => void;
  getCurrentProblem: () => ProblemApiData | null;
  getFilteredProblemCount: () => number;
  getCurrentProblemPosition: () => number | null;
  getAvailableProblemTypes: () => string[];
}

interface PracticeSelectionState {
  currentProblemIndex: number;
  selectedDifficulty: DifficultyFilter;
  selectedProblemType: ProblemTypeFilter;
}

const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  get length() {
    return 0;
  },
};

const problemSource = new S3ProblemSource();
const syncCache = new SyncCache();

function getEligibleIndices(
  batch: ProblemBatchApiResponse | null,
  selection: Pick<PracticeSelectionState, 'selectedDifficulty' | 'selectedProblemType'>,
  problemAttempts: Record<string, ProblemAttemptState>,
): number[] {
  if (!batch) {
    return [];
  }

  const filtered = getFilteredProblemIndices(batch, {
    difficulty: selection.selectedDifficulty,
    problemType: selection.selectedProblemType,
  });

  return filtered.filter((problemIndex) => {
    const problem = batch.problems[problemIndex];
    const problemId = problem.id ?? `${problem.problemType}-${problemIndex}`;
    return problemAttempts[problemId]?.isCorrect !== true;
  });
}

function randomFromArray(values: number[]): number {
  return values[Math.floor(Math.random() * values.length)];
}

function chooseInitialProblemIndex(
  batch: ProblemBatchApiResponse | null,
  selection: Pick<PracticeSelectionState, 'selectedDifficulty' | 'selectedProblemType'>,
  problemAttempts: Record<string, ProblemAttemptState>,
): number {
  const eligible = getEligibleIndices(batch, selection, problemAttempts);
  if (eligible.length === 0) {
    return -1;
  }

  return randomFromArray(eligible);
}

function chooseNextProblemIndex(
  batch: ProblemBatchApiResponse | null,
  selection: PracticeSelectionState,
  problemAttempts: Record<string, ProblemAttemptState>,
): number {
  const eligible = getEligibleIndices(batch, selection, problemAttempts);
  if (eligible.length === 0) {
    return -1;
  }

  if (eligible.length === 1) {
    return eligible[0];
  }

  let next = randomFromArray(eligible);
  while (next === selection.currentProblemIndex) {
    next = randomFromArray(eligible);
  }

  return next;
}

function keepOrRecomputeCurrentIndex(
  batch: ProblemBatchApiResponse | null,
  selection: PracticeSelectionState,
  problemAttempts: Record<string, ProblemAttemptState>,
): number {
  const eligible = getEligibleIndices(batch, selection, problemAttempts);
  if (eligible.length === 0) {
    return -1;
  }

  if (eligible.includes(selection.currentProblemIndex)) {
    return selection.currentProblemIndex;
  }

  return randomFromArray(eligible);
}

export const useAlgebraStore = create<AlgebraState>()(
  persist(
    (set, get) => ({
      batch: null,
      latestInfo: null,
      currentProblemIndex: -1,
      problemAttempts: {},
      problemsAttempted: 0,
      problemsCorrect: 0,
      selectedDifficulty: 'all',
      selectedProblemType: 'all',
      lastProblemHash: null,
      lastSyncTimestamp: null,
      isSyncing: false,
      syncError: null,
      isInitialized: false,
      isHydrated: false,

      setHydrated: (value) => set({ isHydrated: value }),

      initialize: async () => {
        if (get().isInitialized) {
          return;
        }

        set({ isInitialized: true });

        const cachedHash = syncCache.getLastProblemHash();
        const cachedTimestamp = syncCache.getLastSyncTimestamp();

        if (cachedHash || cachedTimestamp) {
          set((state) => ({
            lastProblemHash: cachedHash ?? state.lastProblemHash,
            lastSyncTimestamp: cachedTimestamp ?? state.lastSyncTimestamp,
          }));
        }

        await get().syncProblems(false);
      },

      syncProblems: async (force = false) => {
        set({ isSyncing: true, syncError: null });

        try {
          const latestUrl = getProblemsLatestUrl();

          await problemSource.headLatest(latestUrl);

          const latestInfo = await problemSource.fetchLatest(latestUrl);
          const previousHash = get().lastProblemHash ?? syncCache.getLastProblemHash();
          const currentBatchId = get().batch?.id;

          const isUpToDate =
            !force &&
            Boolean(previousHash) &&
            previousHash === latestInfo.hash &&
            currentBatchId === latestInfo.batchId;

          const timestamp = new Date().toISOString();

          if (isUpToDate) {
            set({
              latestInfo,
              lastSyncTimestamp: timestamp,
              isSyncing: false,
              syncError: null,
            });

            syncCache.setLastSyncTimestamp(timestamp);

            return {
              updated: false,
              message: 'Your problem library is already up to date.',
            };
          }

          const batch = await problemSource.fetchBatch(latestInfo.url);
          const shouldResetAttempts = get().batch?.id !== batch.id;

          set((state) => {
            const selection: PracticeSelectionState = {
              currentProblemIndex: state.currentProblemIndex,
              selectedDifficulty: state.selectedDifficulty,
              selectedProblemType: state.selectedProblemType,
            };

            const nextCurrentProblemIndex = shouldResetAttempts
              ? chooseInitialProblemIndex(batch, selection, {})
              : keepOrRecomputeCurrentIndex(batch, selection, state.problemAttempts);

            return {
              batch,
              latestInfo,
              currentProblemIndex: nextCurrentProblemIndex,
              problemAttempts: shouldResetAttempts ? {} : state.problemAttempts,
              lastProblemHash: latestInfo.hash,
              lastSyncTimestamp: timestamp,
              isSyncing: false,
              syncError: null,
            };
          });

          syncCache.setLastProblemHash(latestInfo.hash);
          syncCache.setLastSyncTimestamp(timestamp);
          syncCache.setLatestBatchMetadata({
            batchId: latestInfo.batchId,
            generatedAt: latestInfo.generatedAt,
            problemCount: latestInfo.problemCount,
          });

          return {
            updated: true,
            message: 'Problem library updated.',
          };
        } catch (error) {
          console.error('Problem library update failed:', error);
          const message = 'Could not update the problem library. Check your connection and try again.';

          set({
            isSyncing: false,
            syncError: message,
          });

          return {
            updated: false,
            message,
          };
        }
      },

      setDifficultyFilter: (difficulty) => {
        set((state) => {
          const selection: PracticeSelectionState = {
            currentProblemIndex: state.currentProblemIndex,
            selectedDifficulty: difficulty,
            selectedProblemType: state.selectedProblemType,
          };

          return {
            selectedDifficulty: difficulty,
            currentProblemIndex: keepOrRecomputeCurrentIndex(
              state.batch,
              selection,
              state.problemAttempts,
            ),
          };
        });
      },

      setProblemTypeFilter: (problemType) => {
        set((state) => {
          const selection: PracticeSelectionState = {
            currentProblemIndex: state.currentProblemIndex,
            selectedDifficulty: state.selectedDifficulty,
            selectedProblemType: problemType,
          };

          return {
            selectedProblemType: problemType,
            currentProblemIndex: keepOrRecomputeCurrentIndex(
              state.batch,
              selection,
              state.problemAttempts,
            ),
          };
        });
      },

      resetPracticePreferences: () => {
        set((state) => {
          const selection: PracticeSelectionState = {
            currentProblemIndex: state.currentProblemIndex,
            selectedDifficulty: 'all',
            selectedProblemType: 'all',
          };

          return {
            selectedDifficulty: 'all',
            selectedProblemType: 'all',
            currentProblemIndex: keepOrRecomputeCurrentIndex(
              state.batch,
              selection,
              state.problemAttempts,
            ),
          };
        });
      },

      advanceProblem: () => {
        set((state) => ({
          currentProblemIndex: chooseNextProblemIndex(state.batch, {
            currentProblemIndex: state.currentProblemIndex,
            selectedDifficulty: state.selectedDifficulty,
            selectedProblemType: state.selectedProblemType,
          }, state.problemAttempts),
        }));
      },

      recordAttempt: (problemId, userAnswer, isCorrect) => {
        set((state) => {
          const previous = state.problemAttempts[problemId];
          const alreadyCompleted = previous?.isCompleted ?? false;

          return {
            problemAttempts: {
              ...state.problemAttempts,
              [problemId]: {
                attempts: (previous?.attempts ?? 0) + 1,
                isCompleted: true,
                isCorrect,
                userAnswer,
                solutionViewed: previous?.solutionViewed ?? false,
              },
            },
            problemsAttempted: state.problemsAttempted + (alreadyCompleted ? 0 : 1),
            problemsCorrect:
              state.problemsCorrect + (alreadyCompleted || !isCorrect ? 0 : 1),
          };
        });
      },

      markSolutionViewed: (problemId) => {
        set((state) => {
          const previous = state.problemAttempts[problemId];

          return {
            problemAttempts: {
              ...state.problemAttempts,
              [problemId]: {
                attempts: previous?.attempts ?? 0,
                isCompleted: previous?.isCompleted ?? false,
                isCorrect: previous?.isCorrect ?? false,
                userAnswer: previous?.userAnswer,
                solutionViewed: true,
              },
            },
          };
        });
      },

      resetProgress: () => {
        set((state) => ({
          currentProblemIndex: keepOrRecomputeCurrentIndex(state.batch, {
            currentProblemIndex: state.currentProblemIndex,
            selectedDifficulty: state.selectedDifficulty,
            selectedProblemType: state.selectedProblemType,
          }, {}),
          problemAttempts: {},
          problemsAttempted: 0,
          problemsCorrect: 0,
        }));
      },

      clearAllData: () => {
        syncCache.clear();

        set((state) => ({
          batch: null,
          latestInfo: null,
          currentProblemIndex: -1,
          problemAttempts: {},
          problemsAttempted: 0,
          problemsCorrect: 0,
          selectedDifficulty: state.selectedDifficulty,
          selectedProblemType: state.selectedProblemType,
          lastProblemHash: null,
          lastSyncTimestamp: null,
          syncError: null,
        }));
      },

      getCurrentProblem: () => {
        const { batch, currentProblemIndex } = get();
        if (!batch || currentProblemIndex < 0) {
          return null;
        }

        return batch.problems[currentProblemIndex] ?? null;
      },

      getFilteredProblemCount: () => {
        const state = get();
        return getEligibleIndices(state.batch, {
          selectedDifficulty: state.selectedDifficulty,
          selectedProblemType: state.selectedProblemType,
        }, state.problemAttempts).length;
      },

      getCurrentProblemPosition: () => {
        const state = get();
        if (!state.batch || state.currentProblemIndex < 0) {
          return null;
        }

        const eligible = getEligibleIndices(state.batch, {
          selectedDifficulty: state.selectedDifficulty,
          selectedProblemType: state.selectedProblemType,
        }, state.problemAttempts);

        const position = eligible.indexOf(state.currentProblemIndex);
        return position >= 0 ? position + 1 : null;
      },

      getAvailableProblemTypes: () => {
        return getProblemTypeOptions(get().batch);
      },
    }),
    {
      name: 'algebra-flow-web-store-v1',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : noopStorage,
      ),
      partialize: (state) => ({
        batch: state.batch,
        latestInfo: state.latestInfo,
        currentProblemIndex: state.currentProblemIndex,
        problemAttempts: state.problemAttempts,
        problemsAttempted: state.problemsAttempted,
        problemsCorrect: state.problemsCorrect,
        selectedDifficulty: state.selectedDifficulty,
        selectedProblemType: state.selectedProblemType,
        lastProblemHash: state.lastProblemHash,
        lastSyncTimestamp: state.lastSyncTimestamp,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
