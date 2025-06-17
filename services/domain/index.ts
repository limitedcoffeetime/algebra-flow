// Export all domain services
export * from './DatabaseService';
export * from './ProblemBatchService';
export * from './ProblemService';
export * from './UserProgressService';

// Create and export default database service instance
import { DatabaseService } from './DatabaseService';

export const databaseService = new DatabaseService();
