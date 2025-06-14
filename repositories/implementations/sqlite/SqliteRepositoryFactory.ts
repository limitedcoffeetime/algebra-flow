import { logger } from '@/utils/logger';
import { closeDBConnection, getDBConnection } from '../../../services/database/db';
import { IProblemBatchRepository } from '../../interfaces/IProblemBatchRepository';
import { IProblemRepository } from '../../interfaces/IProblemRepository';
import { IRepositoryFactory } from '../../interfaces/IRepositoryFactory';
import { IUserProgressRepository } from '../../interfaces/IUserProgressRepository';
import { SqliteProblemBatchRepository } from './SqliteProblemBatchRepository';
import { SqliteProblemRepository } from './SqliteProblemRepository';
import { SqliteUserProgressRepository } from './SqliteUserProgressRepository';

export class SqliteRepositoryFactory implements IRepositoryFactory {
  private _problemRepository?: IProblemRepository;
  private _problemBatchRepository?: IProblemBatchRepository;
  private _userProgressRepository?: IUserProgressRepository;

  problemRepository(): IProblemRepository {
    if (!this._problemRepository) {
      this._problemRepository = new SqliteProblemRepository();
    }
    return this._problemRepository;
  }

  problemBatchRepository(): IProblemBatchRepository {
    if (!this._problemBatchRepository) {
      this._problemBatchRepository = new SqliteProblemBatchRepository();
    }
    return this._problemBatchRepository;
  }

  userProgressRepository(): IUserProgressRepository {
    if (!this._userProgressRepository) {
      this._userProgressRepository = new SqliteUserProgressRepository();
    }
    return this._userProgressRepository;
  }

  async initialize(): Promise<boolean> {
    try {
      logger.info('Initializing SQLite database...');
      await getDBConnection(); // This creates tables if they don't exist

      // Initialize user progress if it doesn't exist
      await this.userProgressRepository().initialize();

      logger.info('SQLite database initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize SQLite database:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await closeDBConnection();
      // Clear cached repository instances
      this._problemRepository = undefined;
      this._problemBatchRepository = undefined;
      this._userProgressRepository = undefined;
    } catch (error) {
      logger.error('Failed to close database connection:', error);
      throw error;
    }
  }
}
