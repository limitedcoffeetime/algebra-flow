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
      INSERT INTO ProblemBatches (id, generationDate, generationDateOnly, sourceUrl, problemCount, importedAt)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    await db.runAsync(
      batchInsertSql,
      batchId,
      batchInput.generationDate,
      batchInput.generationDateOnly || null,
      batchInput.sourceUrl || null,
      batchInput.problemCount,
      importedAt
    );
    console.log(`Batch ${batchId} inserted.`);

    // Insert Problems
    const problemInsertSql = `
      INSERT INTO Problems (
        id, batchId, equation, answer, solutionSteps,
        difficulty, problemType, isCompleted, userAnswer,
        solutionStepsShown, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    for (const problem of problemsInput) {
      if (problem.batchId !== batchId) {
        console.warn(`Problem ${problem.id || 'new'} has batchId ${problem.batchId} but should be ${batchId}. Skipping.`);
        continue;
      }
      const problemId = problem.id || generateId();
      const currentTime = nowISO();
      await db.runAsync(
        problemInsertSql,
        problemId,
        batchId,
        problem.equation,
        String(problem.answer), // Ensure answer is string for DB
        JSON.stringify(problem.solutionSteps), // Store array as JSON string
        problem.difficulty,
        problem.problemType,
        problem.isCompleted ? 1 : 0, // Boolean to integer
        problem.userAnswer ? String(problem.userAnswer) : null,
        problem.solutionStepsShown ? 1 : 0, // Boolean to integer
        currentTime, // createdAt
        currentTime  // updatedAt
      );
      console.log(`Problem ${problemId} for batch ${batchId} inserted.`);
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
  generationDateOnly?: string; // New field for date-only comparisons
  problemCount: number;
  problems: any[]
}): Promise<'SKIPPED_EXISTING' | 'REPLACED_EXISTING' | 'IMPORTED_NEW'> {
  // Check if batch with exact same ID already exists
  const existingBatch = await getProblemBatchById(batchData.id);
  if (existingBatch) {
    console.log(`Batch ${batchData.id} already exists, skipping import`);
    return 'SKIPPED_EXISTING';
  }

  // Get the date for comparison - use generationDateOnly if available, otherwise extract from generationDate
  const batchDateOnly = batchData.generationDateOnly || batchData.generationDate.split('T')[0];

  // Check if a batch with the same generation date (but different ID) exists
  // This would indicate a replacement/overwrite scenario where multiple batches were generated on the same day
  const db = await getDBConnection();

  // First, try to find batches using the new generationDateOnly field (for new batches)
  let existingBatchSameDate = await db.getFirstAsync<ProblemBatch>(
    `SELECT * FROM ProblemBatches
     WHERE (generationDateOnly = ? OR DATE(generationDate) = ?)
     AND id != ?
     ORDER BY generationDate DESC LIMIT 1`, // Get the most recent one if multiple exist
    batchDateOnly,
    batchDateOnly,
    batchData.id
  );

  let isReplacement = false;
  if (existingBatchSameDate) {
    console.log(`Found existing batch ${existingBatchSameDate.id} for same date ${batchDateOnly}, replacing with newer batch ${batchData.id}`);
    console.log(`  Old batch generation time: ${existingBatchSameDate.generationDate}`);
    console.log(`  New batch generation time: ${batchData.generationDate}`);

    await deleteProblemBatch(existingBatchSameDate.id);
    isReplacement = true;
  }

  // Convert to the format expected by addProblemBatch
  const batchInput: ProblemBatchInput = {
    id: batchData.id,
    generationDate: batchData.generationDate,
    generationDateOnly: batchDateOnly, // Store the date-only field for future comparisons
    problemCount: batchData.problemCount
  };

  const problemsInput: ProblemInput[] = batchData.problems.map(problem => ({
    ...problem,
    batchId: batchData.id
  }));

  console.log(`Importing ${isReplacement ? 'replacement' : 'new'} batch ${batchData.id} with ${batchData.problems.length} problems`);
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
    console.log(`Deleted batch ${batchId} and its problems.`);
}

/**
 * Clears all problem batches and their problems from the database.
 * Useful for testing or a full reset.
 */
export async function deleteAllProblemBatches(): Promise<void> {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM Problems'); // Delete problems first due to FK
    await db.runAsync('DELETE FROM ProblemBatches');
    console.log('All problem batches and problems have been deleted.');
}
