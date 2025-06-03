// Mock database for development - avoids SQLite native module issues
import { dummyBatchAndProblemsInput } from './dummyData';
import { Problem, ProblemBatch, UserProgress } from './schema';

// In-memory storage
let problems: Problem[] = [];
let batches: ProblemBatch[] = [];
let userProgress: UserProgress | null = null;

// Initialize with dummy data
function initializeMockData() {
  batches = [];
  problems = [];

  dummyBatchAndProblemsInput.forEach((data, index) => {
    const batchId = `batch-${index + 1}`;
    const now = new Date().toISOString();
    batches.push({
      ...data.batch,
      id: batchId,
      importedAt: now
    });

    data.problems.forEach((problem, pIndex) => {
      problems.push({
        ...problem,
        id: `${batchId}-problem-${pIndex + 1}`,
        batchId,
        isCompleted: false,
        userAnswer: null,
        createdAt: now,
        updatedAt: now
      });
    });
  });

  const now = new Date().toISOString();
  userProgress = {
    id: 'user-1',
    currentBatchId: batches[0]?.id || null,
    problemsAttempted: 0,
    problemsCorrect: 0,
    createdAt: now,
    updatedAt: now
  };
}

export const mockDb = {
  async init() {
    console.log('Initializing mock database...');
    initializeMockData();
    return true;
  },

  async seedDummy() {
    console.log('Mock database already seeded');
  },

  async getLatestBatch() {
    return batches[batches.length - 1] || null;
  },

  async getAllBatches() {
    return batches;
  },

  async getBatchById(id: string) {
    return batches.find(b => b.id === id) || null;
  },

  async getProblemsByBatch(batchId: string) {
    return problems.filter(p => p.batchId === batchId);
  },

  async getUnsolvedProblems(batchId: string, limit?: number) {
    const unsolved = problems.filter(p => p.batchId === batchId && !p.isCompleted);
    return limit ? unsolved.slice(0, limit) : unsolved;
  },

  async getProblemById(id: string) {
    return problems.find(p => p.id === id) || null;
  },

  async updateProblem(id: string, updates: Partial<Problem>) {
    const index = problems.findIndex(p => p.id === id);
    if (index >= 0) {
      problems[index] = { ...problems[index], ...updates };
    }
  },

  async getUserProgress() {
    return userProgress;
  },

  async updateUserProgress(updates: Partial<UserProgress>) {
    if (userProgress) {
      userProgress = { ...userProgress, ...updates };
    }
  },

  async resetUserProgress() {
    if (userProgress) {
      userProgress.problemsAttempted = 0;
      userProgress.problemsCorrect = 0;
    }

    // Also reset all problems back to unsolved
    problems.forEach(problem => {
      problem.isCompleted = false;
      problem.userAnswer = null;
    });
  },

  async getNextProblem() {
    if (!userProgress?.currentBatchId) {
      const latestBatch = batches[batches.length - 1];
      if (latestBatch) {
        userProgress = {
          ...userProgress!,
          currentBatchId: latestBatch.id
        };
      }
    }

    const unsolved = problems.find(p =>
      p.batchId === userProgress?.currentBatchId && !p.isCompleted
    );
    return unsolved || null;
  },

  async submitAnswer(problemId: string, userAnswer: string, isCorrect: boolean) {
    await this.updateProblem(problemId, {
      isCompleted: true,
      userAnswer
    });

    if (userProgress) {
      await this.updateUserProgress({
        problemsAttempted: userProgress.problemsAttempted + 1,
        problemsCorrect: userProgress.problemsCorrect + (isCorrect ? 1 : 0)
      });
    }
  },

  // Add batch function for completeness
  async addBatch(batch: Omit<ProblemBatch, 'id' | 'importedAt'>, problemsData: Omit<Problem, 'id' | 'batchId' | 'isCompleted' | 'userAnswer' | 'createdAt' | 'updatedAt'>[]) {
    const batchId = `batch-${batches.length + 1}`;
    const now = new Date().toISOString();
    const newBatch: ProblemBatch = {
      ...batch,
      id: batchId,
      importedAt: now
    };
    batches.push(newBatch);

    problemsData.forEach((problem, index) => {
      problems.push({
        ...problem,
        id: `${batchId}-problem-${index + 1}`,
        batchId,
        isCompleted: false,
        userAnswer: null,
        createdAt: now,
        updatedAt: now
      });
    });

    return newBatch;
  }
};
