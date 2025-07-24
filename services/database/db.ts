import { logger } from '@/utils/logger';
import * as SQLite from 'expo-sqlite';
import {
    CREATE_PROBLEM_BATCHES_TABLE,
    CREATE_PROBLEMS_TABLE,
    CREATE_USER_PROGRESS_TABLE,
} from './schema';

const DATABASE_NAME = 'algebro.db';

let db: SQLite.SQLiteDatabase | null = null;

// Define types for SQLite PRAGMA results
interface TableInfoRow {
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
}

export async function getDBConnection(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  try {
    logger.info('Opening SQLite database...');
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON');

    // Check if tables exist and log their schemas
    await logDatabaseSchema(db);

    // Create tables
    await db.execAsync(CREATE_PROBLEM_BATCHES_TABLE);
    await db.execAsync(CREATE_PROBLEMS_TABLE);
    await db.execAsync(CREATE_USER_PROGRESS_TABLE);

    logger.info('Database initialized successfully');

    // Log schema again after creation
    await logDatabaseSchema(db);

    return db;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

async function logDatabaseSchema(database: SQLite.SQLiteDatabase) {
  try {
    // Check if Problems table exists and get its schema
    const problemsTableInfo = await database.getAllAsync<TableInfoRow>(
      "PRAGMA table_info(Problems)"
    );

    logger.debug('Problems table schema:', {
      exists: problemsTableInfo.length > 0,
      columns: problemsTableInfo.map((col) => ({
        name: col.name,
        type: col.type,
        notnull: col.notnull,
        dflt_value: col.dflt_value
      }))
    });

    // Clean development approach - just log the schema
    logger.debug('Problems table schema:', {
      exists: problemsTableInfo.length > 0,
      columns: problemsTableInfo.map(col => col.name)
    });

  } catch (error) {
    logger.error('Failed to check database schema:', error);
  }
}

// Utility for closing the database if ever needed (e.g., for testing or specific scenarios)
export async function closeDBConnection(): Promise<void> {
  if (db) {
    try {
      await db.closeAsync();
      db = null;
      logger.info('Database connection closed.');
    } catch (error) {
      logger.error('Failed to close database connection:', error);
    }
  }
}

// Helper for transactions
export async function runInTransactionAsync<T>(
  fn: (tx: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  const database = await getDBConnection();
  try {
    await database.execAsync('BEGIN TRANSACTION;');
    const result = await fn(database); // Pass the main db connection as it handles transactions internally
    await database.execAsync('COMMIT TRANSACTION;');
    return result;
  } catch (error) {
    logger.error('Transaction failed, rolling back:', error);
    await database.execAsync('ROLLBACK TRANSACTION;');
    throw error;
  }
}
