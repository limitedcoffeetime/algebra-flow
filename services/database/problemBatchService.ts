import { logger } from '@/utils/logger';
import { getDBConnection, runInTransactionAsync } from './db';
import {
    ProblemBatch,
    ProblemBatchInput,
    ProblemInput
} from './schema';
import { generateId } from './utils';

const nowISO = () => new Date().toISOString();

/**
 * Adds a new problem batch and its associated problems to the database.
 * This is the primary function for importing new content (e.g., from S3 via a sync process).
 */
export async function addProblemBatch(
  batchInput: ProblemBatchInput,
  problemsInput: ProblemInput[]
): Promise<string> {
  return runInTransactionAsync(async (db) => {
    const batchId = batchInput.id || generateId();
    const importedAt = nowISO();

    // Insert ProblemBatch
    const batchInsertSql = `
      INSERT INTO ProblemBatches (id, generationDate, sourceUrl, problemCount, importedAt)
      VALUES (?, ?, ?, ?, ?);
    `;
    await db.runAsync(
      batchInsertSql,
      batchId,
      batchInput.generationDate,
      batchInput.sourceUrl || null,
      batchInput.problemCount,
      importedAt
    );
    logger.info(`Batch ${batchId} inserted.`);

    // Insert Problems
    const problemInsertSql = `
      INSERT INTO Problems (
        id, batchId, equation, direction, answer, answerLHS, answerRHS, solutionSteps, variables,
        difficulty, problemType, isCompleted, userAnswer,
        solutionStepsShown, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    for (const problem of problemsInput) {
      if (problem.batchId !== batchId) {
        logger.warn(`Problem ${problem.id || 'new'} has batchId ${problem.batchId} but should be ${batchId}. Skipping.`);
        continue;
      }
      const problemId = problem.id || generateId();
      const currentTime = nowISO();
      await db.runAsync(
        problemInsertSql,
        problemId,
        batchId,
        problem.equation,
        problem.direction,
        Array.isArray(problem.answer) ? JSON.stringify(problem.answer) : String(problem.answer),
        problem.answerLHS || null,
        problem.answerRHS ? (Array.isArray(problem.answerRHS) ? JSON.stringify(problem.answerRHS) : String(problem.answerRHS)) : null,
        JSON.stringify(problem.solutionSteps),
        JSON.stringify(problem.variables),
        problem.difficulty,
        problem.problemType,
        problem.isCompleted ? 1 : 0,
        problem.userAnswer ? String(problem.userAnswer) : null,
        problem.solutionStepsShown ? 1 : 0,
        currentTime,
        currentTime
      );
      logger.info(`Problem ${problemId} for batch ${batchId} inserted.`);
    }
    return batchId;
  });
}

/**
 * Import a problem batch from sync service (converts format and calls addProblemBatch)
 */
export async function importProblemBatch(batchData: {
  id: string;
  generationDate: string;
  problemCount: number;
  problems: any[]
}): Promise<'SKIPPED_EXISTING' | 'REPLACED_EXISTING' | 'IMPORTED_NEW'> {
  // Check if batch with exact same ID already exists
  const existingBatch = await getProblemBatchById(batchData.id);
  if (existingBatch) {
    logger.info(`Batch ${batchData.id} already exists, skipping import`);
    return 'SKIPPED_EXISTING';
  }

  // Check if a batch with the same generation date (but different ID) exists
  const batchDateOnly = batchData.generationDate.split('T')[0]; // Extract YYYY-MM-DD
  const db = await getDBConnection();

  const existingBatchSameDate = await db.getFirstAsync<ProblemBatch>(
    `SELECT * FROM ProblemBatches
     WHERE DATE(generationDate) = ? AND id != ?
     ORDER BY generationDate DESC LIMIT 1`,
    batchDateOnly,
    batchData.id
  );

  let isReplacement = false;
  if (existingBatchSameDate) {
    logger.info(`Replacing existing batch ${existingBatchSameDate.id} from same date with newer batch ${batchData.id}`);
    await deleteProblemBatch(existingBatchSameDate.id);
    isReplacement = true;
  }

  // Convert to the format expected by addProblemBatch
  const batchInput: ProblemBatchInput = {
    id: batchData.id,
    generationDate: batchData.generationDate,
    problemCount: batchData.problemCount
  };

  const problemsInput: ProblemInput[] = batchData.problems.map(problem => ({
    ...problem,
    batchId: batchData.id
  }));

  logger.info(`Importing ${isReplacement ? 'replacement' : 'new'} batch ${batchData.id} with ${batchData.problems.length} problems`);
  await addProblemBatch(batchInput, problemsInput);

  return isReplacement ? 'REPLACED_EXISTING' : 'IMPORTED_NEW';
}

export async function getProblemBatchById(id: string): Promise<ProblemBatch | null> {
  const db = await getDBConnection();
  const row = await db.getFirstAsync<ProblemBatch>(
    'SELECT * FROM ProblemBatches WHERE id = ?',
    id
  );
  return row || null;
}

export async function getLatestProblemBatch(): Promise<ProblemBatch | null> {
  const db = await getDBConnection();
  // Order by generationDate (when LLM made it) or importedAt (when we got it)
  // Using importedAt might be more relevant for "latest available to user"
  const row = await db.getFirstAsync<ProblemBatch>(
    'SELECT * FROM ProblemBatches ORDER BY importedAt DESC LIMIT 1'
  );
  return row || null;
}

export async function getAllProblemBatches(): Promise<ProblemBatch[]> {
  const db = await getDBConnection();
  const rows = await db.getAllAsync<ProblemBatch>('SELECT * FROM ProblemBatches ORDER BY importedAt DESC');
  return rows || [];
}

/**
 * Deletes a problem batch and all its associated problems (due to CASCADE).
 */
export async function deleteProblemBatch(batchId: string): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM ProblemBatches WHERE id = ?', batchId);
    logger.info(`Deleted batch ${batchId} and its problems.`);
}

/**
 * Clears all problem batches and their problems from the database.
 * Useful for testing or a full reset.
 */
export async function deleteAllProblemBatches(): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM Problems'); // Delete problems first due to FK
    await db.runAsync('DELETE FROM ProblemBatches');
    logger.info('All problem batches and problems have been deleted.');
}

/**
 * Deletes multiple problem batches by their IDs.
 * Returns the number of successfully deleted batches.
 */
export async function deleteProblemBatches(batchIds: string[]): Promise<number> {
  let deletedCount = 0;

  for (const batchId of batchIds) {
    try {
      await deleteProblemBatch(batchId);
      deletedCount++;
    } catch (error) {
      logger.error(`Failed to delete batch ${batchId}:`, error);
      // Continue with other batches
    }
  }

  logger.info(`Deleted ${deletedCount}/${batchIds.length} batches`);
  return deletedCount;
}

/**
 * Removes local batches that are no longer available in S3.
 * Pass an array of valid batch IDs from S3 to keep only those.
 */
export async function cleanupOrphanedBatches(validBatchIds: string[]): Promise<number> {
  const db = await getDBConnection();

  try {
    // Get all local batch IDs
    const localBatches = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM ProblemBatches'
    );

    // Find batches that are local but not in S3
    const orphanedBatchIds = localBatches
      .map(b => b.id)
      .filter(id => !validBatchIds.includes(id));

    if (orphanedBatchIds.length === 0) {
      logger.info('No orphaned batches found');
      return 0;
    }

    logger.info(`Found ${orphanedBatchIds.length} orphaned batches: ${orphanedBatchIds.join(', ')}`);

    // Delete orphaned batches
    const deletedCount = await deleteProblemBatches(orphanedBatchIds);

    return deletedCount;
  } catch (error) {
    logger.error('Failed to cleanup orphaned batches:', error);
    throw error;
  }
}

/**
 * Gets statistics about problem batches and user progress.
 */
export async function getBatchStatistics() {
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

    return stats || {
      totalBatches: 0,
      totalProblems: 0,
      completedProblems: 0,
      oldestBatch: null,
      newestBatch: null
    };
  } catch (error) {
    logger.error('Failed to get batch statistics:', error);
    throw error;
  }
}
