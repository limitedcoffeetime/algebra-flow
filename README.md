# Algebro

A comprehensive educational mobile app for practicing algebra problems with step-by-step solutions and progress tracking.

## Features

### ✅ **Core Functionality**
- **Problem Solving Interface**: Clean, mobile-optimized UI for solving algebra problems
- **Answer Validation**: Real-time feedback with numeric answer checking
- **Step-by-Step Solutions**: Collapsible solution guides for incorrect answers
- **Progress Tracking**: Track problems attempted, correct answers, and accuracy
- **Settings & Stats**: View progress statistics and manage app settings

### ✅ **Data Management**
- **SQLite Database**: Persistent local storage with proper schema design
- **Problem Batches**: Organized problem sets with metadata
- **User Progress**: Comprehensive progress tracking and statistics
- **Mock Database**: Development mode with in-memory data for testing

### ✅ **Technical Features**
- **State Management**: Zustand store for global app state
- **Error Handling**: Comprehensive error states and user feedback
- **TypeScript**: Full type safety throughout the application
- **Development Tools**: Linting, type checking, and mock data seeding

## Technical Architecture

### **Framework & Tools**
- **Framework**: React Native with Expo
- **Database**: SQLite (expo-sqlite) with WAL mode for performance
- **State Management**: Zustand for global state
- **Navigation**: Expo Router (file-based routing)
- **Language**: TypeScript with strict type checking
- **Build System**: EAS Build with multiple app variants

### **Database Schema**
```sql
-- Problem Batches: Collections of problems
ProblemBatches (id, generationDate, sourceUrl, problemCount, importedAt)

-- Individual algebra problems
Problems (id, batchId, equation, answer, solutionSteps, difficulty, problemType, isCompleted, userAnswer, solutionStepsShown, createdAt, updatedAt)

-- User progress tracking
UserProgress (id, currentBatchId, problemsAttempted, problemsCorrect, lastSyncTimestamp, createdAt, updatedAt)
```

### **State Management**
- **ProblemStore (Zustand)**: Centralized state for problems, progress, and app status
- **React State**: Local component state for UI interactions
- **Database Services**: Abstracted data access layer with transaction support

## Project Structure

```
app/
├── (tabs)/
│   ├── index.tsx          # Main problem-solving screen
│   └── settings.tsx       # Settings and progress stats
├── _layout.tsx            # Root layout with tabs
└── +not-found.tsx         # 404 screen

components/
├── Button.tsx             # Reusable button component
├── FeedbackSection.tsx    # Answer feedback with solutions
├── ProblemContainer.tsx   # Problem display component
└── StepByStepSolution.tsx # Collapsible solution steps

services/database/
├── index.ts               # Main database API
├── db.ts                  # Connection and transaction management
├── schema.ts              # TypeScript types and SQL schemas
├── problemService.ts      # Problem CRUD operations
├── problemBatchService.ts # Batch management
├── userProgressService.ts # Progress tracking
├── mockDb.ts              # In-memory database for development
├── dummyData.ts           # Seed data for development
└── utils.ts               # Database utilities

store/
└── problemStore.ts        # Zustand state management
```

## Development

### **Environment Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with mock database (for testing)
npm run dev-mock

# Build for production
eas build

# Run linting and type checking
npm run lint
npx tsc --noEmit
```

### **Database Modes**
- **Production**: Uses SQLite database with persistent storage
- **Development**: Can use either SQLite or mock in-memory database
- **Mock Mode**: Set `EXPO_PUBLIC_USE_MOCK_DB=true` for testing

### **Scripts**
- `npm run dev` - Start development server with SQLite
- `npm run dev-mock` - Start with mock database
- `npm run lint` - Run ESLint
- `npm start` - Standard Expo start
- `npm run android/ios/web` - Platform-specific builds

## Components

### **Screen Components**
- **Index (`app/(tabs)/index.tsx`)**: Main problem-solving interface with answer input and feedback
- **Settings (`app/(tabs)/settings.tsx`)**: Progress statistics, database status, and reset functionality

### **UI Components**
- **Button**: Reusable button with multiple themes
- **ProblemContainer**: Displays algebra equations with proper formatting
- **FeedbackSection**: Shows correct/incorrect feedback with solution access
- **StepByStepSolution**: Collapsible component for viewing solution steps

### **State Management**
- **useProblemStore**: Global state hook for problems, progress, and app status
- **Database Services**: Abstracted data layer with proper error handling

## Data Flow

1. **App Initialization**: Database setup, user progress loading, first problem fetch
2. **Problem Display**: Current problem rendered with equation and input field
3. **Answer Submission**: Validation, database update, progress tracking, feedback display
4. **Next Problem**: Load next unsolved problem from current batch
5. **Progress Tracking**: Statistics updated in real-time, displayed in settings

## Problem Types & Structure

### **Supported Problem Types**
- `linear-one-variable`: Basic linear equations (e.g., "2x + 5 = 15")
- `quadratic-simple`: Simple quadratic equations (e.g., "x^2 - 4 = 0")

### **Difficulty Levels**
- `easy`: Basic algebra concepts
- `medium`: Intermediate complexity
- `hard`: Advanced problems (planned)

### **Solution Steps**
Each problem includes step-by-step solution arrays:
```typescript
solutionSteps: [
  "2x + 5 - 5 = 15 - 5",
  "2x = 10",
  "x = 10 / 2",
  "x = 5"
]
```

## Database Operations

### **Key Features**
- **Transactions**: All multi-step operations use database transactions
- **Foreign Keys**: Enforced referential integrity between tables
- **WAL Mode**: Write-Ahead Logging for better performance
- **Type Safety**: Full TypeScript types for all database operations

### **Main Operations**
- **Problem Management**: CRUD operations for problems and batches
- **Progress Tracking**: Statistics calculation and progress updates
- **Answer Submission**: Atomic updates with progress tracking
- **Reset Functionality**: Clean slate with proper data cleanup

## Future Enhancements

### **Planned Features**
- **Dynamic Problem Generation**: Server-side problem creation
- **Multiple Algebra Topics**: Expand beyond basic linear/quadratic
- **Advanced Difficulty Levels**: More challenging problem types
- **Detailed Analytics**: Learning patterns and improvement tracking
- **Cloud Sync**: Cross-device progress synchronization
- **Adaptive Learning**: Difficulty adjustment based on performance

### **Technical Improvements**
- **Performance Optimization**: Problem caching and lazy loading
- **Offline Support**: Enhanced offline functionality
- **Animation**: Smooth transitions and micro-interactions
- **Accessibility**: Screen reader support and keyboard navigation

## Development Notes

- **Database**: Uses singleton pattern for connection management
- **Error Handling**: Comprehensive error states with user-friendly messages
- **Type Safety**: Strict TypeScript configuration with full type coverage
- **Testing**: Mock database enables easy testing and development
- **Performance**: WAL mode and proper indexing for database operations
