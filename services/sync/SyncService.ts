import { ErrorStrategy, handleError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';
import { BatchStatistics } from '../../repositories/models/ProblemBatch';
import { DatabaseService } from '../domain/DatabaseService';
import { IBatchSyncService } from './interfaces/IBatchSyncService';
import { ICacheService } from './interfaces/ICacheService';
import { IHttpService } from './interfaces/IHttpService';
import { ISyncService } from './interfaces/ISyncService';

export class SyncService implements ISyncService {
  constructor(
    private databaseService: DatabaseService,
    private httpService: IHttpService,
    private cacheService: ICacheService,
    private batchSyncService: IBatchSyncService,
    private config: {
      lastSyncKey: string;
      lastHashKey: string;
    }
  ) {}

  /**
   * Check if new problems are available and download them
   */
  async syncProblems(): Promise<boolean> {
    try {
      logger.info('🔄 Checking for new problems...');

      // Check what's latest on server
      const latestInfo = await this.batchSyncService.fetchLatestInfo();
      if (!latestInfo) {
        logger.error('❌ Failed to fetch latest info');
        return false;
      }

      // Check if we already have this batch
      const lastHash = await this.cacheService.get(this.config.lastHashKey);
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
      const success = await this.batchSyncService.downloadAndImportBatch(latestInfo);

      if (success) {
        await this.cacheService.set(this.config.lastHashKey, latestInfo.hash);
        await this.updateLastSyncTime();

        // Clean up old batches after successful sync
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
      return handleError(error, 'Sync failed', ErrorStrategy.RETURN_FALSE) as boolean;
    }
  }

  /**
   * Update the last sync timestamp
   */
  private async updateLastSyncTime(): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      await this.cacheService.set(this.config.lastSyncKey, timestamp);

      // Also update in database
      await this.databaseService.userProgress.update({ lastSyncTimestamp: new Date(timestamp) });
    } catch (error) {
      handleError(error, 'Error updating sync time', ErrorStrategy.SILENT);
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime(): Promise<string | null> {
    try {
      return await this.cacheService.get(this.config.lastSyncKey);
    } catch (error) {
      return handleError(error, 'Error getting last sync time', ErrorStrategy.RETURN_NULL) as null;
    }
  }

  /**
   * Force a sync check (for manual testing)
   */
  async forceSyncCheck(): Promise<boolean> {
    // Clear the hash to force download
    await this.cacheService.remove(this.config.lastHashKey);
    return await this.syncProblems();
  }

  /**
   * Check if sync is needed (called once per day)
   */
  async shouldSync(): Promise<boolean> {
    try {
      const lastSync = await this.getLastSyncTime();
      if (!lastSync) return true;

      const lastSyncDate = new Date(lastSync);
      const now = new Date();
      const hoursSinceSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

      // Sync if it's been more than 20 hours (allows for timezone differences)
      return hoursSinceSync > 20;
    } catch (error) {
      handleError(error, 'Error checking if sync needed', ErrorStrategy.SILENT);
      return true; // Default to sync on error
    }
  }

  /**
   * Clean up local batches that are no longer available on S3
   */
  async cleanupOrphanedBatches(): Promise<number> {
    try {
      // Get available batches from S3
      const availableBatchIds = await this.batchSyncService.getAvailableBatchIds();
      if (!availableBatchIds) {
        return 0;
      }

      // Clean up orphaned batches using domain service
      const deletedCount = await this.databaseService.batches.cleanupOrphaned(availableBatchIds);
      return deletedCount;
    } catch (error) {
      handleError(error, 'Failed to cleanup orphaned batches', ErrorStrategy.SILENT);
      return 0;
    }
  }

  /**
   * Get batch management information
   */
  async getBatchInfo(): Promise<{
    local: BatchStatistics;
    lastSync: string | null;
  }> {
    const [localStats, lastSync] = await Promise.all([
      this.databaseService.batches.getStatistics(),
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
  async deleteLocalBatches(batchIds: string[]): Promise<number> {
    try {
      logger.info(`🗑️ Deleting ${batchIds.length} local batches...`);
      const deletedCount = await this.databaseService.batches.deleteMany(batchIds);
      logger.info(`✅ Deleted ${deletedCount} batches`);
      return deletedCount;
    } catch (error) {
      handleError(error, 'Failed to delete local batches', ErrorStrategy.SILENT);
      return 0;
    }
  }
}
