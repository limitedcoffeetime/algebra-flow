# AI Agent Guide: Repositories Directory

> **Context**: This directory implements the Repository Pattern for data access in Clean Architecture. Repositories provide a clean abstraction over database operations and follow SOLID principles.

## 🤖 AI Agent Instructions

### When Working in This Directory
**You are working in the DATA ACCESS LAYER. This means:**
- **Repositories provide clean interfaces** - Abstract database operations
- **Interface segregation is critical** - Each repository handles one aggregate root
- **No business logic** - Pure data access operations only
- **Database-agnostic contracts** - Interfaces must work with any database

### Critical Architecture Rules
1. **ALWAYS define interfaces first** - Then create implementations
2. **NEVER put business logic in repositories** - Only data access operations
3. **MAINTAIN aggregate root boundaries** - One repository per domain entity
4. **FOLLOW dependency inversion** - Depend on abstractions, not concrete implementations

## Repository Architecture Patterns

### Interface Definition Pattern
```typescript
// ✅ CORRECT: Interface defines contract for data access
export interface IProblemRepository {
  findById(id: string): Promise<Problem | null>;
  findByBatchId(batchId: string): Promise<Problem[]>;
  create(problem: CreateProblem): Promise<Problem>;
  update(id: string, updates: UpdateProblem): Promise<Problem>;
  delete(id: string): Promise<void>;
}
```

### Implementation Pattern
```typescript
// ✅ CORRECT: Implementation handles specific database operations
export class SqliteProblemRepository implements IProblemRepository {
  constructor(private db: SQLiteDatabase) {}

  async findById(id: string): Promise<Problem | null> {
    try {
      const result = await this.db.getAllAsync<ProblemRow>(
        'SELECT * FROM problems WHERE id = ?',
        [id]
      );
      return result.length > 0 ? this.mapToDomain(result[0]) : null;
    } catch (error) {
      return handleError(error, 'finding problem by id', ErrorStrategy.THROW);
    }
  }

  private mapToDomain(row: ProblemRow): Problem {
    // Map database row to domain model
    return {
      id: row.id,
      equation: row.equation,
      createdAt: new Date(row.created_at),
      // ... other mappings
    };
  }
}
```

### Factory Pattern
```typescript
// ✅ CORRECT: Factory manages repository instances and dependencies
export interface IRepositoryFactory {
  problemRepository(): IProblemRepository;
  batchRepository(): IProblemBatchRepository;
  userProgressRepository(): IUserProgressRepository;
}

export class RepositoryFactory implements IRepositoryFactory {
  constructor(private db: SQLiteDatabase) {}

  problemRepository(): IProblemRepository {
    return new SqliteProblemRepository(this.db);
  }
}
```

## Current Repository Structure

### Interfaces (`interfaces/`)
- **IProblemRepository.ts** → Problem CRUD operations
- **IProblemBatchRepository.ts** → Batch management operations
- **IUserProgressRepository.ts** → User progress tracking
- **IRepositoryFactory.ts** → Factory for creating repositories

### Implementations (`implementations/sqlite/`)
- **SqliteProblemRepository.ts** → SQLite-specific problem operations
- **SqliteProblemBatchRepository.ts** → SQLite-specific batch operations
- **SqliteUserProgressRepository.ts** → SQLite-specific progress operations
- **SqliteRepositoryFactory.ts** → SQLite factory implementation

### Domain Models (`models/`)
- **Problem.ts** → Clean domain model with TypeScript types
- **ProblemBatch.ts** → Batch domain model
- **UserProgress.ts** → Progress domain model

## Code Generation Guidelines

### Creating New Repository Interface
```typescript
// ✅ CORRECT: Follow this pattern for new repositories
export interface INewEntityRepository {
  // Basic CRUD operations
  findById(id: string): Promise<NewEntity | null>;
  findAll(): Promise<NewEntity[]>;
  create(data: CreateNewEntity): Promise<NewEntity>;
  update(id: string, updates: UpdateNewEntity): Promise<NewEntity>;
  delete(id: string): Promise<void>;

  // Domain-specific queries
  findBySpecificCriteria(criteria: CriteriaType): Promise<NewEntity[]>;

  // Aggregation operations
  getStatistics(): Promise<EntityStatistics>;
}
```

### Creating Repository Implementation
```typescript
// ✅ CORRECT: SQLite implementation pattern
export class SqliteNewEntityRepository implements INewEntityRepository {
  constructor(private db: SQLiteDatabase) {}

  async findById(id: string): Promise<NewEntity | null> {
    try {
      const result = await this.db.getAllAsync<EntityRow>(
        'SELECT * FROM entities WHERE id = ?',
        [id]
      );
      return result.length > 0 ? this.mapToDomain(result[0]) : null;
    } catch (error) {
      return handleError(error, 'finding entity by id', ErrorStrategy.THROW);
    }
  }

  async create(data: CreateNewEntity): Promise<NewEntity> {
    try {
      const id = generateId();
      const now = new Date();

      await this.db.runAsync(
        'INSERT INTO entities (id, field1, field2, created_at) VALUES (?, ?, ?, ?)',
        [id, data.field1, data.field2, now.toISOString()]
      );

      const created = await this.findById(id);
      if (!created) throw new Error('Failed to create entity');

      return created;
    } catch (error) {
      return handleError(error, 'creating entity', ErrorStrategy.THROW);
    }
  }

  private mapToDomain(row: EntityRow): NewEntity {
    return {
      id: row.id,
      field1: row.field1,
      field2: row.field2,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }
}
```

### Adding to Factory
```typescript
// ✅ CORRECT: Extend factory for new repositories
export interface IRepositoryFactory {
  // Existing repositories
  problemRepository(): IProblemRepository;

  // Add new repository
  newEntityRepository(): INewEntityRepository;
}

export class RepositoryFactory implements IRepositoryFactory {
  constructor(private db: SQLiteDatabase) {}

  newEntityRepository(): INewEntityRepository {
    return new SqliteNewEntityRepository(this.db);
  }
}
```

## Common AI Tasks

### Task: Add new repository
1. Define interface in `interfaces/INewEntityRepository.ts`
2. Create domain model in `models/NewEntity.ts`
3. Implement SQLite version in `implementations/sqlite/`
4. Add to factory interface and implementation
5. Export from `index.ts`

### Task: Add new method to existing repository
1. Add method to interface first
2. Update all implementations of that interface
3. Include proper error handling
4. Add domain-specific logic if needed
5. Test the new method

### Task: Modify existing repository
1. Check what services use this repository
2. Update interface if method signature changes
3. Update all implementations
4. Ensure backward compatibility where possible
5. Update domain models if needed

## Domain Mapping Guidelines

### Database Row to Domain Model
```typescript
// ✅ CORRECT: Map database types to domain types
private mapToDomain(row: ProblemRow): Problem {
  return {
    id: row.id,
    equation: row.equation,
    difficulty: row.difficulty as DifficultyLevel,
    createdAt: new Date(row.created_at),        // String to Date
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    solutionSteps: JSON.parse(row.solution_steps || '[]'),  // JSON to array
    tags: row.tags ? row.tags.split(',') : []   // String to array
  };
}
```

### Domain Model to Database Row
```typescript
// ✅ CORRECT: Map domain types to database types
private mapToDatabase(problem: Problem): ProblemRow {
  return {
    id: problem.id,
    equation: problem.equation,
    difficulty: problem.difficulty,
    created_at: problem.createdAt.toISOString(),  // Date to string
    updated_at: problem.updatedAt?.toISOString(),
    solution_steps: JSON.stringify(problem.solutionSteps),  // Array to JSON
    tags: problem.tags.join(',')                // Array to string
  };
}
```

## Error Handling Requirements

### Repository Error Pattern
```typescript
// ✅ ALWAYS use this pattern in repositories
import { handleError, ErrorStrategy } from '../../../utils/errorHandler';

async repositoryMethod(): Promise<ReturnType> {
  try {
    // Database operations
    return result;
  } catch (error) {
    return handleError(
      error,
      'descriptive operation context',
      ErrorStrategy.THROW  // Most repository operations should throw
    );
  }
}
```

## Anti-Patterns to Avoid

```typescript
// ❌ NEVER DO THESE:

// Don't put business logic in repositories
class BadRepository {
  async findActiveProblems(): Promise<Problem[]> {
    const problems = await this.findAll();
    // Business logic - WRONG! This belongs in service layer
    return problems.filter(p => p.isActive && p.difficulty !== 'expert');
  }
}

// Don't access other repositories from within a repository
class BadRepository {
  constructor(
    private db: SQLiteDatabase,
    private userRepo: IUserRepository  // WRONG! Repository coupling
  ) {}
}

// Don't return database-specific types
class BadRepository {
  async findById(id: string): Promise<SQLiteRow> {  // WRONG! Should return domain model
    return await this.db.get('SELECT * FROM table WHERE id = ?', [id]);
  }
}

// Don't bypass error handling
class BadRepository {
  async findById(id: string): Promise<Problem | null> {
    const result = await this.db.getAllAsync('SELECT * FROM problems WHERE id = ?', [id]);
    return result[0];  // WRONG! No error handling
  }
}

// Don't mix different aggregate roots in one repository
class BadRepository implements IProblemRepository {
  async findById(id: string): Promise<Problem | null> {
    // Also handles user data - WRONG! Mixed concerns
    const userData = await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
    // ...
  }
}
```

## Testing Patterns

### Repository Testing
```typescript
// ✅ CORRECT: Test repository with real database
describe('SqliteProblemRepository', () => {
  let repository: IProblemRepository;
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    repository = new SqliteProblemRepository(db);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  test('findById returns problem when exists', async () => {
    const testProblem = await repository.create(createTestProblem());

    const found = await repository.findById(testProblem.id);

    expect(found).toEqual(testProblem);
  });
});
```

## Integration with Services

### Service Layer Usage
```typescript
// ✅ CORRECT: Services use repositories through interfaces
export class ProblemService {
  constructor(
    private problemRepository: IProblemRepository,  // Interface, not concrete
    private batchRepository: IProblemBatchRepository
  ) {}

  async getNextProblem(): Promise<Problem | null> {
    // Business logic using repositories
    const batches = await this.batchRepository.findAll();
    const activeBatch = this.selectActiveBatch(batches);  // Business logic

    if (!activeBatch) return null;

    return await this.problemRepository.findUnsolvedByBatchId(activeBatch.id);
  }
}
```

---
**🎯 Key Success Metrics**: Clean interfaces, proper error handling, domain mapping, single responsibility, no business logic in repositories
