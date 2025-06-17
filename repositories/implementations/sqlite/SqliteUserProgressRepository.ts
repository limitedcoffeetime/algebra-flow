import { logger } from '@/utils/logger';
import { getDBConnection } from '../../../services/database/db';
import { IUserProgressRepository } from '../../interfaces/IUserProgressRepository';
import { UpdateUserProgressInput, UserProgress } from '../../models/UserProgress';
import { UserProgressRow } from '../../types/database';

const USER_PROGRESS_ID = 'currentUser'; // Singleton ID for user progress row

export class SqliteUserProgressRepository implements IUserProgressRepository {
  private mapRowToUserProgress(row: UserProgressRow): UserProgress {
    return {
      id: row.id,
      currentBatchId: row.currentBatchId || null,
      problemsAttempted: row.problemsAttempted,
      problemsCorrect: row.problemsCorrect,
      lastSyncTimestamp: row.lastSyncTimestamp ? new Date(row.lastSyncTimestamp) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async get(): Promise<UserProgress | null> {
    const db = await getDBConnection();
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM UserProgress WHERE id = ?',
      USER_PROGRESS_ID
    );
    return row ? this.mapRowToUserProgress(row) : null;
  }

  async initialize(): Promise<UserProgress> {
    let progress = await this.get();
    if (progress) {
      return progress;
    }

    const db = await getDBConnection();
    const currentTime = new Date().toISOString();
    const newProgressData = {
      id: USER_PROGRESS_ID,
      currentBatchId: null,
      problemsAttempted: 0,
      problemsCorrect: 0,
      lastSyncTimestamp: null,
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    const sql = `
      INSERT INTO UserProgress (id, currentBatchId, problemsAttempted, problemsCorrect, lastSyncTimestamp, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.runAsync(
      sql,
      newProgressData.id,
      newProgressData.currentBatchId,
      newProgressData.problemsAttempted,
      newProgressData.problemsCorrect,
      newProgressData.lastSyncTimestamp,
      newProgressData.createdAt,
      newProgressData.updatedAt
    );

    logger.info('User progress initialized');
    return (await this.get())!;
  }

  async update(updates: UpdateUserProgressInput): Promise<UserProgress> {
    const db = await getDBConnection();
    const existingProgress = await this.get();
    if (!existingProgress) {
      logger.warn('UserProgress not found, initializing first');
      await this.initialize();
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if ('currentBatchId' in updates) {
      fields.push('currentBatchId = ?');
      values.push(updates.currentBatchId === undefined ? null : updates.currentBatchId);
    }
    if (updates.problemsAttempted !== undefined) {
      fields.push('problemsAttempted = ?');
      values.push(updates.problemsAttempted);
    }
    if (updates.problemsCorrect !== undefined) {
      fields.push('problemsCorrect = ?');
      values.push(updates.problemsCorrect);
    }
    if ('lastSyncTimestamp' in updates) {
      fields.push('lastSyncTimestamp = ?');
      values.push(updates.lastSyncTimestamp ? updates.lastSyncTimestamp.toISOString() : null);
    }

    if (fields.length === 0) {
      logger.info('No fields to update for UserProgress');
      return (await this.get())!;
    }

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());

    const sql = `UPDATE UserProgress SET ${fields.join(', ')} WHERE id = ?`;
    values.push(USER_PROGRESS_ID);

    await db.runAsync(sql, ...values);
    logger.info('User progress updated');

    const updatedProgress = await this.get();
    if (!updatedProgress) {
      throw new Error('Failed to retrieve updated user progress');
    }
    return updatedProgress;
  }

  async reset(): Promise<UserProgress> {
    const db = await getDBConnection();
    const currentTime = new Date().toISOString();

    const resetSql = `
      UPDATE UserProgress
      SET currentBatchId = ?,
          problemsAttempted = ?,
          problemsCorrect = ?,
          lastSyncTimestamp = ?,
          updatedAt = ?
      WHERE id = ?
    `;

    await db.runAsync(
      resetSql,
      null,
      0,
      0,
      null,
      currentTime,
      USER_PROGRESS_ID
    );

    logger.info('User progress has been reset');

    let progress = await this.get();
    if (!progress) {
      logger.warn('UserProgress was not found after reset, re-initializing');
      progress = await this.initialize();
    }
    return progress;
  }
}
