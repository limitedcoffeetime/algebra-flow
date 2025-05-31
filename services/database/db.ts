import * as SQLite from 'expo-sqlite';
import {
    CREATE_PROBLEM_BATCHES_TABLE,
    CREATE_PROBLEMS_TABLE,
    CREATE_USER_PROGRESS_TABLE,
} from './schema';

const DATABASE_NAME = 'algebro.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDBConnection(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }
  try {
    console.log('Opening SQLite database...');
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    console.log('Database opened successfully.');
    await initializeDB(db);
    return db;
  } catch (error) {
    console.error('Failed to open or initialize database:', error);
    throw new Error('Failed to open or initialize database');
  }
}

async function initializeDB(database: SQLite.SQLiteDatabase) {
  console.log('Initializing database tables...');
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);
  await database.execAsync(CREATE_PROBLEM_BATCHES_TABLE);
  console.log('ProblemBatches table created/verified.');
  await database.execAsync(CREATE_PROBLEMS_TABLE);
  console.log('Problems table created/verified.');
  await database.execAsync(CREATE_USER_PROGRESS_TABLE);
  console.log('UserProgress table created/verified.');
  console.log('Database initialization complete.');
}

// Utility for closing the database if ever needed (e.g., for testing or specific scenarios)
export async function closeDBConnection(): Promise<void> {
  if (db) {
    try {
      await db.closeAsync();
      db = null;
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Failed to close database connection:', error);
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
    console.error('Transaction failed, rolling back:', error);
    await database.execAsync('ROLLBACK TRANSACTION;');
    throw error;
  }
}
