export interface LatestInfo {
  batchId: string;
  url: string;
  hash: string;
  generatedAt: string;
  problemCount: number;
}

export interface IBatchSyncService {
  downloadAndImportBatch(latestInfo: LatestInfo): Promise<boolean>;
  fetchLatestInfo(): Promise<LatestInfo | null>;
  getAvailableBatchIds(): Promise<string[] | null>;
}
