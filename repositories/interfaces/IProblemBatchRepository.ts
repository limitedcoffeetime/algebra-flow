import { ProblemApiData } from '../../services/types/api';
import { BatchStatistics, CreateProblemBatchInput, ProblemBatch } from '../models/ProblemBatch';

export type ImportResult = 'IMPORTED_NEW' | 'REPLACED_EXISTING' | 'SKIPPED_EXISTING';

export interface IProblemBatchRepository {
  // Basic CRUD
  findById(id: string): Promise<ProblemBatch | null>;
  findAll(): Promise<ProblemBatch[]>;
  create(batch: CreateProblemBatchInput): Promise<string>;
  delete(id: string): Promise<void>;

  // Query operations
  findLatest(): Promise<ProblemBatch | null>;
  findByGenerationDate(date: Date): Promise<ProblemBatch | null>;

  // Bulk operations
  deleteMany(ids: string[]): Promise<number>;
  deleteAll(): Promise<void>;

  // Import operations
  import(batchData: {
    id: string;
    generationDate: string;
    problemCount: number;
    problems: ProblemApiData[];
  }): Promise<ImportResult>;

  // Cleanup operations
  cleanupOrphaned(validBatchIds: string[]): Promise<number>;

  // Statistics
  getStatistics(): Promise<BatchStatistics>;

  // Additional operations
  getNextBatchWithProblems(currentBatchId?: string): Promise<ProblemBatch | null>;
  cleanupOrphanedBatches(validIds: string[]): Promise<number>;
}
