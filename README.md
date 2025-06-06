# Algebro - Development Changelog

A mobile algebra learning app built with React Native and Expo.

## Latest Updates

### **June 5, 2024** - Device Sync & Answer Validation
- **S3 batch synchronization**: Problems now sync from S3 to device automatically
- **Robust answer validation**: Fixed mathjs-based validation for expressions like "30+6" vs 36
- **Bug fixes**: Resolved validation inconsistencies across mock and SQLite databases
- **Improved error handling**: Better sync failure recovery and user feedback

### **June 4, 2024** - Automated Problem Generation
- **GitHub Actions setup**: Automated daily problem generation workflow
- **S3 integration**: Generated problems uploaded to S3 bucket for distribution
- **OpenAI API integration**: GPT-4o-mini generates algebra problems with structured output
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

**Database Modes**
- Production: SQLite with persistent storage
- Development: SQLite or mock (set `EXPO_PUBLIC_USE_MOCK_DB=true`)

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
- Algebraic equivalence: "x*2" equals "2*x"
- Integer and simple fraction answers only (no calculator required)

---

## Development

**Local Setup**
```bash
npm install
npm run dev              # Development with SQLite
npm run dev-mock         # Development with mock database
```

**Problem Generation Testing**
```bash
# Requires OPENAI_API_KEY in .env
node scripts/test-generation.js
```

**Database Options**
- SQLite: Default for mobile development
- Mock: For testing and web compatibility
- Environment variable: `EXPO_PUBLIC_USE_MOCK_DB=true` to use mock
