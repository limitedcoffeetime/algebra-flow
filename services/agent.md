# AI Agent Guide: Services Directory

> **Context**: This directory implements the Service Layer of Clean Architecture. Services handle business logic and orchestrate between stores and repositories. This is the heart of the application's business logic.

## 🤖 AI Agent Instructions

### When Working in This Directory
**You are working in the SERVICE LAYER. This means:**
- **Business logic lives here** - Not in stores or components
- **Dependency inversion is critical** - Always depend on interfaces
- **Single responsibility per service** - Each service has one clear domain
- **NO direct UI concerns** - Services are UI-agnostic

### Critical Architecture Rules
1. **ALWAYS use dependency injection** - Services receive dependencies via constructor
2. **NEVER import concrete database classes** - Use repository interfaces only
3. **MAINTAIN separation between domain and infrastructure** - Keep them in separate directories
4. **FOLLOW consistent error handling** - Use the centralized error handler

## Service Architecture Patterns

### Domain Services Pattern (`domain/`)
```typescript
// ✅ CORRECT: Domain service structure
export class [Domain]Service {
  constructor(
    private [domain]Repository: I[Domain]Repository,  // Interface, not concrete
    private logger: ILogger                           // Interface, not concrete
  ) {}

  async [businessOperation](): Promise<[DomainType]> {
    try {
      // Business logic here
      const data = await this.[domain]Repository.getData();
      // Process business rules
      return processedData;
    } catch (error) {
      return handleError(error, '[domain] operation', ErrorStrategy.THROW);
    }
  }
}
```

### Infrastructure Services Pattern (`sync/`)
```typescript
// ✅ CORRECT: Infrastructure service with interface
export interface IHttpService {
  post<T>(url: string, data: any): Promise<T>;
  get<T>(url: string): Promise<T>;
}

export class HttpService implements IHttpService {
  async post<T>(url: string, data: any): Promise<T> {
    // Implementation details
  }
}
```

## Current Service Structure

### Domain Services (`domain/`)
- **DatabaseService.ts** → Orchestrates repositories, handles transactions
- **ProblemService.ts** → Problem generation, validation, answer checking
- **UserProgressService.ts** → Progress calculation, achievement logic

### Infrastructure Services (`sync/`)
- **Interfaces** → All service contracts (`ISyncService`, `IHttpService`, etc.)
- **Implementations** → Concrete implementations of interfaces
- **Main Services** → Orchestrating services that use multiple dependencies

## Code Generation Guidelines

### Adding New Domain Service
```typescript
// ✅ CORRECT: Follow this exact pattern
export class NewDomainService {
  constructor(
    private newDomainRepository: INewDomainRepository,
    private logger: ILogger = logger
  ) {}

  async performBusinessOperation(input: InputType): Promise<OutputType> {
    try {
      // 1. Validate business rules
      this.validateBusinessRules(input);

      // 2. Repository operations
      const data = await this.newDomainRepository.getData(input.id);

      // 3. Apply business logic
      const processedData = this.applyBusinessLogic(data, input);

      // 4. Persist changes
      await this.newDomainRepository.save(processedData);

      return processedData;
    } catch (error) {
      return handleError(error, 'new domain operation', ErrorStrategy.THROW);
    }
  }

  private validateBusinessRules(input: InputType): void {
    // Business validation logic
  }

  private applyBusinessLogic(data: DataType, input: InputType): ProcessedType {
    // Business transformation logic
  }
}
```

### Adding New Infrastructure Service
```typescript
// 1. First create interface
export interface INewInfraService {
  operation(param: ParamType): Promise<ResultType>;
}

// 2. Then create implementation
export class NewInfraService implements INewInfraService {
  constructor(
    private dependency: IDependency
  ) {}

  async operation(param: ParamType): Promise<ResultType> {
    try {
      // Infrastructure logic
      return await this.performInfraOperation(param);
    } catch (error) {
      return handleError(error, 'infra operation', ErrorStrategy.THROW);
    }
  }
}
```

## Dependency Injection Patterns

### Service Dependencies
```typescript
// ✅ CORRECT: Services depend on abstractions
class SyncService {
  constructor(
    private databaseService: DatabaseService,        // Domain service
    private httpService: IHttpService,               // Interface
    private cacheService: ICacheService,             // Interface
    private batchService: IBatchSyncService          // Interface
  ) {}
}

// ❌ WRONG: Depending on concrete implementations
class BadSyncService {
  constructor(
    private sqliteDb: SQLiteDatabase,                // Concrete - WRONG!
    private fetchClient: FetchClient                 // Concrete - WRONG!
  ) {}
}
```

### Service Instantiation
```typescript
// ✅ CORRECT: Factory pattern for wiring dependencies
export function createSyncService(): SyncService {
  return new SyncService(
    databaseService,                    // Injected
    new HttpService(),                  // Concrete implementation
    new AsyncStorageCacheService(),     // Concrete implementation
    new BatchSyncService()              // Concrete implementation
  );
}
```

## Common AI Tasks

### Task: Add business logic to existing service
1. Identify correct domain service
2. Add method following async pattern
3. Include proper error handling
4. Add business validation if needed
5. Update TypeScript interfaces

### Task: Create new service interface
1. Define in appropriate interfaces directory
2. Use generic types where appropriate
3. Include error scenarios in contract
4. Create implementation class
5. Add to dependency injection setup

### Task: Modify service dependencies
1. Check all consumers of the service
2. Update constructor signature
3. Update factory/injection setup
4. Ensure interface contracts maintained
5. Update tests accordingly

## Error Handling Requirements

### Consistent Error Pattern
```typescript
// ✅ ALWAYS use this pattern in services
import { handleError, ErrorStrategy } from '../utils/errorHandler';

async serviceMethod(): Promise<ReturnType> {
  try {
    // Service logic
    return result;
  } catch (error) {
    return handleError(
      error,
      'descriptive context',
      ErrorStrategy.THROW  // or appropriate strategy
    );
  }
}
```

### Error Strategy Selection
- **ErrorStrategy.THROW** - For critical business operations
- **ErrorStrategy.RETURN_NULL** - For optional data fetching
- **ErrorStrategy.RETURN_FALSE** - For validation operations
- **ErrorStrategy.SILENT** - For logging/analytics (rare)

## Anti-Patterns to Avoid

```typescript
// ❌ NEVER DO THESE:

// Don't access UI concerns in services
class BadService {
  async operation() {
    Alert.alert('Error occurred'); // WRONG! UI in service layer
  }
}

// Don't import concrete database classes
import { SQLiteDatabase } from 'expo-sqlite'; // WRONG!

// Don't bypass error handling
async badMethod() {
  const data = await repository.getData(); // No try/catch - WRONG!
  return data;
}

// Don't mix business and infrastructure concerns
class MixedService {
  async businessOperation() {
    // Business logic
    const result = this.calculateSomething();

    // HTTP call - WRONG! Should be separate service
    await fetch('/api/save', { method: 'POST', body: result });
  }
}

// Don't create circular dependencies
class ServiceA {
  constructor(private serviceB: ServiceB) {} // If ServiceB depends on ServiceA - WRONG!
}
```

## Testing Patterns

### Service Testing
```typescript
// ✅ CORRECT: Mock dependencies for isolated testing
describe('DomainService', () => {
  let service: DomainService;
  let mockRepository: jest.Mocked<IDomainRepository>;

  beforeEach(() => {
    mockRepository = {
      getData: jest.fn(),
      save: jest.fn()
    };
    service = new DomainService(mockRepository);
  });

  test('business operation', async () => {
    mockRepository.getData.mockResolvedValue(mockData);

    const result = await service.performOperation(input);

    expect(result).toEqual(expectedOutput);
    expect(mockRepository.save).toHaveBeenCalledWith(expectedData);
  });
});
```

## Integration Points
- **Stores call domain services** - Never repositories directly
- **Services call other services** - Through interfaces when possible
- **Services use repositories** - Through interfaces always
- **Infrastructure services** - Provide technical capabilities

## File Organization Rules
- **Domain services** → `domain/[DomainName]Service.ts`
- **Infrastructure interfaces** → `[category]/interfaces/I[ServiceName].ts`
- **Infrastructure implementations** → `[category]/implementations/[ServiceName].ts`
- **Main orchestrating services** → `[category]/[ServiceName].ts`

---
**🎯 Key Success Metrics**: Proper dependency injection, interface usage, consistent error handling, clear separation of concerns, no UI dependencies
