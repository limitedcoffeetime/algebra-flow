import { BatchStatistics, CreateProblemBatchInput, ProblemBatch } from '../models/ProblemBatch';

export type ImportResult = 'SKIPPED_EXISTING' | 'REPLACED_EXISTING' | 'IMPORTED_NEW';

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
    problems: any[];
  }): Promise<ImportResult>;

  // Cleanup operations
  cleanupOrphaned(validBatchIds: string[]): Promise<number>;

  // Statistics
  getStatistics(): Promise<BatchStatistics>;
}
