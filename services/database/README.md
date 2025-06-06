# SQLite Database for Algebro

## Overview

Database layer supporting both SQLite (production) and Mock DB (development) for storing algebra problems, batches, and user progress. Features active S3 integration with daily problem generation and sync.

## Database Mode

**Environment Variable: `EXPO_PUBLIC_USE_MOCK_DB`**
- `true`: Uses Mock Database (in-memory, for development)
- `false/unset`: Uses SQLite (persistent, for production)

Check current mode via `getDatabaseType()`.

## Table Structure

### ProblemBatches
- `id` - Unique batch ID: `YYYY-MM-DD-HHMMSS-XXXX` (e.g., "2025-01-15-143052-a7d2")
  - Date + time + random suffix to handle multiple batches per day
- `generationDate` - ISO timestamp when generated
- `sourceUrl` - S3 URL where batch was fetched from
- `problemCount` - Number of problems in batch
- `importedAt` - When imported to local DB

### Problems
- `id` - UUID
- `batchId` - Links to ProblemBatch
- `equation` - Algebra equation string
- `answer` - Correct answer (stored as string)
- `solutionSteps` - JSON array of solution steps
- `difficulty` - "easy", "medium", or "hard"
- `problemType` - Problem category (e.g., "linear-one-variable")
- `isCompleted` - User completion status
- `userAnswer` - User's submitted answer
- `solutionStepsShown` - Whether user viewed solution

### UserProgress
- `currentBatchId` - Active batch being worked on
- `problemsAttempted` - Total problems attempted
- `problemsCorrect` - Total correct answers
- `lastSyncTimestamp` - Last S3 sync time

## S3 Integration & Sync

### Daily Problem Generation
- **GitHub Action** runs daily at 2 AM UTC
- **OpenAI API** generates 5 problems per batch (40% easy, 40% medium, 20% hard)
- **S3 Storage**: Problems uploaded to S3 bucket with `latest.json` pointer

### Sync Process
- **ProblemSyncService** checks for new problems every 20+ hours
- Downloads `latest.json` from S3 to check for updates
- Compares hash to detect new content
- Automatically imports new batches, replacing same-date batches if needed
- **Manual sync** available in Settings screen

### Sync Behavior
- `SKIPPED_EXISTING` - Batch already exists (same ID)
- `REPLACED_EXISTING` - Replaced same-date batch with newer version
- `IMPORTED_NEW` - Imported completely new batch

## Usage

### Basic Database Operations
```javascript
import { db } from '@/services/database';

// Initialize (creates tables, seeds dummy data if empty)
await db.init();

// Get next unsolved problem
const problem = await db.getNextProblem();

// Submit answer
await db.submitAnswer(problemId, userAnswer, isCorrect);

// Get user progress
const progress = await db.getUserProgress();

// Reset all progress
await db.resetUserProgress();
```

### Using with Zustand Store
```javascript
import { useProblemStore } from '@/store/problemStore';

const { currentProblem, userProgress, initialize, submitAnswer, forceSync } = useProblemStore();
```

### Manual Sync
```javascript
import { ProblemSyncService } from '@/services/problemSyncService';

// Check if sync needed
const shouldSync = await ProblemSyncService.shouldSync();

// Force sync
const hasNewProblems = await ProblemSyncService.forceSyncCheck();
```

## Files

- `index.ts` - Main database interface
- `schema.ts` - Table definitions and types
- `db.ts` - SQLite connection management
- `mockDb.ts` - In-memory database for development
- `*Service.ts` - Service layer for each table
- `dummyData.ts` - Sample data for initialization
