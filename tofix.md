# Codebase Issues To Fix

## Priority 1: Critical Issues (Fix First)

### 1. Fix TypeScript Configuration
**File**: `tsconfig.json`
**Problem**: `noImplicitAny: false` disables TypeScript safety
**Fix**: Change to `"noImplicitAny": true`
**Impact**: Prevents runtime errors by catching type issues at compile time
**Principles Violated**: **Type Safety**, **Fail Fast**

### 2. Implement Consistent Error Handling
**Files**: Throughout codebase
**Problems**:
- Empty catch blocks: `} catch { }`
- Inconsistent error logging (some use logger, some don't)
- Mixed strategies (throw, set state, alert)

**Fix**: Create consistent error handling:
```typescript
// utils/errorHandler.ts
export const handleError = (error: Error, context: string) => {
  logger.error(`${context}:`, error);
  // Add crash reporting here if needed
  throw error; // Or handle appropriately
};
```

**Example locations to fix**:
- `utils/enhancedAnswerUtils.ts` - has silent `} catch { }` blocks
- Multiple database service files
- Components with inconsistent error handling

**Principles Violated**: **Fail Fast**, **Observable Systems**, **Defensive Programming**

## Priority 2: Architecture Issues (Fix Second)

### 3. Break Down Large Components
**File**: `app/(tabs)/index.tsx` (436 lines)
**Problems**:
- Single component handling validation, submission, UI rendering, state management
- Massive `useMemo` dependency arrays
- Mixed concerns in one file

**Fix**: Split into smaller components:
- `ProblemDisplay` component
- `AnswerInput` component
- `ValidationFeedback` component
- Custom hooks for validation logic

**Principles Violated**: **Single Responsibility Principle (SRP)**, **Separation of Concerns**, **High Cohesion**

### 4. Split the Monolithic Store
**File**: `store/problemStore.ts`
**Problem**: Single store handling problems, sync, and progress
**Fix**: Create separate focused stores:
- `problemStore.ts` (just problem state)
- `syncStore.ts` (sync operations)
- `userProgressStore.ts` (user progress)

**Principles Violated**: **Single Responsibility Principle (SRP)**, **Separation of Concerns**, **Interface Segregation Principle**

### 5. Fix Real-Time Validation Hook
**File**: `utils/useRealTimeValidation.ts`
**Problems**:
- `JSON.stringify` for memoization (performance killer)
- No cancellation for async operations
- Complex dependencies

**Fix**:
- Replace `JSON.stringify` with proper dependency comparison
- Add cleanup for async operations
- Simplify hook responsibilities

**Principles Violated**: **Single Responsibility Principle (SRP)**, **Performance Optimization**, **Resource Management**

## Priority 3: Service Layer Issues (Fix Third)

### 6. Separate Database Service Concerns
**Files**: `services/database/` (10+ files)
**Problems**:
- Overlapping responsibilities
- No clear data access layer
- Direct database calls in components/stores

**Fix**: Create repository pattern:
```typescript
// repositories/ProblemRepository.ts
interface IProblemRepository {
  getNextProblem(): Promise<Problem>;
  submitAnswer(id: string, answer: string): Promise<void>;
}
```

**Principles Violated**: **Single Responsibility Principle (SRP)**, **Dependency Inversion Principle (DIP)**, **Separation of Concerns**, **Loose Coupling**

### 7. Refactor Sync Service
**File**: `services/problemSyncService.ts`
**Problems**:
- Single class doing HTTP, caching, database, cleanup
- Static methods (hard to test)
- No dependency injection

**Fix**:
- Split into focused services
- Add proper abstraction layers
- Make testable with dependency injection

**Principles Violated**: **Single Responsibility Principle (SRP)**, **Open/Closed Principle (OCP)**, **Dependency Inversion Principle (DIP)**, **Testability**

## Optimal Implementation Order (Topological Sort)

To minimize rework and avoid fixing the same code multiple times, implement in this order:

### Phase 1: Foundation (Independent Fixes)
1. **TypeScript Configuration** - Independent, affects all future code
2. **Error Handling** - Independent, helps debug everything else

### Phase 2: Service Layer (Dependencies for UI Layer)
3. **Database Service Separation** - Creates clean interfaces for stores to use
4. **Sync Service Refactor** - Uses database services, independent of UI

### Phase 3: State Management (Dependencies for Components)
5. **Store Splitting** - Uses the cleaned database interfaces
6. **Validation Hook Fix** - Used by components, independent of store structure

### Phase 4: UI Layer (Depends on Everything Else)
7. **Component Breakdown** - Uses stores and validation hook

## Why This Order Minimizes Rework

**Dependencies Flow**:
```
TypeScript Config → Everything
Error Handling → Everything
Database Services → Stores & Sync Service
Sync Service → (independent after database cleanup)
Stores → Components
Validation Hook → Components
Components → (final layer)
```

**Benefits**:
- **No backwards dependencies** - you never have to revisit completed fixes
- **Clean interfaces first** - service layer cleanup provides stable APIs for UI layer
- **Foundation first** - TypeScript and error handling catch issues in later phases
- **Test-friendly order** - each phase can be tested independently before moving on

## Notes
- Keep the logger - it's well implemented and heavily used
- These issues will compound as you add features
- Current structure will make offline support, user accounts, social features difficult to add
