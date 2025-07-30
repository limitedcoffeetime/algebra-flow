import { logger } from '@/utils/logger';
import { BatchStatistics, CreateProblemBatchInput, ImportResult, ProblemBatch, repositoryFactory } from '../../repositories';
import { ProblemService } from './ProblemService';

/**
 * High-level service for problem batch-related business operations.
 * This service encapsulates business logic and uses repositories for data access.
 */
export class ProblemBatchService {
  private batchRepo = repositoryFactory.problemBatchRepository();
  private problemService = new ProblemService();

  /**
   * Get a batch by its ID
   */
  async getBatchById(id: string): Promise<ProblemBatch | null> {
    return await this.batchRepo.findById(id);
  }

  /**
   * Get all batches ordered by most recent first
   */
  async getAllBatches(): Promise<ProblemBatch[]> {
    return await this.batchRepo.findAll();
  }

  /**
   * Get the most recently imported batch
   */
  async getLatestBatch(): Promise<ProblemBatch | null> {
    return await this.batchRepo.findLatest();
  }

  /**
   * Create a new batch
   */
  async createBatch(batch: CreateProblemBatchInput): Promise<string> {
    const batchId = await this.batchRepo.create(batch);
    logger.info(`Batch created with ID: ${batchId}`);
    return batchId;
  }

  /**
   * Import a batch from external source (e.g., sync service)
   */
  async importBatch(batchData: {
    id: string;
    generationDate: string;
    problemCount: number;
    problems: any[];
  }): Promise<ImportResult> {
    const result = await this.batchRepo.import(batchData);

    switch (result) {
      case 'IMPORTED_NEW':
        logger.info(`Successfully imported new batch ${batchData.id}`);
        break;
      case 'REPLACED_EXISTING':
        logger.info(`Successfully replaced existing batch ${batchData.id}`);
        break;
      case 'SKIPPED_EXISTING':
        logger.info(`Skipped existing batch ${batchData.id}`);
        break;
    }

    return result;
  }

  /**
   * Delete a batch and all its problems
   */
  async deleteBatch(id: string): Promise<void> {
    await this.batchRepo.delete(id);
    logger.info(`Batch ${id} and its problems deleted`);
  }

  /**
   * Delete multiple batches
   */
  async deleteBatches(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const deletedCount = await this.batchRepo.deleteMany(ids);
    logger.info(`Deleted ${deletedCount}/${ids.length} batches`);
    return deletedCount;
  }

  /**
   * Delete all batches and problems (use with caution)
   */
  async deleteAllBatches(): Promise<void> {
    await this.batchRepo.deleteAll();
    logger.info('All batches and problems deleted');
  }

  /**
   * Clean up batches that are no longer valid according to external source
   */
  async cleanupOrphanedBatches(validBatchIds: string[]): Promise<number> {
    const deletedCount = await this.batchRepo.cleanupOrphaned(validBatchIds);
    return deletedCount;
  }

  /**
   * Get comprehensive statistics about all batches
   */
  async getBatchStatistics(): Promise<BatchStatistics> {
    return await this.batchRepo.getStatistics();
  }

  /**
   * Get detailed information about a specific batch including problem counts
   */
  async getBatchDetails(batchId: string): Promise<{
    batch: ProblemBatch;
    problemCounts: {
      total: number;
      completed: number;
      remaining: number;
    };
  } | null> {
    const batch = await this.getBatchById(batchId);
    if (!batch) return null;

    const problemCounts = await this.problemService.getBatchProblemCounts(batchId);

    return {
      batch,
      problemCounts
    };
  }

  /**
   * Check if a batch exists by generation date
   */
  async batchExistsForDate(date: Date): Promise<boolean> {
    const batch = await this.batchRepo.findByGenerationDate(date);
    return batch !== null;
  }

  /**
   * Get batch progress summary for all batches
   */
  async getBatchProgressSummary(): Promise<Array<{
    batch: ProblemBatch;
    total: number;
    completed: number;
    progressPercentage: number;
  }>> {
    const batches = await this.getAllBatches();

    const summaries = await Promise.all(
      batches.map(async (batch) => {
        const counts = await this.problemService.getBatchProblemCounts(batch.id);
        return {
          batch,
          total: counts.total,
          completed: counts.completed,
          progressPercentage: counts.total > 0 ? (counts.completed / counts.total) * 100 : 0
        };
      })
    );

    return summaries;
  }

  /**
   * Find the next batch with unsolved problems after the current batch
   */
  async getNextBatchWithProblems(currentBatchId?: string): Promise<ProblemBatch | null> {
    const batches = await this.getAllBatches();

    if (!currentBatchId) {
      // Return the first batch with unsolved problems
      for (const batch of batches) {
        const unsolvedProblems = await this.problemService.getUnsolvedProblems(batch.id, 1);
        if (unsolvedProblems.length > 0) {
          return batch;
        }
      }
      return null;
    }

    // Find the current batch index
    const currentIndex = batches.findIndex(batch => batch.id === currentBatchId);
    if (currentIndex === -1) {
      return null; // Current batch not found
    }

    // Look for the next batch with unsolved problems
    for (let i = currentIndex + 1; i < batches.length; i++) {
      const unsolvedProblems = await this.problemService.getUnsolvedProblems(batches[i].id, 1);
      if (unsolvedProblems.length > 0) {
        return batches[i];
      }
    }

    return null; // No more batches with problems
  }
}
