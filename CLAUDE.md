# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev  # Development variant with APP_VARIANT=development
expo start   # Standard Expo dev server
```

**Platform-specific builds:**
```bash
npm run ios      # Run on iOS simulator
npm run android  # Run on Android emulator
npm run web      # Run in web browser
```

**Linting and type checking:**
```bash
npm run lint     # ESLint with Expo config
npx tsc --noEmit # TypeScript type checking (no dedicated script)
```

## Architecture Overview

This is a React Native Expo app for algebra learning with offline-first architecture and automated problem generation.

### Core Architecture Patterns

**Repository Pattern with Domain Services:**
- `repositories/` - Data access layer with interfaces and SQLite implementations
- `services/domain/` - Business logic layer that orchestrates repositories
- `store/` - Zustand state management for UI state
- All database operations flow through domain services, never direct repository access from UI

**Modular Sync Architecture:**
- `services/sync/` - Interface-based sync system with dependency injection
- `SyncService` orchestrates HTTP, caching, and batch operations
- Concrete implementations in `services/sync/implementations/`
- Daily sync from S3 with intelligent caching and automatic batch cleanup

**Problem Generation Pipeline:**
- GitHub Actions workflow generates problems daily using OpenAI API
- Structured JSON schema ensures consistent problem format
- Problems uploaded to S3, then synced to devices
- Support for multiple problem types: linear equations, quadratics, systems of equations

### Key Data Models

**Problem Structure:**
- Legacy `equation` field + new `equations[]` array for systems support
- `solutionSteps[]` with separated explanations and LaTeX math expressions
- Support for both single answers and arrays (quadratic solutions, coordinate pairs)
- `answerLHS`/`answerRHS` pattern for "solve for x" vs direct answers

**Database Schema:**
- SQLite with foreign key constraints and cascading deletes
- `ProblemBatches` → `Problems` → User progress tracking
- Batch-based problem management for efficient sync and cleanup

### Component Architecture

**Math Input & Rendering:**
- MathLive integration via Expo DOM components for professional math input
- LaTeX format throughout the system for consistent math expressions
- `TrainingMathInput.tsx` handles the complex MathLive initialization and rendering
- Real-time validation with visual feedback (green/red/orange states)

**Navigation:**
- Expo Router with tab-based navigation
- Four main tabs: Home (dashboard), Practice, Progress (statistics), Settings
- `app/(tabs)/` structure with TypeScript support

## Key Technical Details

**State Management:**
- Zustand stores: `appStore` (initialization), `problemStore` (current problem), `syncStore` (sync status), `userProgressStore` (statistics)
- Stores call domain services, never repositories directly
- Global error handling with `ErrorStrategy` enum

**Problem Validation:**
- MathJS-based equivalence checking for algebraic expressions
- Different validation rules for "simplification" vs "solving" problems
- Supports fractions in LaTeX format (`\frac{a}{b}`) and integer answers

**Logging & Error Handling:**
- Centralized logger in `utils/logger.ts` with configurable LOG_LEVEL
- Structured error handling with `ErrorStrategy` (THROW, RETURN_NULL, RETURN_FALSE, SILENT)
- Production builds are less verbose

**Sync Strategy:**
- Check S3 daily for new problem batches
- Hash-based caching prevents unnecessary downloads
- Automatic cleanup of unused local batches
- Force sync capability for testing/debugging

## Important Development Notes

**Database Operations:**
- Always use domain services (`databaseService.problems`, `databaseService.batches`, etc.)
- Never import repositories directly in components or stores
- All database dates stored as TEXT (ISO strings), converted to Date objects in models

**Math Expression Handling:**
- Internal format is LaTeX for consistency
- MathLive handles conversion between LaTeX and visual representation
- Validation works with both LaTeX and plain text inputs

**Problem Generation:**
- GitHub Actions workflow in `.github/workflows/generate-problems.yml`
- Uses OpenAI Structured Outputs API with JSON schema validation
- S3 bucket structure: daily batches + `latest.json` pointer

**Testing Strategy:**
- No formal test framework currently configured
- Manual testing workflow focusing on math validation and sync operations
- Use development variant (`npm run dev`) for testing with enhanced logging