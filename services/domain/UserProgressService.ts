import { logger } from '@/utils/logger';
import { repositoryFactory, UpdateUserProgressInput, UserProgress } from '../../repositories';
import { ProblemBatchService } from './ProblemBatchService';

/**
 * High-level service for user progress-related business operations.
 * This service encapsulates business logic and uses repositories for data access.
 */
export class UserProgressService {
  private progressRepo = repositoryFactory.userProgressRepository();
  private batchService = new ProblemBatchService();

  /**
   * Get current user progress, initializing if it doesn't exist
   */
  async getUserProgress(): Promise<UserProgress> {
    let progress = await this.progressRepo.get();
    if (!progress) {
      progress = await this.progressRepo.initialize();
    }
    return progress;
  }

  /**
   * Update user progress with new values
   */
  async updateProgress(updates: UpdateUserProgressInput): Promise<UserProgress> {
    const updatedProgress = await this.progressRepo.update(updates);

    if (updates.currentBatchId) {
      logger.info(`User moved to batch ${updates.currentBatchId}`);
    }

    return updatedProgress;
  }

  /**
   * Record that a problem was attempted (correct or incorrect)
   */
  async recordProblemAttempt(isCorrect: boolean): Promise<UserProgress> {
    const currentProgress = await this.getUserProgress();

    const updates: UpdateUserProgressInput = {
      problemsAttempted: currentProgress.problemsAttempted + 1,
      problemsCorrect: currentProgress.problemsCorrect + (isCorrect ? 1 : 0)
    };

    const updatedProgress = await this.progressRepo.update(updates);

    logger.info(`Problem attempt recorded: ${isCorrect ? 'correct' : 'incorrect'}`);
    return updatedProgress;
  }

  /**
   * Set the current batch for the user
   */
  async setCurrentBatch(batchId: string): Promise<UserProgress> {
    const batch = await this.batchService.getBatchById(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} does not exist`);
    }

    return await this.updateProgress({ currentBatchId: batchId });
  }

  /**
   * Move to the next available batch with unsolved problems
   */
  async moveToNextBatch(): Promise<UserProgress | null> {
    const currentProgress = await this.getUserProgress();
    const nextBatch = await this.batchService.getNextBatchWithProblems(currentProgress.currentBatchId || undefined);

    if (!nextBatch) {
      logger.info('No more batches with unsolved problems available');
      return null;
    }

    return await this.updateProgress({ currentBatchId: nextBatch.id });
  }

  /**
   * Set the sync timestamp to track when data was last synchronized
   */
  async updateSyncTimestamp(timestamp?: Date): Promise<UserProgress> {
    return await this.updateProgress({
      lastSyncTimestamp: timestamp || new Date()
    });
  }

  /**
   * Reset user progress to initial state
   */
  async resetProgress(): Promise<UserProgress> {
    const resetProgress = await this.progressRepo.reset();
    logger.info('User progress reset to initial state');
    return resetProgress;
  }

  /**
   * Get user's overall statistics
   */
  async getUserStatistics(): Promise<{
    problemsAttempted: number;
    problemsCorrect: number;
    problemsIncorrect: number;
    accuracyPercentage: number;
    currentBatchId: string | null;
    lastSyncTimestamp: Date | null;
  }> {
    const progress = await this.getUserProgress();
    const problemsIncorrect = progress.problemsAttempted - progress.problemsCorrect;
    const accuracyPercentage = progress.problemsAttempted > 0
      ? (progress.problemsCorrect / progress.problemsAttempted) * 100
      : 0;

    return {
      problemsAttempted: progress.problemsAttempted,
      problemsCorrect: progress.problemsCorrect,
      problemsIncorrect,
      accuracyPercentage,
      currentBatchId: progress.currentBatchId || null,
      lastSyncTimestamp: progress.lastSyncTimestamp || null
    };
  }

  /**
   * Check if user needs a batch assignment (no current batch or current batch is complete)
   */
  async needsBatchAssignment(): Promise<boolean> {
    const progress = await this.getUserProgress();

    if (!progress.currentBatchId) {
      return true;
    }

    // Check if current batch has any unsolved problems
    const batchDetails = await this.batchService.getBatchDetails(progress.currentBatchId);
    if (!batchDetails) {
      return true; // Batch doesn't exist anymore
    }

    return batchDetails.problemCounts.remaining === 0;
  }

  /**
   * Auto-assign the user to the next appropriate batch
   */
  async autoAssignBatch(): Promise<UserProgress | null> {
    const progress = await this.getUserProgress();

    // If user already has a batch with remaining problems, keep them there
    if (progress.currentBatchId) {
      const batchDetails = await this.batchService.getBatchDetails(progress.currentBatchId);
      if (batchDetails && batchDetails.problemCounts.remaining > 0) {
        logger.info(`User staying in current batch ${progress.currentBatchId}`);
        return progress;
      }
    }

    // Move to next batch with problems
    return await this.moveToNextBatch();
  }

  /**
   * Get progress summary for the current batch
   */
  async getCurrentBatchProgress(): Promise<{
    batchId: string;
    total: number;
    completed: number;
    remaining: number;
    progressPercentage: number;
  } | null> {
    const progress = await this.getUserProgress();

    if (!progress.currentBatchId) {
      return null;
    }

    const batchDetails = await this.batchService.getBatchDetails(progress.currentBatchId);
    if (!batchDetails) {
      return null;
    }

    return {
      batchId: progress.currentBatchId,
      total: batchDetails.problemCounts.total,
      completed: batchDetails.problemCounts.completed,
      remaining: batchDetails.problemCounts.remaining,
      progressPercentage: batchDetails.problemCounts.total > 0
        ? (batchDetails.problemCounts.completed / batchDetails.problemCounts.total) * 100
        : 0
    };
  }
}
