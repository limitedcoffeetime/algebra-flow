# Database Infrastructure

This directory contains the core database infrastructure components that support the new repository pattern implementation.

## Architecture Change

⚠️ **Important**: The database service files (`problemService.ts`, `problemBatchService.ts`, etc.) have been **removed** and replaced with a clean repository pattern implementation.

**Use the new services instead:**
```typescript
// OLD (removed)
import { db } from '@/services/database';

// NEW (use this)
import { databaseService } from '@/services/domain';
```

## What Remains

This directory now contains only the **core infrastructure** needed by the repository implementations:

### Core Files

- **`db.ts`** - SQLite database connection and transaction utilities
- **`schema.ts`** - Database table definitions and SQL schema
- **`utils.ts`** - Utility functions (ID generation, etc.)

### Data Loading

- **`dummyData.ts`** - Dummy data provider for development/testing
- **`sampleDataLoader.ts`** - JSON data loader for sample problems

## Migration Guide

If you have code importing from `@/services/database`, update it:

```typescript
// OLD - these no longer exist
import { getProblemById } from '@/services/database/problemService';
import { importProblemBatch } from '@/services/database/problemBatchService';
import { getUserProgress } from '@/services/database/userProgressService';
import { db } from '@/services/database';

// NEW - use domain services
import { databaseService } from '@/services/domain';

// Examples:
const problem = await databaseService.problems.getById(id);
const result = await databaseService.batches.import(batchData);
const progress = await databaseService.userProgress.get();
```

## Repository Pattern

The new architecture separates concerns:

- **Infrastructure** (this directory): Database connection, schema, utilities
- **Repositories** (`/repositories`): Clean data access interfaces and implementations
- **Domain Services** (`/services/domain`): High-level business operations

See `/repositories/README.md` for complete documentation.

## Database Schema

The SQLite schema is defined in `schema.ts` and remains unchanged. The new repository implementations are fully compatible with the existing database structure.
