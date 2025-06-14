// Export all interfaces
export * from './interfaces/IProblemBatchRepository';
export * from './interfaces/IProblemRepository';
export * from './interfaces/IRepositoryFactory';
export * from './interfaces/IUserProgressRepository';

// Export all models
export * from './models/Problem';
export * from './models/ProblemBatch';
export * from './models/UserProgress';

// Export implementations
export * from './implementations/sqlite/SqliteProblemBatchRepository';
export * from './implementations/sqlite/SqliteProblemRepository';
export * from './implementations/sqlite/SqliteRepositoryFactory';
export * from './implementations/sqlite/SqliteUserProgressRepository';

// Create and export default factory instance
import { SqliteRepositoryFactory } from './implementations/sqlite/SqliteRepositoryFactory';

export const repositoryFactory = new SqliteRepositoryFactory();
