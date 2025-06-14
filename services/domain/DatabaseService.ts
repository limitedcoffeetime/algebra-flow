import { logger } from '@/utils/logger';
import { Problem, repositoryFactory } from '../../repositories';
import { isAnswerCorrect } from '../../utils/enhancedAnswerUtils';
import { ProblemBatchService } from './ProblemBatchService';
import { ProblemService } from './ProblemService';
import { UserProgressService } from './UserProgressService';

/**
 * Main database service that provides a unified interface for all database operations.
 * This service combines all domain services and provides high-level business operations.
 *
 * This is the main interface that sync services and state management should use.
 */
export class DatabaseService {
  private problemService = new ProblemService();
  private batchService = new ProblemBatchService();
  private userProgressService = new UserProgressService();

  /**
   * Initialize the database and all services
   */
  async initialize(): Promise<boolean> {
    try {
      const initialized = await repositoryFactory.initialize();
      if (initialized) {
        logger.info('Database service initialized successfully');
      }
      return initialized;
    } catch (error) {
      logger.error('Failed to initialize database service:', error);
      return false;
    }
  }

  /**
   * Close database connections and cleanup
   */
  async close(): Promise<void> {
    await repositoryFactory.close();
    logger.info('Database service closed');
  }

  // Problem Service Methods
  get problems() {
    return {
      getById: (id: string) => this.problemService.getProblemById(id),
      getByBatch: (batchId: string) => this.problemService.getProblemsByBatch(batchId),
      getUnsolved: (batchId: string, limit?: number) => this.problemService.getUnsolvedProblems(batchId, limit),
      getCompleted: (batchId: string) => this.problemService.getCompletedProblems(batchId),
      create: (problem: any) => this.problemService.createProblem(problem),
      createMany: (problems: any[]) => this.problemService.createProblems(problems),
      update: (id: string, updates: any) => this.problemService.updateProblem(id, updates),
      submitAnswer: (problemId: string, userAnswer: string | number, isCorrect: boolean) =>
        this.problemService.submitAnswer(problemId, userAnswer, isCorrect),
      markSolutionShown: (problemId: string) => this.problemService.markSolutionStepsShown(problemId),
      resetAll: () => this.problemService.resetAllProblems(),
      getBatchCounts: (batchId: string) => this.problemService.getBatchProblemCounts(batchId),
      getAccuracyStats: () => this.problemService.getAccuracyStatistics(),
      delete: (id: string) => this.problemService.deleteProblem(id)
    };
  }

  // Batch Service Methods
  get batches() {
    return {
      getById: (id: string) => this.batchService.getBatchById(id),
      getAll: () => this.batchService.getAllBatches(),
      getLatest: () => this.batchService.getLatestBatch(),
      create: (batch: any) => this.batchService.createBatch(batch),
      import: (batchData: any) => this.batchService.importBatch(batchData),
      delete: (id: string) => this.batchService.deleteBatch(id),
      deleteMany: (ids: string[]) => this.batchService.deleteBatches(ids),
      deleteAll: () => this.batchService.deleteAllBatches(),
      cleanupOrphaned: (validIds: string[]) => this.batchService.cleanupOrphanedBatches(validIds),
      getStatistics: () => this.batchService.getBatchStatistics(),
      getDetails: (batchId: string) => this.batchService.getBatchDetails(batchId),
      existsForDate: (date: Date) => this.batchService.batchExistsForDate(date),
      getProgressSummary: () => this.batchService.getBatchProgressSummary(),
      getNextWithProblems: (currentBatchId?: string) => this.batchService.getNextBatchWithProblems(currentBatchId)
    };
  }

  // User Progress Service Methods
  get userProgress() {
    return {
      get: () => this.userProgressService.getUserProgress(),
      update: (updates: any) => this.userProgressService.updateProgress(updates),
      recordAttempt: (isCorrect: boolean) => this.userProgressService.recordProblemAttempt(isCorrect),
      setCurrentBatch: (batchId: string) => this.userProgressService.setCurrentBatch(batchId),
      moveToNextBatch: () => this.userProgressService.moveToNextBatch(),
      updateSyncTimestamp: (timestamp?: Date) => this.userProgressService.updateSyncTimestamp(timestamp),
      reset: () => this.userProgressService.resetProgress(),
      getStatistics: () => this.userProgressService.getUserStatistics(),
      needsBatchAssignment: () => this.userProgressService.needsBatchAssignment(),
      autoAssignBatch: () => this.userProgressService.autoAssignBatch(),
      getCurrentBatchProgress: () => this.userProgressService.getCurrentBatchProgress()
    };
  }

  /**
   * High-level operation: Get the next problem for the user to solve
   */
  async getNextProblem(): Promise<Problem | null> {
    const progress = await this.userProgressService.getUserProgress();

    // Auto-assign batch if needed
    if (!progress.currentBatchId || await this.userProgressService.needsBatchAssignment()) {
      const updatedProgress = await this.userProgressService.autoAssignBatch();
      if (!updatedProgress?.currentBatchId) {
        logger.info('No batches available with unsolved problems');
        return null;
      }
    }

    // Get next unsolved problem from current batch
    const currentProgress = await this.userProgressService.getUserProgress();
    if (!currentProgress.currentBatchId) {
      return null;
    }

    const unsolvedProblems = await this.problemService.getUnsolvedProblems(currentProgress.currentBatchId, 1);
    return unsolvedProblems.length > 0 ? unsolvedProblems[0] : null;
  }

  /**
   * High-level operation: Submit an answer and update progress
   */
  async submitAnswer(problemId: string, userAnswer: string): Promise<{
    isCorrect: boolean;
    problem: Problem | null;
  }> {
    const problem = await this.problemService.getProblemById(problemId);
    if (!problem) {
      throw new Error(`Problem ${problemId} not found`);
    }

    // Validate the answer
    const isCorrect = await isAnswerCorrect(userAnswer, problem.answer);

    // Update problem with user's answer
    await this.problemService.submitAnswer(problemId, userAnswer, isCorrect);

    // Record attempt in user progress
    await this.userProgressService.recordProblemAttempt(isCorrect);

    logger.info(`Answer submitted for problem ${problemId}: ${isCorrect ? 'correct' : 'incorrect'}`);

    return {
      isCorrect,
      problem: await this.problemService.getProblemById(problemId) // Return updated problem
    };
  }

  /**
   * High-level operation: Reset all user progress and problems
   */
  async resetEverything(): Promise<void> {
    await this.problemService.resetAllProblems();
    await this.userProgressService.resetProgress();
    logger.info('All progress and problems reset');
  }

  /**
   * High-level operation: Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<{
    userStats: any;
    currentBatchProgress: any;
    overallStats: any;
    accuracyStats: any[];
  }> {
    const [userStats, currentBatchProgress, overallStats, accuracyStats] = await Promise.all([
      this.userProgressService.getUserStatistics(),
      this.userProgressService.getCurrentBatchProgress(),
      this.batchService.getBatchStatistics(),
      this.problemService.getAccuracyStatistics()
    ]);

    return {
      userStats,
      currentBatchProgress,
      overallStats,
      accuracyStats
    };
  }

  /**
   * High-level operation: Seed with dummy data for development
   */
  async seedDummyData(): Promise<void> {
    // Check if we already have data
    const existingBatches = await this.batchService.getAllBatches();
    if (existingBatches.length > 0) {
      logger.info('Database already has data, skipping seed');
      return;
    }

        // Import dummy data from the original database module
    const { getDummyBatchAndProblemsInput } = await import('../database/dummyData.js');
    const dummyBatchAndProblemsInput = await getDummyBatchAndProblemsInput();

        // Import dummy batches
    for (const batchData of dummyBatchAndProblemsInput) {
      // Convert string date to Date object
      const batchInput = {
        ...batchData.batch,
        generationDate: new Date(batchData.batch.generationDate)
      };

      const batchId = await this.batchService.createBatch(batchInput);

      // Add problems to the batch
      const problemsWithBatchId = batchData.problems.map((problem: any) => ({
        ...problem,
        batchId
      }));

      await this.problemService.createProblems(problemsWithBatchId);
    }

    logger.info('Dummy data seeded successfully');
  }
}
