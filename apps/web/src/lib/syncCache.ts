import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from './localStorage';

export const SYNC_CACHE_KEYS = {
  LAST_PROBLEM_HASH: 'lastProblemHash',
  LAST_SYNC_TIMESTAMP: 'lastSyncTimestamp',
  LATEST_BATCH_METADATA: 'latestBatchMetadata',
} as const;

interface BatchMetadata {
  batchId: string;
  generatedAt: string;
  problemCount: number;
}

export class SyncCache {
  getLastProblemHash(): string | null {
    return getLocalStorageItem(SYNC_CACHE_KEYS.LAST_PROBLEM_HASH);
  }

  setLastProblemHash(hash: string): void {
    setLocalStorageItem(SYNC_CACHE_KEYS.LAST_PROBLEM_HASH, hash);
  }

  getLastSyncTimestamp(): string | null {
    return getLocalStorageItem(SYNC_CACHE_KEYS.LAST_SYNC_TIMESTAMP);
  }

  setLastSyncTimestamp(timestamp: string): void {
    setLocalStorageItem(SYNC_CACHE_KEYS.LAST_SYNC_TIMESTAMP, timestamp);
  }

  getLatestBatchMetadata(): BatchMetadata | null {
    const value = getLocalStorageItem(SYNC_CACHE_KEYS.LATEST_BATCH_METADATA);
    if (!value) return null;

    try {
      return JSON.parse(value) as BatchMetadata;
    } catch {
      return null;
    }
  }

  setLatestBatchMetadata(metadata: BatchMetadata): void {
    setLocalStorageItem(SYNC_CACHE_KEYS.LATEST_BATCH_METADATA, JSON.stringify(metadata));
  }

  clear(): void {
    removeLocalStorageItem(SYNC_CACHE_KEYS.LAST_PROBLEM_HASH);
    removeLocalStorageItem(SYNC_CACHE_KEYS.LAST_SYNC_TIMESTAMP);
    removeLocalStorageItem(SYNC_CACHE_KEYS.LATEST_BATCH_METADATA);
  }
}
