# AI Agent Guide: Store Directory

> **Context**: This directory contains Zustand stores following Clean Architecture principles. Each store has a single responsibility and uses dependency injection.

## 🤖 AI Agent Instructions

### When Working in This Directory
**You are working with state management stores that follow SOLID principles. Each store handles exactly ONE domain concern.**

### Critical Architecture Rules
1. **NEVER merge stores** - Each store has a single responsibility
2. **ALWAYS use domain services** - Never access repositories or databases directly
3. **MAINTAIN interface contracts** - Don't break existing store interfaces
4. **FOLLOW error handling patterns** - Use consistent error strategies across stores

## Store Architecture Pattern

### Individual Store Structure
```typescript
interface [Domain]Store {
  // State - Only domain-specific state
  [domainData]: DomainType | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Only domain operations
  [domainAction]: () => Promise<void>;
  [clearError]: () => void;
}

export const use[Domain]Store = create<[Domain]Store>((set, get) => ({
  // Implementation using domain services, not direct DB access
}));
```

### Current Store Domains
- **problemStore.ts** → Problem state and operations ONLY
- **userProgressStore.ts** → User progress tracking ONLY
- **syncStore.ts** → Synchronization operations ONLY
- **appStore.ts** → Application lifecycle ONLY

## Code Generation Guidelines

### Adding New Stores
```typescript
// ✅ CORRECT: Follow this pattern exactly
export const useNewDomainStore = create<NewDomainStore>((set, get) => ({
  // State
  domainData: null,
  isLoading: false,
  error: null,

  // Actions
  loadDomainData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Use domain service, NOT repository directly
      const data = await domainService.getDomainData();
      set({ domainData: data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
    }
  },

  clearError: () => set({ error: null })
}));
```

### Modifying Existing Stores
- **Check dependencies**: What components use this store?
- **Maintain interfaces**: Don't break existing function signatures
- **Use services**: Always go through the service layer
- **Follow error patterns**: Match existing error handling

### Store Composition (index.ts)
```typescript
// When adding new stores to composition
export const useAppStores = () => ({
  existing: useExistingStore(),
  newDomain: useNewDomainStore(), // Add here
});
```

## Dependency Patterns

### Services Used by Stores
```typescript
// Stores depend on these domain services
import { databaseService } from '../services/domain/DatabaseService';
import { syncService } from '../services/sync/SyncService';

// NEVER import repositories directly
// NEVER import database clients directly
```

### Error Handling Requirements
```typescript
// Always use this pattern for async operations
try {
  const result = await domainService.operation();
  set({ data: result, error: null });
} catch (error) {
  set({
    error: error instanceof Error ? error.message : 'Operation failed',
    isLoading: false
  });
}
```

## Common AI Tasks

### Task: Add new action to existing store
1. Identify the correct store based on domain
2. Follow existing async action pattern
3. Use appropriate domain service
4. Maintain error handling consistency
5. Update TypeScript interfaces

### Task: Create new store
1. Identify single responsibility domain
2. Create focused interface following pattern
3. Implement using domain services
4. Add to composition hooks in index.ts
5. Update exports

### Task: Fix store integration
1. Check service layer dependencies
2. Verify error handling matches pattern
3. Ensure no direct database access
4. Maintain existing interfaces

## Anti-Patterns to Avoid

```typescript
// ❌ NEVER DO THESE:

// Don't access database directly
const db = await SQLite.openDatabaseAsync('app.db');

// Don't mix domains in one store
const useMixedStore = create(() => ({
  problems: [],    // Problem domain
  progress: null,  // Progress domain - WRONG!
}));

// Don't break error handling pattern
const badAction = async () => {
  const data = await service.getData(); // No try/catch - WRONG!
  set({ data });
};

// Don't create dependencies between stores
const useProblemsStore = create(() => ({
  loadProblems: () => {
    const progress = useProgressStore.getState(); // WRONG!
  }
}));
```

## Testing Considerations
- Each store should be testable in isolation
- Mock domain services for testing
- Test error states and loading states
- Verify store composition works correctly

## Integration Points
- **Components**: Import stores via hooks
- **Services**: Stores call domain services
- **Composition**: Multiple stores composed via `useAppStores()`
- **Initialization**: Coordinated via `useInitializeApp()`

## File Naming Conventions
- `[domain]Store.ts` - Individual stores
- `index.ts` - Exports and composition
- Interfaces defined inline with implementation

---
**🎯 Key Success Metrics**: Single responsibility maintained, no direct database access, consistent error handling, clean service integration
