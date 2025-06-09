import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './database';

interface LatestInfo {
  batchId: string;
  url: string;
  hash: string;
  generatedAt: string;
  problemCount: number;
}

interface ProblemBatchData {
  id: string;
  generationDate: string;
  problemCount: number;
  problems: any[];
}

interface BatchManifest {
  batches: Array<{
    id: string;
    url: string;
    generatedAt: string;
    problemCount: number;
  }>;
}

export class ProblemSyncService {
  private static readonly LATEST_URL = process.env.EXPO_PUBLIC_PROBLEMS_LATEST_URL || '';
  private static readonly LAST_SYNC_KEY = 'lastSyncTimestamp';
  private static readonly LAST_HASH_KEY = 'lastProblemHash';

  /**
   * Check if new problems are available and download them
   */
  static async syncProblems(): Promise<boolean> {
    try {
      logger.info('🔄 Checking for new problems...');

      if (!this.LATEST_URL) {
        logger.warn('⚠️ No sync URL configured, skipping sync');
        return false;
      }

      // Check what's latest on server
      const latestInfo = await this.fetchLatestInfo();
      if (!latestInfo) {
        logger.error('❌ Failed to fetch latest info');
        return false;
      }

      // Check if we already have this batch
      const lastHash = await AsyncStorage.getItem(this.LAST_HASH_KEY);
      if (lastHash === latestInfo.hash) {
        logger.info('✅ Already have latest problems');
        await this.updateLastSyncTime();

        // Still do cleanup check even if no new problems
        try {
          await this.cleanupOrphanedBatches();
        } catch (error) {
          logger.warn('Cleanup failed during sync, but continuing:', error);
        }

        return false;
      }

      // Download and import new batch
      logger.info(`📥 Downloading new batch: ${latestInfo.batchId}`);
      const success = await this.downloadAndImportBatch(latestInfo);

      if (success) {
        await AsyncStorage.setItem(this.LAST_HASH_KEY, latestInfo.hash);
        await this.updateLastSyncTime();

        // Clean up orphaned batches after successful sync
        try {
          await this.cleanupOrphanedBatches();
        } catch (error) {
          logger.warn('Cleanup failed after sync, but sync was successful:', error);
        }

        logger.info('✅ Successfully synced new problems');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('❌ Sync failed:', error);
      return false;
    }
  }

  /**
   * Fetch the latest.json info from server
   */
  private static async fetchLatestInfo(): Promise<LatestInfo | null> {
    try {
      const response = await fetch(this.LATEST_URL, {
        method: 'HEAD',
        cache: 'no-cache'
      });

      if (!response.ok) {
        logger.error('Failed to HEAD latest.json:', response.status);
        return null;
      }

      // Now GET the actual content
      const getResponse = await fetch(this.LATEST_URL, {
        cache: 'no-cache'
      });

      if (!getResponse.ok) {
        logger.error('Failed to GET latest.json:', getResponse.status);
        return null;
      }

      const latestInfo: LatestInfo = await getResponse.json();
      return latestInfo;
    } catch (error) {
      logger.error('Error fetching latest info:', error);
      return null;
    }
  }

  /**
   * Download and import a problem batch
   */
  private static async downloadAndImportBatch(latestInfo: LatestInfo): Promise<boolean> {
    try {
      logger.info(`Downloading batch from: ${latestInfo.url}`);

      const response = await fetch(latestInfo.url);
      if (!response.ok) {
        logger.error('Failed to download batch:', response.status);
        return false;
      }

      const batchData: ProblemBatchData = await response.json();

      // Validate the data
      if (!batchData.problems || !Array.isArray(batchData.problems)) {
        logger.error('Invalid batch data format');
        return false;
      }

      // Import into database and get the result
      const result = await db.importProblemBatch(batchData);

      // The importProblemBatch now returns meaningful information
      if (result === 'SKIPPED_EXISTING') {
        logger.info(`✅ Batch ${batchData.id} already exists locally - no import needed`);
        return false; // No new content was actually imported
      } else if (result === 'REPLACED_EXISTING') {
        logger.info(`✅ Replaced existing batch and imported ${batchData.problems.length} problems`);
        return true; // New content was imported
      } else {
        logger.info(`✅ Imported new batch with ${batchData.problems.length} problems`);
        return true; // New content was imported
      }
    } catch (error) {
      logger.error('Error downloading/importing batch:', error);
      return false;
    }
  }

  /**
   * Update the last sync timestamp
   */
  private static async updateLastSyncTime(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, timestamp);

      // Also update in database
      await db.updateUserProgress({ lastSyncTimestamp: timestamp });
    } catch (error) {
      logger.error('Error updating sync time:', error);
    }
  }

  /**
   * Get last sync timestamp
   */
  static async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.LAST_SYNC_KEY);
    } catch (error) {
      logger.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Force a sync check (for manual testing)
   */
  static async forceSyncCheck(): Promise<boolean> {
    // Clear the hash to force download
    await AsyncStorage.removeItem(this.LAST_HASH_KEY);
    return await this.syncProblems();
  }

  /**
   * Check if sync is needed (called once per day)
   */
  static async shouldSync(): Promise<boolean> {
    try {
      const lastSync = await this.getLastSyncTime();
      if (!lastSync) return true;

      const lastSyncDate = new Date(lastSync);
      const now = new Date();
      const hoursSinceSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

      // Sync if it's been more than 20 hours (allows for timezone differences)
      return hoursSinceSync > 20;
    } catch (error) {
      logger.error('Error checking if sync needed:', error);
      return true; // Default to sync on error
    }
  }

  /**
   * Clean up local batches that are no longer available on S3
   */
  static async cleanupOrphanedBatches(): Promise<number> {
    try {
      logger.info('🧹 Cleaning up orphaned batches...');

      // Get available batches from S3
      const availableBatchIds = await this.getAvailableBatchIds();
      if (!availableBatchIds) {
        logger.warn('⚠️ Could not fetch available batches, skipping cleanup');
        return 0;
      }

      // Clean up orphaned batches
      const deletedCount = await db.cleanupOrphanedBatches(availableBatchIds);

      if (deletedCount > 0) {
        logger.info(`✅ Cleaned up ${deletedCount} orphaned batches`);
      } else {
        logger.info('✅ No orphaned batches found');
      }

      return deletedCount;
    } catch (error) {
      logger.error('❌ Failed to cleanup orphaned batches:', error);
      return 0;
    }
  }

  /**
   * Get list of all available batch IDs from S3
   */
  private static async getAvailableBatchIds(): Promise<string[] | null> {
    try {
      // Try to fetch a manifest file that lists all available batches
      const manifestUrl = this.LATEST_URL.replace('latest.json', 'manifest.json');

      const response = await fetch(manifestUrl);
      if (response.ok) {
        const manifest: BatchManifest = await response.json();
        return manifest.batches.map(b => b.id);
      }

      // Fallback: if no manifest, just return the latest batch ID
      logger.warn('No manifest.json found, using latest batch only for cleanup reference');
      const latestInfo = await this.fetchLatestInfo();
      return latestInfo ? [latestInfo.batchId] : null;
    } catch (error) {
      logger.error('Error fetching available batch IDs:', error);
      return null;
    }
  }

  /**
   * Get batch management information
   */
  static async getBatchInfo(): Promise<{
    local: Awaited<ReturnType<typeof db.getBatchStatistics>>;
    lastSync: string | null;
  }> {
    const [localStats, lastSync] = await Promise.all([
      db.getBatchStatistics(),
      this.getLastSyncTime()
    ]);

    return {
      local: localStats,
      lastSync
    };
  }

  /**
   * Delete specific local batches
   */
  static async deleteLocalBatches(batchIds: string[]): Promise<number> {
    try {
      logger.info(`🗑️ Deleting ${batchIds.length} local batches...`);
      const deletedCount = await db.deleteProblemBatches(batchIds);
      logger.info(`✅ Deleted ${deletedCount} batches`);
      return deletedCount;
    } catch (error) {
      logger.error('❌ Failed to delete local batches:', error);
      return 0;
    }
  }
}
