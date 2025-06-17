// API Response Types for Problem Batch Sync
import { SolutionStep } from '../problemGeneration/openaiGenerator';

export interface LatestInfoResponse {
  batchId: string;
  hash: string;
  url: string;
  generationDate: string; // ISO string
  problemCount: number;
}

export interface ProblemBatchApiResponse {
  id: string;
  generationDate: string; // ISO string
  problemCount: number;
  problems: ProblemApiData[];
}

export interface ProblemApiData {
  id?: string;
  equation: string;
  direction: string;
  answer: string | number | number[];
  answerLHS?: string;
  answerRHS?: string | number | number[];
  solutionSteps: SolutionStep[];
  variables: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  problemType: string;
}

export interface BatchManifestResponse {
  batches: BatchManifestItem[];
  lastUpdated: string; // ISO string
}

export interface BatchManifestItem {
  id: string;
  generationDate: string; // ISO string
  problemCount: number;
  url: string;
  hash: string;
}

// Batch Info Types (for UI)
export interface BatchInfo {
  id: string;
  completedCount: number;
  problemCount: number;
  generationDate: string;
  importedAt: string;
  isCurrentBatch?: boolean;
  sourceUrl?: string | null;
}

export interface BatchProgressInfo {
  batchId: string;
  totalProblems: number;
  completedCount: number;
  generationDate: string;
}

// BatchManager specific info structure
export interface BatchManagerInfo {
  local: {
    totalBatches: number;
    totalProblems: number;
    completedProblems: number;
    oldestBatch: string | null;
    newestBatch: string | null;
  };
  lastSync: string | null;
}

// HTTP Response wrapper
export interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

// Error response type
export interface ApiError {
  message: string;
  code?: string;
  status: number;
}
