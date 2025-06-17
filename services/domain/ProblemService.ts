import { logger } from '@/utils/logger';
import { CreateProblemInput, Problem, repositoryFactory, UpdateProblemInput } from '../../repositories';

/**
 * High-level service for problem-related business operations.
 * This service encapsulates business logic and uses repositories for data access.
 */
export class ProblemService {
  private problemRepo = repositoryFactory.problemRepository();

  /**
   * Get a problem by its ID
   */
  async getProblemById(id: string): Promise<Problem | null> {
    return await this.problemRepo.findById(id);
  }

  /**
   * Get all problems for a specific batch
   */
  async getProblemsByBatch(batchId: string): Promise<Problem[]> {
    return await this.problemRepo.findByBatchId(batchId);
  }

  /**
   * Get unsolved problems for a specific batch with optional limit
   */
  async getUnsolvedProblems(batchId: string, limit?: number): Promise<Problem[]> {
    return await this.problemRepo.findUnsolvedByBatchId(batchId, limit);
  }

  /**
   * Get completed problems for a specific batch
   */
  async getCompletedProblems(batchId: string): Promise<Problem[]> {
    return await this.problemRepo.findCompletedByBatchId(batchId);
  }

  /**
   * Create a new problem
   */
  async createProblem(problem: CreateProblemInput): Promise<void> {
    await this.problemRepo.create(problem);
    logger.info(`Problem created for batch ${problem.batchId}`);
  }

  /**
   * Create multiple problems efficiently
   */
  async createProblems(problems: CreateProblemInput[]): Promise<void> {
    if (problems.length === 0) return;

    await this.problemRepo.createMany(problems);
    logger.info(`Created ${problems.length} problems`);
  }

  /**
   * Update a problem (typically when user submits an answer)
   */
  async updateProblem(id: string, updates: UpdateProblemInput): Promise<void> {
    await this.problemRepo.update(id, updates);

    if (updates.isCompleted) {
      logger.info(`Problem ${id} marked as completed`);
    }
  }

  /**
   * Submit an answer for a problem
   */
  async submitAnswer(problemId: string, userAnswer: string | number, isCorrect: boolean): Promise<void> {
    await this.problemRepo.update(problemId, {
      isCompleted: true,
      userAnswer: userAnswer
    });

    logger.info(`Answer submitted for problem ${problemId}: ${isCorrect ? 'correct' : 'incorrect'}`);
  }

  /**
   * Mark solution steps as shown for a problem
   */
  async markSolutionStepsShown(problemId: string): Promise<void> {
    await this.problemRepo.update(problemId, {
      solutionStepsShown: true
    });
  }

  /**
   * Reset all problems to unsolved state
   */
  async resetAllProblems(): Promise<void> {
    await this.problemRepo.resetAllToUnsolved();
    logger.info('All problems reset to unsolved state');
  }

  /**
   * Get problem counts for a batch
   */
  async getBatchProblemCounts(batchId: string): Promise<{
    total: number;
    completed: number;
    remaining: number;
  }> {
    const [total, completed] = await Promise.all([
      this.problemRepo.countByBatchId(batchId),
      this.problemRepo.countCompletedByBatchId(batchId)
    ]);

    return {
      total,
      completed,
      remaining: total - completed
    };
  }

  /**
   * Get accuracy statistics by problem type
   */
  async getAccuracyStatistics(): Promise<Array<{
    problemType: string;
    attempted: number;
    correct: number;
    incorrect: number;
    accuracy: number;
  }>> {
    const stats = await this.problemRepo.getAccuracyStatsByType();

    return stats.map(stat => ({
      ...stat,
      accuracy: stat.attempted > 0 ? (stat.correct / stat.attempted) * 100 : 0
    }));
  }

  /**
   * Delete a problem
   */
  async deleteProblem(id: string): Promise<void> {
    await this.problemRepo.delete(id);
    logger.info(`Problem ${id} deleted`);
  }
}
