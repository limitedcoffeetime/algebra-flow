import { ErrorStrategy, handleError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';
import { DatabaseService } from '../../domain/DatabaseService';
import { BatchManifestResponse, ProblemBatchApiResponse } from '../../types/api';
import { IBatchSyncService, LatestInfo } from '../interfaces/IBatchSyncService';
import { IHttpService } from '../interfaces/IHttpService';

// BatchManifest type moved to api types

export class BatchSyncService implements IBatchSyncService {
  constructor(
    private databaseService: DatabaseService,
    private httpService: IHttpService,
    private config: {
      latestUrl: string;
    }
  ) {}

  async fetchLatestInfo(): Promise<LatestInfo | null> {
    try {
      const headResponse = await this.httpService.head(this.config.latestUrl);

      if (!headResponse.ok) {
        logger.error('Failed to HEAD latest.json:', headResponse.status);
        return null;
      }

      // Now GET the actual content
      const latestInfo: LatestInfo = await this.httpService.get(this.config.latestUrl);
      return latestInfo;
    } catch (error) {
      return handleError(error, 'Error fetching latest info', ErrorStrategy.RETURN_NULL) as null;
    }
  }

  async downloadAndImportBatch(latestInfo: LatestInfo): Promise<boolean> {
    try {
      logger.info(`Downloading batch from: ${latestInfo.url}`);

      const batchData: ProblemBatchApiResponse = await this.httpService.get(latestInfo.url);

      // Validate the data
      if (!batchData.problems || !Array.isArray(batchData.problems)) {
        logger.error('Invalid batch data format');
        return false;
      }

      // Import into database using domain service
      const result = await this.databaseService.batches.import(batchData);

      // Handle the result
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
      return handleError(error, 'Error downloading/importing batch', ErrorStrategy.RETURN_FALSE) as boolean;
    }
  }

  async getAvailableBatchIds(): Promise<string[] | null> {
    try {
      // Try to fetch a manifest file that lists all available batches
      const manifestUrl = this.config.latestUrl.replace('latest.json', 'manifest.json');

      try {
        const manifest: BatchManifestResponse = await this.httpService.get(manifestUrl);
        return manifest.batches.map(batch => batch.id);
      } catch (manifestError) {
        // Fallback: if no manifest, just return the latest batch ID
        logger.info('No manifest.json found, using latest batch only for cleanup reference');
        const latestInfo = await this.fetchLatestInfo();
        return latestInfo ? [latestInfo.batchId] : null;
      }
    } catch (error) {
      return handleError(error, 'Error fetching available batch IDs', ErrorStrategy.RETURN_NULL) as null;
    }
  }
}
