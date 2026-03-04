'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getProblemsLatestUrl } from '@/lib/env';
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
  lastProblemHash: string | null;
  lastSyncTimestamp: string | null;
  isSyncing: boolean;
  syncError: string | null;
  isInitialized: boolean;
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  initialize: () => Promise<void>;
  syncProblems: (force?: boolean) => Promise<SyncResult>;
  advanceProblem: () => void;
  recordAttempt: (problemId: string, userAnswer: string, isCorrect: boolean) => void;
  markSolutionViewed: (problemId: string) => void;
  resetProgress: () => void;
  clearAllData: () => void;
  getCurrentProblem: () => ProblemApiData | null;
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

export const useAlgebraStore = create<AlgebraState>()(
  persist(
    (set, get) => ({
      batch: null,
      latestInfo: null,
      currentProblemIndex: 0,
      problemAttempts: {},
      problemsAttempted: 0,
      problemsCorrect: 0,
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

        // Prime sync metadata from dedicated cache keys if available.
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

          // HEAD preflight for better diagnostics on CORS/network issues.
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
              message: 'Already up to date.',
            };
          }

          const batch = await problemSource.fetchBatch(latestInfo.url);
          const shouldResetAttempts = get().batch?.id !== batch.id;

          set((state) => ({
            batch,
            latestInfo,
            currentProblemIndex: shouldResetAttempts
              ? 0
              : Math.min(state.currentProblemIndex, Math.max(batch.problems.length - 1, 0)),
            problemAttempts: shouldResetAttempts ? {} : state.problemAttempts,
            lastProblemHash: latestInfo.hash,
            lastSyncTimestamp: timestamp,
            isSyncing: false,
            syncError: null,
          }));

          syncCache.setLastProblemHash(latestInfo.hash);
          syncCache.setLastSyncTimestamp(timestamp);
          syncCache.setLatestBatchMetadata({
            batchId: latestInfo.batchId,
            generatedAt: latestInfo.generatedAt,
            problemCount: latestInfo.problemCount,
          });

          return {
            updated: true,
            message: 'Downloaded the latest problem batch.',
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to sync problems.';

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

      advanceProblem: () => {
        set((state) => {
          const total = state.batch?.problems.length ?? 0;
          if (total === 0) {
            return state;
          }

          return {
            currentProblemIndex: (state.currentProblemIndex + 1) % total,
          };
        });
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
        set({
          currentProblemIndex: 0,
          problemAttempts: {},
          problemsAttempted: 0,
          problemsCorrect: 0,
        });
      },

      clearAllData: () => {
        syncCache.clear();

        set({
          batch: null,
          latestInfo: null,
          currentProblemIndex: 0,
          problemAttempts: {},
          problemsAttempted: 0,
          problemsCorrect: 0,
          lastProblemHash: null,
          lastSyncTimestamp: null,
          syncError: null,
        });
      },

      getCurrentProblem: () => {
        const { batch, currentProblemIndex } = get();
        if (!batch || batch.problems.length === 0) {
          return null;
        }

        return batch.problems[currentProblemIndex] ?? null;
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
        lastProblemHash: state.lastProblemHash,
        lastSyncTimestamp: state.lastSyncTimestamp,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
