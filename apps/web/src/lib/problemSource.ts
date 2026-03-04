import { latestInfoSchema, problemBatchSchema } from './schemas';
import { LatestInfo, ProblemBatchApiResponse } from './types';

export interface ProblemSource {
  fetchLatest(latestUrl: string): Promise<LatestInfo>;
  headLatest(latestUrl: string): Promise<{ ok: boolean; status: number }>;
  fetchBatch(batchUrl: string): Promise<ProblemBatchApiResponse>;
}

export class S3ProblemSource implements ProblemSource {
  async fetchLatest(latestUrl: string): Promise<LatestInfo> {
    const response = await fetch(latestUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch latest.json (HTTP ${response.status})`);
    }

    const payload = await response.json();
    return latestInfoSchema.parse(payload);
  }

  async headLatest(latestUrl: string): Promise<{ ok: boolean; status: number }> {
    const response = await fetch(latestUrl, {
      method: 'HEAD',
      cache: 'no-store',
    });

    return {
      ok: response.ok,
      status: response.status,
    };
  }

  async fetchBatch(batchUrl: string): Promise<ProblemBatchApiResponse> {
    const response = await fetch(batchUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch batch payload (HTTP ${response.status})`);
    }

    const payload = await response.json();
    return problemBatchSchema.parse(payload);
  }
}
