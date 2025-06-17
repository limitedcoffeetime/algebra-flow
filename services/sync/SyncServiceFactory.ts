import { databaseService } from '../domain';
import { SyncService } from './SyncService';
import { AsyncStorageCacheService } from './implementations/AsyncStorageCacheService';
import { BatchSyncService } from './implementations/BatchSyncService';
import { HttpService } from './implementations/HttpService';

export function createSyncService(): SyncService {
  // Create concrete implementations
  const httpService = new HttpService();
  const cacheService = new AsyncStorageCacheService();

  // Create batch sync service with its dependencies
  const batchSyncService = new BatchSyncService(
    databaseService,
    httpService,
    {
      latestUrl: process.env.EXPO_PUBLIC_PROBLEMS_LATEST_URL || ''
    }
  );

  // Create main sync service with all dependencies
  return new SyncService(
    databaseService,
    httpService,
    cacheService,
    batchSyncService,
    {
      lastSyncKey: 'lastSyncTimestamp',
      lastHashKey: 'lastProblemHash'
    }
  );
}

// Export singleton instance
export const syncService = createSyncService();
