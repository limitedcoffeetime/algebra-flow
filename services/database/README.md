# SQLite Database for Algebro

## Overview

This is a clean SQLite implementation for storing algebra problems, problem batches, and user progress. No complex testing setup - just working database code.

## Structure

### Tables

1. **ProblemBatches** - Collections of problems (e.g., daily sets)
   - `id`: Unique identifier
   - `generationDate`: When the problems were generated
   - `sourceUrl`: Future S3 URL reference
   - `problemCount`: Number of problems in batch
   - `importedAt`: When imported to local DB

2. **Problems** - Individual algebra problems
   - `id`: Unique identifier
   - `batchId`: Which batch this belongs to
   - `equation`: The algebra equation (e.g., "3y - 7 = 14")
   - `answer`: The correct answer
   - `solutionSteps`: Array of step-by-step solution
   - `difficulty`: easy/medium/hard
   - `isCompleted`: Whether user has attempted
   - `userAnswer`: What the user answered

3. **UserProgress** - Tracks user's overall progress
   - `currentBatchId`: Which batch they're working on
   - `problemsAttempted`: Total attempted
   - `problemsCorrect`: Total correct
   - `lastSyncTimestamp`: For future S3 sync

## Basic Usage

### Direct Database Access

```javascript
import { db } from '@/services/database';

// Initialize database (run once on app start)
await db.init();

// Seed with dummy data (for development)
await db.seedDummy();

// Get next problem for user
const problem = await db.getNextProblem();

// Submit an answer
await db.submitAnswer(problemId, userAnswer, isCorrect);

// Get user progress
const progress = await db.getUserProgress();
```

### Using with Zustand Store (Recommended)

```javascript
import { useProblemStore } from '@/store/problemStore';

// In your component
const {
  currentProblem,
  userProgress,
  isLoading,
  error,
  initialize,
  loadNextProblem,
  submitAnswer
} = useProblemStore();

// Initialize on mount
useEffect(() => {
  initialize();
}, []);
```

## Adding New Problems

Currently using dummy data. To add new problems:

1. Update `services/database/dummyData.ts`
2. Or use `db.addBatch()` to add programmatically:

```javascript
await db.addBatch(
  {
    generationDate: new Date().toISOString(),
    problemCount: 2
  },
  [
    {
      equation: "2x + 5 = 15",
      answer: "5",
      solutionSteps: ["Step 1...", "Step 2..."],
      difficulty: "easy",
      problemType: "linear-one-variable",
      isCompleted: false
    }
  ]
);
```

## Future AWS S3 Integration

The structure is ready for S3 integration:

1. Problems will be generated via LLM and stored on S3
2. App will sync daily to download new batches
3. `sourceUrl` field will store the S3 URL
4. `lastSyncTimestamp` tracks when last synced

## Files

- `schema.ts` - Database table definitions
- `db.ts` - Database connection management
- `problemBatchService.ts` - Batch operations
- `problemService.ts` - Problem operations
- `userProgressService.ts` - User progress tracking
- `dummyData.ts` - Sample data for development
- `index.ts` - Main API interface
