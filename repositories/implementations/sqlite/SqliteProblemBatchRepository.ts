import { logger } from '@/utils/logger';
import { getDBConnection } from '../../../services/database/db';
import { generateId } from '../../../services/database/utils';
import { ProblemApiData } from '../../../services/types/api';
import { IProblemBatchRepository, ImportResult } from '../../interfaces/IProblemBatchRepository';
import { CreateProblemInput } from '../../models/Problem';
import { BatchStatistics, CreateProblemBatchInput, ProblemBatch } from '../../models/ProblemBatch';
import { ProblemBatchRow } from '../../types/database';
import { SqliteProblemRepository } from './SqliteProblemRepository';

export class SqliteProblemBatchRepository implements IProblemBatchRepository {
  cleanupOrphanedBatches(validIds: string[]): Promise<number> {
      throw new Error('Method not implemented.');
  }
  private problemRepository = new SqliteProblemRepository();

  private mapRowToBatch(row: ProblemBatchRow): ProblemBatch {
    return {
      id: row.id,
      generationDate: new Date(row.generationDate),
      sourceUrl: row.sourceUrl || undefined,
      problemCount: row.problemCount,
      importedAt: new Date(row.importedAt)
    };
  }

  async findById(id: string): Promise<ProblemBatch | null> {
    const db = await getDBConnection();
    const row = await db.getFirstAsync<any>('SELECT * FROM ProblemBatches WHERE id = ?', id);
    return row ? this.mapRowToBatch(row) : null;
  }

  async findAll(): Promise<ProblemBatch[]> {
    const db = await getDBConnection();
    const rows = await db.getAllAsync<any>('SELECT * FROM ProblemBatches ORDER BY importedAt DESC');
    return (rows || []).map(row => this.mapRowToBatch(row));
  }

  async create(batch: CreateProblemBatchInput): Promise<string> {
    const db = await getDBConnection();
    const batchId = batch.id || generateId();
    const importedAt = new Date().toISOString();

    const sql = `
      INSERT INTO ProblemBatches (id, generationDate, sourceUrl, problemCount, importedAt)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.runAsync(
      sql,
      batchId,
      batch.generationDate.toISOString(),
      batch.sourceUrl || null,
      batch.problemCount,
      importedAt
    );

    logger.info(`Batch ${batchId} created successfully`);
    return batchId;
  }

  async delete(id: string): Promise<void> {
    const db = await getDBConnection();
    const result = await db.runAsync('DELETE FROM ProblemBatches WHERE id = ?', id);
    if (result.changes > 0) {
      logger.info(`Batch ${id} deleted successfully (problems cascaded)`);
    } else {
      logger.warn(`Batch ${id} not found`);
    }
  }

  async findLatest(): Promise<ProblemBatch | null> {
    const db = await getDBConnection();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM ProblemBatches ORDER BY importedAt DESC LIMIT 1'
    );
    return row ? this.mapRowToBatch(row) : null;
  }

  async findByGenerationDate(date: Date): Promise<ProblemBatch | null> {
    const db = await getDBConnection();
    const batchDateOnly = date.toISOString().split('T')[0]; // Extract YYYY-MM-DD

    const row = await db.getFirstAsync<any>(
      'SELECT * FROM ProblemBatches WHERE DATE(generationDate) = ? ORDER BY generationDate DESC LIMIT 1',
      batchDateOnly
    );
    return row ? this.mapRowToBatch(row) : null;
  }

  async deleteMany(ids: string[]): Promise<number> {
    let deletedCount = 0;

    for (const id of ids) {
      try {
        await this.delete(id);
        deletedCount++;
      } catch (error) {
        logger.error(`Failed to delete batch ${id}:`, error);
        // Continue with other batches
      }
    }

    logger.info(`Deleted ${deletedCount}/${ids.length} batches`);
    return deletedCount;
  }

  async deleteAll(): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM Problems'); // Delete problems first due to FK
    await db.runAsync('DELETE FROM ProblemBatches');
    logger.info('All problem batches and problems have been deleted');
  }

  async import(batchData: {
    id: string;
    generationDate: string;
    problemCount: number;
    problems: ProblemApiData[];
  }): Promise<ImportResult> {
    // Check if batch with exact same ID already exists
    const existingBatch = await this.findById(batchData.id);
    if (existingBatch) {
      logger.info(`Batch ${batchData.id} already exists, skipping import`);
      return 'SKIPPED_EXISTING';
    }

    // Check if a batch with the same generation date (but different ID) exists
    const generationDate = new Date(batchData.generationDate);
    const existingBatchSameDate = await this.findByGenerationDate(generationDate);

    let isReplacement = false;
    if (existingBatchSameDate && existingBatchSameDate.id !== batchData.id) {
      logger.info(`Replacing existing batch ${existingBatchSameDate.id} from same date with newer batch ${batchData.id}`);
      await this.delete(existingBatchSameDate.id);
      isReplacement = true;
    }

    // Convert to the format expected by create
    const batchInput: CreateProblemBatchInput = {
      id: batchData.id,
      generationDate: generationDate,
      problemCount: batchData.problemCount
    };

    const problemsInput: CreateProblemInput[] = batchData.problems.map(problem => ({
      ...problem,
      batchId: batchData.id
    }));

    logger.info(`Importing ${isReplacement ? 'replacement' : 'new'} batch ${batchData.id} with ${batchData.problems.length} problems`);

    // Use transaction for atomicity
    const db = await getDBConnection();
    await db.execAsync('BEGIN TRANSACTION;');

    try {
      await this.create(batchInput);
      await this.problemRepository.createMany(problemsInput, false); // Don't use transaction since we're already in one
      await db.execAsync('COMMIT TRANSACTION;');
    } catch (error) {
      await db.execAsync('ROLLBACK TRANSACTION;');
      logger.error('Failed to import batch:', error);
      throw error;
    }

    return isReplacement ? 'REPLACED_EXISTING' : 'IMPORTED_NEW';
  }

  async cleanupOrphaned(validBatchIds: string[]): Promise<number> {
    const db = await getDBConnection();

    try {
      // Get all local batch IDs
      const localBatches = await db.getAllAsync<{ id: string }>(
        'SELECT id FROM ProblemBatches'
      );

      // Find batches that are local but not in the valid list
      const orphanedBatchIds = localBatches
        .map(b => b.id)
        .filter(id => !validBatchIds.includes(id));

      if (orphanedBatchIds.length === 0) {
        logger.info('No orphaned batches found');
        return 0;
      }

      logger.info(`Found ${orphanedBatchIds.length} orphaned batches: ${orphanedBatchIds.join(', ')}`);

      // Delete orphaned batches
      const deletedCount = await this.deleteMany(orphanedBatchIds);

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup orphaned batches:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<BatchStatistics> {
    const db = await getDBConnection();

    try {
      const stats = await db.getFirstAsync<{
        totalBatches: number;
        totalProblems: number;
        completedProblems: number;
        oldestBatch: string;
        newestBatch: string;
      }>(
        `SELECT
          COUNT(DISTINCT b.id) as totalBatches,
          COUNT(p.id) as totalProblems,
          COUNT(CASE WHEN p.isCompleted = 1 THEN 1 END) as completedProblems,
          MIN(b.generationDate) as oldestBatch,
          MAX(b.generationDate) as newestBatch
         FROM ProblemBatches b
         LEFT JOIN Problems p ON b.id = p.batchId`
      );

      return {
        totalBatches: stats?.totalBatches || 0,
        totalProblems: stats?.totalProblems || 0,
        completedProblems: stats?.completedProblems || 0,
        oldestBatch: stats?.oldestBatch ? new Date(stats.oldestBatch) : null,
        newestBatch: stats?.newestBatch ? new Date(stats.newestBatch) : null,
      };
    } catch (error) {
      logger.error('Failed to get batch statistics:', error);
      throw error;
    }
  }

  async getAll(): Promise<ProblemBatch[]> {
    return this.findAll();
  }

  async getLatest(): Promise<ProblemBatch | null> {
    return this.findLatest();
  }

  async update(id: string, updates: Partial<ProblemBatch>): Promise<void> {
    const db = await getDBConnection();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.sourceUrl !== undefined) {
      fields.push('sourceUrl = ?');
      values.push(updates.sourceUrl);
    }
    if (updates.problemCount !== undefined) {
      fields.push('problemCount = ?');
      values.push(updates.problemCount);
    }

    if (fields.length === 0) {
      logger.info('No fields to update for batch', id);
      return;
    }

    const sql = `UPDATE ProblemBatches SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    const result = await db.runAsync(sql, ...values);
    if (result.changes > 0) {
      logger.info(`Batch ${id} updated successfully`);
    } else {
      logger.warn(`Batch ${id} not found or no changes made`);
    }
  }

  async getNextBatchWithProblems(currentBatchId?: string): Promise<ProblemBatch | null> {
    const db = await getDBConnection();

    // If no current batch, get the oldest batch with unsolved problems
    if (!currentBatchId) {
      const row = await db.getFirstAsync<any>(
        `SELECT DISTINCT b.* FROM ProblemBatches b
         INNER JOIN Problems p ON b.id = p.batchId
         WHERE p.isCompleted = 0
         ORDER BY b.generationDate ASC
         LIMIT 1`
      );
      return row ? this.mapRowToBatch(row) : null;
    }

    // Get the next batch after the current one that has unsolved problems
    const currentBatch = await this.findById(currentBatchId);
    if (!currentBatch) {
      return null;
    }

    const row = await db.getFirstAsync<any>(
      `SELECT DISTINCT b.* FROM ProblemBatches b
       INNER JOIN Problems p ON b.id = p.batchId
       WHERE p.isCompleted = 0 AND b.generationDate > ?
       ORDER BY b.generationDate ASC
       LIMIT 1`,
      currentBatch.generationDate.toISOString()
    );

    return row ? this.mapRowToBatch(row) : null;
  }
}
