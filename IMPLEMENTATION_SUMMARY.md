# Clean LHS/RHS Implementation - No Backwards Compatibility

## Overview
Implemented automatic answer prefilling for algebra problems that ask to "solve for x" (or other variables). Users now only need to type the right-hand side of the equation while the left-hand side (like "x = ") is automatically prefilled and non-editable.

**⚠️ NO BACKWARDS COMPATIBILITY** - All old problem batches must be deleted. This is a clean implementation.

## What Was Implemented

### 1. Clean Schema Design
- Modified `services/problemGeneration/schema.ts` to generate `answerLHS` and `answerRHS` for applicable problems
- Problems like "solve for x" get: `answerLHS: "x = "` and `answerRHS: 5`
- Problems like "simplify" continue using single `answer` field
- **No fallbacks or defaults for old data**

### 2. Database Schema Updates
- Added `answerLHS` and `answerRHS` columns to the Problems table
- Updated `Problem` interface to include optional `answerLHS?: string` and `answerRHS?: string | number | number[]`
- Modified database insertion logic to handle the new fields
- **No migration logic - clean slate**

### 3. UI Components (MathInput)
- Added `answerPrefix` prop to `MathInput` component
- Updated `InputDisplay` to show non-editable prefix before user input
- Added styling for prefix container and prefix text
- User can only edit the RHS portion, LHS is fixed

### 4. Clean Validation Logic
- Updated `isAnswerCorrect()` function to accept optional `answerLHS` and `answerRHS` parameters
- When LHS/RHS is present, validation compares user input against RHS only
- When no LHS/RHS (simplification), validates against answer field
- **No backwards compatibility fallbacks**

### 5. Integration Updates
- Updated main app component to pass `answerLHS` as `answerPrefix` to MathInput
- Modified validation props to include LHS/RHS fields
- Updated real-time validation hook to support new structure

## How It Works

### For "Solve for x" Problems:
1. **LLM Generation**: Generates `answerLHS: "x = "` and `answerRHS: 5`
2. **UI Display**: Shows "x = " as non-editable prefix
3. **User Input**: User types only "5" in the input field
4. **Validation**: Compares user input "5" against answerRHS `5`

### For "Simplify" Problems:
1. **LLM Generation**: Generates single `answer: "3x^2 + 2x"`
2. **UI Display**: Normal input field (no prefix)
3. **User Input**: User types full expression
4. **Validation**: Uses traditional validation against answer field

## Problem Type Mapping
- `linear-one-variable` → Uses LHS/RHS (e.g., "x = 5")
- `linear-two-variables` → Uses LHS/RHS (e.g., "x = (3y-2)/4")
- `quadratic-*` → Uses LHS/RHS (e.g., "x = [2, 3]")
- `polynomial-simplification` → Uses single answer (e.g., "3x^2 + 2x")

## Benefits
1. **Improved UX**: Users don't need to remember to type "x = "
2. **Reduced Errors**: Eliminates cases where users forget the variable assignment
3. **Clearer Intent**: Makes it obvious what variable they're solving for
4. **Clean Implementation**: No legacy code or compatibility issues

## Backwards Compatibility Removal
✅ **Removed all fallback defaults**
✅ **Removed old data format handling**
✅ **Updated sample data to new format**
✅ **Cleaned database schema**
✅ **Simplified validation logic**

## Key Files Modified
- `services/problemGeneration/schema.ts` - Clean LLM output schema
- `services/database/schema.ts` - Updated database interface and table schema
- `components/MathInput/` - UI components for prefix display
- `utils/enhancedAnswerUtils.ts` - Clean validation logic
- `app/(tabs)/index.tsx` - Main app integration
- `assets/data/sampleProblems.json` - Updated to new format

## Migration Required
⚠️ **IMPORTANT**: Delete all existing problem batches before using this implementation.
The new schema is incompatible with old data and no migration path is provided.

## Testing
The implementation handles:
- ✅ Simple numeric answers (x = 5)
- ✅ Expression answers (x = (3y-2)/4)
- ✅ Multiple solutions (x = [2, 3])
- ✅ Different variables (y = 7)
- ✅ Simplification problems (no prefix)

## Next Steps
- Delete all old problem batches
- Generate new problems with the updated schema
- Test with real LLM-generated problems
