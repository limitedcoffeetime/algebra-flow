// Main database service - Clean and simple interface for the app
import { getDBConnection } from './db';
import { getDummyBatchAndProblemsInput } from './dummyData';
import { mockDb } from './mockDb';
import * as problemBatchService from './problemBatchService';
import * as problemService from './problemService';
import * as userProgressService from './userProgressService';

// Re-export types
export * from './schema';

// Check if we should use mock database
// For now, let's always use mock DB in development to avoid SQLite issues
const USE_MOCK_DB = process.env.EXPO_PUBLIC_USE_MOCK_DB === 'true';

// To use real SQLite:
// 1. Change USE_MOCK_DB to false
// 2. Run: npx expo run:ios (for local build)
// 3. OR: Create an EAS development build

// To temporarily use mock DB even with a development build:
// EXPO_PUBLIC_USE_MOCK_DB=true npx expo start

// Function to get current database type
export function getDatabaseType(): 'Mock Database' | 'SQLite' {
  return USE_MOCK_DB ? 'Mock Database' : 'SQLite';
}

// Database initialization
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    await getDBConnection(); // This creates tables if they don't exist

    // Initialize user progress if it doesn't exist
    await userProgressService.initializeUserProgress();

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Seed with dummy data (for development) - Now loads from JSON
export async function seedDummyData() {
  try {
    console.log('Seeding dummy data from JSON file...');

    // Check if we already have data
    const existingBatches = await problemBatchService.getAllProblemBatches();
    if (existingBatches.length > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }

    // Load data from JSON file
    const dummyBatchAndProblemsInput = await getDummyBatchAndProblemsInput();

    // Add dummy batches
    for (const batchData of dummyBatchAndProblemsInput) {
      await problemBatchService.addProblemBatch(
        batchData.batch,
        batchData.problems
      );
    }

    console.log('Dummy data seeded successfully from JSON file');
  } catch (error) {
    console.error('Failed to seed dummy data:', error);
  }
}

// Export the appropriate database implementation
export const db = USE_MOCK_DB ? mockDb : {
  // Initialize
  init: initializeDatabase,
  seedDummy: seedDummyData,

  // Problem Batches
  addBatch: problemBatchService.addProblemBatch,
  getLatestBatch: problemBatchService.getLatestProblemBatch,
  getAllBatches: problemBatchService.getAllProblemBatches,
  getBatchById: problemBatchService.getProblemBatchById,

  // Problems
  getProblemsByBatch: problemService.getProblemsByBatchId,
  getUnsolvedProblems: problemService.getUnsolvedProblemsByBatchId,
  getProblemById: problemService.getProblemById,
  updateProblem: problemService.updateProblem,

  // User Progress
  getUserProgress: userProgressService.getUserProgress,
  updateUserProgress: userProgressService.updateUserProgress,
  resetUserProgress: async () => {
    // Reset all problems back to unsolved
    await problemService.resetAllProblems();
    // Reset user progress stats
    return await userProgressService.resetUserProgress();
  },

  // Utility function to get next problem for user
  async getNextProblem() {
    let progress = await userProgressService.getUserProgress();

    // If no current batch, default to the latest batch
    if (!progress?.currentBatchId) {
      const latestBatch = await problemBatchService.getLatestProblemBatch();
      if (!latestBatch) return null;

      await userProgressService.updateUserProgress({
        currentBatchId: latestBatch.id,
      });
      progress = await userProgressService.getUserProgress();
    }

    if (!progress?.currentBatchId) {
      return null;
    }

    // Try to get next unsolved problem from the current batch
    let problems = await problemService.getUnsolvedProblemsByBatchId(progress.currentBatchId, 1);
    if (problems.length > 0) {
      return problems[0];
    }

    // No problems left in current batch. Try to move to the next available batch
    const batches = await problemBatchService.getAllProblemBatches();
    const currentIndex = batches.findIndex((b) => b.id === progress!.currentBatchId);
    for (let i = currentIndex + 1; i < batches.length; i++) {
      problems = await problemService.getUnsolvedProblemsByBatchId(batches[i].id, 1);
      if (problems.length > 0) {
        await userProgressService.updateUserProgress({ currentBatchId: batches[i].id });
        return problems[0];
      }
    }

    // No more problems in any batch
    return null;
  },

  // Submit answer and update progress
  async submitAnswer(problemId: string, userAnswer: string, isCorrect: boolean) {
    // Update the problem
    await problemService.updateProblem(problemId, {
      isCompleted: true,
      userAnswer: userAnswer
    });

    // Update user progress
    const progress = await userProgressService.getUserProgress();
    if (progress) {
      await userProgressService.updateUserProgress({
        problemsAttempted: progress.problemsAttempted + 1,
        problemsCorrect: progress.problemsCorrect + (isCorrect ? 1 : 0)
      });
    }
  },

  // Get accuracy stats by topic
  async getTopicAccuracyStats() {
    return await problemService.getTopicAccuracyStats();
  }
};
