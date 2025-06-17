# Algebro - Development Changelog

A mobile algebra learning app built with React Native and Expo.

## Latest Updates

### **June 16, 2025** – Codebase Architecture Refactor

#### Service layer restructuring and dependency injection
- **Sync service refactor**: Replaced monolithic `ProblemSyncService` with modular architecture following SOLID principles
- **Interface-based design**: Added service contracts for HTTP, caching, and sync operations with concrete implementations
- **Dependency injection**: Services now use proper DI patterns instead of static methods for better testability
- **TypeScript improvements**: Fixed bad practices across services, batching, and database layers
- **Workflow fixes**: Resolved GitHub Actions build issues and CI/CD pipeline

#### Technical debt reduction
- **Separation of concerns**: Each service now has single responsibility (HTTP, caching, database operations)
- **Abstraction layers**: Services depend on interfaces rather than concrete implementations
- **Enhanced maintainability**: Easier to extend, test, and modify individual components
- **Future-ready**: New architecture supports easier feature additions and testing

### **June 13, 2024** – Full Codebase Cleanup for MathLive Integration

#### Removed all math rendering and validation systems
- **Clean slate**: Eliminated all LaTeX, WebView, and native math rendering code
- **Dependency cleanup**: Removed unused react-native-webview and related packages
- **Schema updates**: Updated problem generation to use plain text format
- **Documentation updates**: Cleaned up all math rendering references

#### Preparing for MathLive integration
- **Target: Desmos-like UX**: Planning MathLive integration for professional math input experience
- **DOM components approach**: Leveraging Expo's new DOM support for web-based math rendering
- **Validation strategy**: MathLive has built-in answer validation, eliminating custom validation complexity
- **Reference**: Using [Expo DOM Components](https://docs.expo.dev/guides/dom-components/) for web component integration

### **June 12, 2024** – Math Input UX Issues and Pivot Decision

#### Discovered critical UX problems with native approach
- **Fraction input problems**: Clicking around fraction components created poor user experience
- **Unicode limitations**: Native math renderer restricted to Unicode exponents, inadequate for complex expressions
- **Validation complexity**: Custom validation system becoming unwieldy and error-prone
- **Decision to pivot**: Realized need for a better math input solution

### **June 11, 2024** – Native Math Rendering & Interactive Fractions

#### Implemented fully native math rendering system
- **Solved the fraction display problem**: Switched from slash notation (1/2) to proper horizontal fractions with visual numerator/denominator layout
- **Interactive math objects**: Click numerator/denominator to edit specific parts
- **Smart cursor positioning**: Click between components to position typing cursor
- **Object-based input**: Math expressions stored as structured components, not raw strings
- **Avoids webviews entirely**: Pure React Native implementation using Unicode superscripts and custom layouts

#### Fixed exponent rendering compatibility
- Exponents like `x^2` display as proper superscripts (`x²`) using Unicode characters
- Smart text concatenation ensures exponent patterns work with new object system
- Maintains backward compatibility with existing math expression parsing

This completes the math rendering solution we've been working toward - proper visual fractions were the last missing piece for a complete native math input system similar to Desmos or Wolfram.

### **June 10, 2024** – Mathematical Expression Equivalence

#### Answer validation now handles equivalent expressions
- `2(x+2)` correctly accepts `2x+4` and vice versa
- Tests expressions with multiple variable values to check if they're mathematically identical
- Uses mathjs to parse expressions and evaluate equivalence

#### Fixed simplification problems being too easy
- Can't just submit the original problem with minor tweaks on simplification questions
- Still allows equivalent expressions for regular solving problems
- Checks that polynomial answers are actually simplified ( "2x + 3x" is wrong for simplification problems)

Basically made the validation smarter about when mathematical equivalence should count vs when you need to actually do the work.

### **June 9, 2024** – Schema Overhaul & Enhanced Math UX

#### Schema Restructuring
- **Separated explanations from math expressions** in step-by-step solutions
- **Structured solution steps**: `{explanation, mathExpression, isEquation}` objects vs simple strings
- **Enhanced metadata**: Added `variables` array and `direction` fields

#### Custom Math Input & Rendering
- **Math keyboard**: Dedicated buttons for fractions, exponents, parentheses, and dynamic variables
- **Real-time validation**: Live green/red/orange feedback as user types
- **Improved step display**: Clean separation of explanatory text vs math expressions
- **Still evaluating**: WebView rendering vs SVG/native alternatives for performance

#### Batch Management
- **Auto-cleanup**: Orphaned batches removed during sync
- **Management UI**: Settings screen for manual batch deletion and storage stats
- **Better control**: Individual batch deletion and force cleanup options

Made solid UX progress with structured schema and custom input system, but math rendering approach still under evaluation.

### **June 6, 2024** – Modular Refactor & Math Rendering

#### GitHub Job/S3/Sync Code Refactoring
The monolithic GitHub Job/S3/Sync code was becoming unwieldy and has been refactored into a collection of focused TypeScript **modules** located under `services/problemGeneration/`:

| Module | Responsibility |
| ------- | -------------- |
| `constants.ts` | Shared enums / look-up tables for difficulty & problem types |
| `instructions.ts` | Returns problem-type and difficulty-specific prompt snippets |
| `validation.ts` | Utility helpers for calculator-free checks & answer-format validation |
| `schema.ts` | Builds the JSON-Schema passed to the OpenAI Responses API |
| `openaiGenerator.ts` | Calls the Responses API and returns typed `GeneratedProblem[]` |
| `batchGenerator.ts` | Orchestrates multi-difficulty batches (exporting `configureProblemsPerBatch`) |
| `s3Uploader.ts` | Uploads a batch and updates `latest.json` in S3 |

#### Math Rendering Research
Began investigating approaches for rendering complex mathematical expressions, specifically **exponents** and **fractions**. Currently evaluating three potential solutions:
- **WebView approach**: Embedding MathJax/KaTeX for full LaTeX support
- **SVG rendering**: Custom or library-based SVG generation for math expressions
- **Custom native implementation**: Building our own math renderer if feasible

Decision still pending based on performance, bundle size, and maintenance considerations.

### **June 5, 2024** - Device Sync & Answer Validation
- **S3 batch synchronization**: Problems now sync from S3 to device automatically
- **Robust answer validation**: Fixed mathjs-based validation for expressions like "30+6" vs 36
- **Bug fixes**: Resolved validation inconsistencies across mock and SQLite databases
- **Improved error handling**: Better sync failure recovery and user feedback
- **New Model**: switched to o4-mini reasoning model (still cheap)

### **June 4, 2024** - Automated Problem Generation
- **GitHub Actions setup**: Automated daily problem generation workflow
- **S3 integration**: Generated problems uploaded to S3 bucket for distribution
- **OpenAI API integration**: OpenAI Responses API (o4-mini-2025-04-16) generates algebra problems with structured output
- **CI/CD pipeline**: Secure API key management and automated deployment

### **June 3, 2024** - UI Polish & Data Architecture
- **Bundled JSON data**: Replaced hardcoded data with `assets/data/sampleProblems.json`
- **Home tab implementation**: Welcome screen with progress dashboard and daily tips
- **Enhanced offline capability**: Problems bundled with app, no network required
- **Navigation polish**: Complete four-tab navigation system

### **June 2, 2024** - Database Foundation
- **SQLite implementation**: Migrated from mock to persistent SQLite database
- **Schema design**: Problem batches, user progress, and comprehensive tracking
- **Transaction support**: Robust database operations with error handling
- **Progress persistence**: Statistics and state maintained across app restarts

---

## Current Architecture

**Tech Stack**
- React Native with Expo 53.0
- SQLite (expo-sqlite) for persistence
- Zustand for state management
- Expo Router with tab navigation
- TypeScript with strict checking

**Key Features**
- Four-tab navigation (Home, Practice, Progress, Settings)
- Algebra problem solving with step-by-step solutions
- Real-time answer validation using mathjs
- Progress tracking and statistics
- Offline functionality with bundled problems
- Automated problem generation via GitHub Actions

**Database**
- SQLite with persistent storage

---

## Project Structure

```
app/(tabs)/          # Tab screens (home, practice, progress, settings)
components/          # Reusable UI components
services/database/   # Data layer and SQLite services
store/              # Zustand state management
assets/data/        # Bundled problem sets
scripts/            # Problem generation and utilities
```

**Problem Types**
- `linear-one-variable`: Basic equations (e.g., "2x + 5 = 15")
- `quadratic-simple`: Simple quadratics (e.g., "x^2 - 4 = 0")
- Difficulty levels: easy, medium, hard

**Answer Validation**
- Supports mathematical expressions: "30+6" equals 36
- Algebraic equivalence: "x*2" equals "2*x" (still more to work on for more complex expression)
- Integer and simple fraction answers only (no calculator required)


#### Central logger

A lightweight logger (`utils/logger.ts`) replaces scattered `console.*` calls.
Verbosity can be tuned with `LOG_LEVEL` (`debug`, `info`, `warn`, `error`,
`silent`). The logger is automatically used across the data layer and sync
service – production builds are far less chatty now.

```bash
LOG_LEVEL=warn expo run:android   # silent except warnings & errors
LOG_LEVEL=debug node someScript   # full debug output
```

#### Database interface

`services/database/types.ts` defines an `IDatabase` contract that the SQLite implementation uses for consistent CRUD operations.
