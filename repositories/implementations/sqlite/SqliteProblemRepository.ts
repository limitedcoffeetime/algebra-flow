import { logger } from '@/utils/logger';
import { getDBConnection } from '../../../services/database/db';
import { generateId } from '../../../services/database/utils';
import { IProblemRepository } from '../../interfaces/IProblemRepository';
import { CreateProblemInput, Problem, UpdateProblemInput } from '../../models/Problem';
import { ProblemRow, SerializedProblem } from '../../types/database';

export class SqliteProblemRepository implements IProblemRepository {
  private mapRowToProblem(row: ProblemRow): Problem {
    // Parse answer from JSON if it's an array, otherwise keep as string/number
    let answer = row.answer;
    if (typeof answer === 'string' && answer.startsWith('[') && answer.endsWith(']')) {
      try {
        answer = JSON.parse(answer);
      } catch (error) {
        logger.error('Failed to parse answer JSON:', { answer, error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Parse answerRHS from JSON if it's an array, otherwise keep as string/number
    let answerRHS = row.answerRHS;
    if (answerRHS && typeof answerRHS === 'string' && answerRHS.startsWith('[') && answerRHS.endsWith(']')) {
      try {
        answerRHS = JSON.parse(answerRHS);
      } catch (error) {
        logger.error('Failed to parse answerRHS JSON:', { answerRHS, error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Parse equations from JSON if present
    let equations: string[] | undefined;
    if (row.equations) {
      try {
        equations = JSON.parse(row.equations);
      } catch (error) {
        logger.error('Failed to parse equations JSON:', { equations: row.equations, error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Parse solution steps
    let solutionSteps;
    try {
      if (!row.solutionSteps) {
        logger.warn('Missing solutionSteps field, using empty array');
        solutionSteps = [];
      } else if (typeof row.solutionSteps === 'string') {
        solutionSteps = JSON.parse(row.solutionSteps);
      } else {
        solutionSteps = row.solutionSteps;
      }
    } catch (error) {
      logger.error('Failed to parse solutionSteps JSON:', { solutionSteps: row.solutionSteps, error: error instanceof Error ? error.message : String(error) });
      solutionSteps = [];
    }

    // Parse variables
    let variables;
    try {
      if (!row.variables) {
        logger.error('Missing variables field - this should not happen with new schema');
        variables = [];
      } else if (typeof row.variables === 'string') {
        variables = JSON.parse(row.variables);
      } else {
        variables = row.variables;
      }
    } catch (error) {
      logger.error('Failed to parse variables JSON:', { variables: row.variables, error: error instanceof Error ? error.message : String(error) });
      variables = [];
    }

    return {
      id: row.id,
      batchId: row.batchId,
      equation: row.equation,
      equations: equations, // Add the parsed equations array
      direction: row.direction,
      answer,
      answerLHS: row.answerLHS || undefined,
      answerRHS: answerRHS || undefined,
      solutionSteps,
      variables,
      difficulty: row.difficulty,
      problemType: row.problemType,
      isCompleted: !!row.isCompleted,
      userAnswer: row.userAnswer,
      solutionStepsShown: !!row.solutionStepsShown,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private serializeProblemForDB(problem: CreateProblemInput): SerializedProblem {
    const now = new Date().toISOString();

    return {
      id: problem.id || generateId(),
      batchId: problem.batchId,
      equation: problem.equation,
      equations: problem.equations ? JSON.stringify(problem.equations) : null, // Serialize equations array
      direction: problem.direction,
      answer: Array.isArray(problem.answer) ? JSON.stringify(problem.answer) : String(problem.answer),
      answerLHS: problem.answerLHS || null,
      answerRHS: problem.answerRHS ?
        (Array.isArray(problem.answerRHS) ? JSON.stringify(problem.answerRHS) : String(problem.answerRHS)) : null,
      solutionSteps: JSON.stringify(problem.solutionSteps),
      variables: JSON.stringify(problem.variables),
      difficulty: problem.difficulty,
      problemType: problem.problemType,
      isCompleted: problem.isCompleted ? 1 : 0,
      userAnswer: problem.userAnswer ? String(problem.userAnswer) : null,
      solutionStepsShown: problem.solutionStepsShown ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findById(id: string): Promise<Problem | null> {
    const db = await getDBConnection();
    const row = await db.getFirstAsync<ProblemRow>('SELECT * FROM Problems WHERE id = ?', id);
    return row ? this.mapRowToProblem(row) : null;
  }

  async findByBatchId(batchId: string): Promise<Problem[]> {
    const db = await getDBConnection();
    const rows = await db.getAllAsync<ProblemRow>(
      'SELECT * FROM Problems WHERE batchId = ? ORDER BY createdAt ASC',
      batchId
    );
    return (rows || []).map(row => this.mapRowToProblem(row));
  }

  async create(problem: CreateProblemInput): Promise<void> {
    const db = await getDBConnection();
    const serialized = this.serializeProblemForDB(problem);

    const sql = `
      INSERT INTO Problems (
        id, batchId, equation, equations, direction, answer, answerLHS, answerRHS, solutionSteps, variables,
        difficulty, problemType, isCompleted, userAnswer, solutionStepsShown, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.runAsync(
      sql,
      serialized.id,
      serialized.batchId,
      serialized.equation,
      serialized.equations,
      serialized.direction,
      serialized.answer,
      serialized.answerLHS,
      serialized.answerRHS,
      serialized.solutionSteps,
      serialized.variables,
      serialized.difficulty,
      serialized.problemType,
      serialized.isCompleted,
      serialized.userAnswer,
      serialized.solutionStepsShown,
      serialized.createdAt,
      serialized.updatedAt
    );

    logger.info(`Problem ${serialized.id} created successfully`);
  }

  async update(id: string, updates: UpdateProblemInput): Promise<void> {
    const db = await getDBConnection();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.isCompleted !== undefined) {
      fields.push('isCompleted = ?');
      values.push(updates.isCompleted ? 1 : 0);
    }
    if (updates.userAnswer !== undefined) {
      fields.push('userAnswer = ?');
      values.push(updates.userAnswer === null ? null : String(updates.userAnswer));
    }
    if (updates.solutionStepsShown !== undefined) {
      fields.push('solutionStepsShown = ?');
      values.push(updates.solutionStepsShown ? 1 : 0);
    }

    if (fields.length === 0) {
      logger.info('No fields to update for problem', id);
      return;
    }

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());

    const sql = `UPDATE Problems SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    const result = await db.runAsync(sql, ...values);
    if (result.changes > 0) {
      logger.info(`Problem ${id} updated successfully`);
    } else {
      logger.warn(`Problem ${id} not found or no changes made`);
    }
  }

  async delete(id: string): Promise<void> {
    const db = await getDBConnection();
    const result = await db.runAsync('DELETE FROM Problems WHERE id = ?', id);
    if (result.changes > 0) {
      logger.info(`Problem ${id} deleted successfully`);
    } else {
      logger.warn(`Problem ${id} not found`);
    }
  }

  async findUnsolvedByBatchId(batchId: string, limit: number = 10): Promise<Problem[]> {
    const db = await getDBConnection();
    const rows = await db.getAllAsync<ProblemRow>(
      'SELECT * FROM Problems WHERE batchId = ? AND isCompleted = 0 ORDER BY createdAt ASC LIMIT ?',
      batchId,
      limit
    );
    return (rows || []).map(row => this.mapRowToProblem(row));
  }

  async findCompletedByBatchId(batchId: string): Promise<Problem[]> {
    const db = await getDBConnection();
    const rows = await db.getAllAsync<ProblemRow>(
      'SELECT * FROM Problems WHERE batchId = ? AND isCompleted = 1 ORDER BY createdAt ASC',
      batchId
    );
    return (rows || []).map(row => this.mapRowToProblem(row));
  }

  async createMany(problems: CreateProblemInput[], useTransaction: boolean = true): Promise<void> {
    const db = await getDBConnection();

    if (useTransaction) {
      // Use transaction for better performance when not called from within another transaction
      await db.execAsync('BEGIN TRANSACTION;');
    }

    try {
      const sql = `
        INSERT INTO Problems (
          id, batchId, equation, direction, answer, answerLHS, answerRHS, solutionSteps, variables,
          difficulty, problemType, isCompleted, userAnswer, solutionStepsShown, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const problem of problems) {
        const serialized = this.serializeProblemForDB(problem);
        await db.runAsync(
          sql,
          serialized.id,
          serialized.batchId,
          serialized.equation,
          serialized.direction,
          serialized.answer,
          serialized.answerLHS,
          serialized.answerRHS,
          serialized.solutionSteps,
          serialized.variables,
          serialized.difficulty,
          serialized.problemType,
          serialized.isCompleted,
          serialized.userAnswer,
          serialized.solutionStepsShown,
          serialized.createdAt,
          serialized.updatedAt
        );
      }

      if (useTransaction) {
        await db.execAsync('COMMIT TRANSACTION;');
      }
      logger.info(`Created ${problems.length} problems successfully`);
    } catch (error) {
      if (useTransaction) {
        await db.execAsync('ROLLBACK TRANSACTION;');
      }
      logger.error('Failed to create problems:', error);
      throw error;
    }
  }

  async resetAllToUnsolved(): Promise<void> {
    const db = await getDBConnection();
    const now = new Date().toISOString();

    const result = await db.runAsync(
      'UPDATE Problems SET isCompleted = 0, userAnswer = NULL, solutionStepsShown = 0, updatedAt = ?',
      now
    );

    logger.info(`Reset ${result.changes} problems to unsolved state`);
  }

  async countByBatchId(batchId: string): Promise<number> {
    const db = await getDBConnection();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM Problems WHERE batchId = ?',
      batchId
    );
    return result?.count || 0;
  }

  async countCompletedByBatchId(batchId: string): Promise<number> {
    const db = await getDBConnection();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM Problems WHERE batchId = ? AND isCompleted = 1',
      batchId
    );
    return result?.count || 0;
  }

  async getAccuracyStatsByType(): Promise<Array<{
    problemType: string;
    attempted: number;
    correct: number;
    incorrect: number;
  }>> {
    const db = await getDBConnection();
    const rows = await db.getAllAsync<{
      problemType: string;
      answer: string;
      userAnswer: string | null;
    }>('SELECT problemType, answer, userAnswer FROM Problems WHERE isCompleted = 1');

    const stats: Record<string, { attempted: number; correct: number }> = {};

    for (const row of rows) {
      const type = row.problemType as string;
      if (!stats[type]) {
        stats[type] = { attempted: 0, correct: 0 };
      }
      stats[type].attempted += 1;

      // TODO: Replace with new validation package
      // For now, simple string comparison
      const userAns = String(row.userAnswer ?? '').trim().toLowerCase();
      const correctAns = String(row.answer).toLowerCase();
      const isCorrect = userAns === correctAns;

      if (isCorrect) {
        stats[type].correct += 1;
      }
    }

    return Object.entries(stats).map(([problemType, data]) => ({
      problemType,
      attempted: data.attempted,
      correct: data.correct,
      incorrect: data.attempted - data.correct,
    }));
  }
}
