import { CreateProblemInput, Problem, UpdateProblemInput } from '../models/Problem';

export interface IProblemRepository {
  // Basic CRUD
  findById(id: string): Promise<Problem | null>;
  findByBatchId(batchId: string): Promise<Problem[]>;
  create(problem: CreateProblemInput): Promise<void>;
  update(id: string, updates: UpdateProblemInput): Promise<void>;
  delete(id: string): Promise<void>;

  // Query operations
  findUnsolvedByBatchId(batchId: string, limit?: number): Promise<Problem[]>;
  findCompletedByBatchId(batchId: string): Promise<Problem[]>;

  // Bulk operations
  createMany(problems: CreateProblemInput[], useTransaction?: boolean): Promise<void>;
  resetAllToUnsolved(): Promise<void>;

  // Statistics
  countByBatchId(batchId: string): Promise<number>;
  countCompletedByBatchId(batchId: string): Promise<number>;
  getAccuracyStatsByType(): Promise<Array<{
    problemType: string;
    attempted: number;
    correct: number;
    incorrect: number;
  }>>;
}
