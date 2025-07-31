import { Problem } from '@/repositories';
import { databaseService } from '@/services/domain';
import { ErrorStrategy, handleError } from '@/utils/errorHandler';
import { create } from 'zustand';

interface ProblemStore {
  // State
  currentProblem: Problem | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadNextProblem: () => Promise<void>;
  submitAnswer: (userAnswer: string) => Promise<{
    isCorrect: boolean;
    needsFeedback: boolean;
    feedbackMessage?: string;
    problem: Problem | null;
  }>;
  clearError: () => void;
}

export const useProblemStore = create<ProblemStore>((set, get) => ({
  // Initial state
  currentProblem: null,
  isLoading: false,
  error: null,

  // Actions
  loadNextProblem: async () => {
    set({ isLoading: true, error: null });
    try {
      const problem = await databaseService.getNextProblem();

      if (problem) {
        set({ currentProblem: problem, isLoading: false });
      } else {
        set({ error: 'No more problems available!', isLoading: false });
      }
    } catch (error) {
      const errorMessage = handleError(error, 'Failed to load problem', ErrorStrategy.RETURN_NULL);
      set({ error: 'Failed to load problem', isLoading: false });
    }
  },

  submitAnswer: async (userAnswer: string) => {
    const { currentProblem } = get();
    if (!currentProblem) {
      throw new Error('No current problem to submit answer for');
    }

    try {
      const result = await databaseService.submitAnswer(currentProblem.id, userAnswer);

      // Update current problem with completed state
      set({
        currentProblem: result.problem,
        error: null
      });

      return result;
    } catch (error) {
      handleError(error, 'Failed to submit answer', ErrorStrategy.THROW);
      throw error; // Re-throw for caller to handle
    }
  },

  clearError: () => set({ error: null })
}));
