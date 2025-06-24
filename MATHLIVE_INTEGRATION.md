# MathLive Integration

This document explains how we've integrated MathLive into our Expo React Native algebra trainer app.

## What We've Added

### 1. MathLive DOM Component (`components/MathLiveInput.tsx`)
- Uses the `'use dom'` directive to render MathLive in a WebView
- Provides a rich math editor with LaTeX input/output
- Handles keyboard events and input validation
- Styled to match the app's dark theme

### 2. Enhanced Answer Input (`components/MathAnswerInput.tsx`)
- Integrates the MathLive DOM component with the existing UI
- Shows LaTeX preview of user input
- Maintains the same interface as the original AnswerInput
- Provides helpful user guidance text

### 3. LaTeX Utilities (`utils/mathUtils.ts`)
- Functions for normalizing and validating LaTeX expressions
- Basic comparison of LaTeX expressions
- Conversion between LaTeX and plain text formats

### 4. Updated Main Screen
- Replaced `AnswerInput` with `MathAnswerInput`
- Updated imports and component usage

## Problem Data Format

For optimal MathLive compatibility, problems should be formatted with LaTeX expressions:

### Example Problem Structure
```json
{
  "id": "prob_001",
  "batchId": "batch_sample_001",
  "equation": "2x + 5 = 15",
  "direction": "Solve for x",
  "answer": "x = 5",
  "answerLHS": "x = ",
  "answerRHS": "5",
  "solutionSteps": [
    {
      "explanation": "Subtract 5 from both sides",
      "mathExpression": "2x + 5 - 5 = 15 - 5",
      "isEquation": true
    },
    {
      "explanation": "Simplify",
      "mathExpression": "2x = 10",
      "isEquation": true
    },
    {
      "explanation": "Divide both sides by 2",
      "mathExpression": "x = \\frac{10}{2}",
      "isEquation": true
    },
    {
      "explanation": "Final answer",
      "mathExpression": "x = 5",
      "isEquation": true
    }
  ],
  "variables": ["x"],
  "difficulty": "easy",
  "problemType": "linear-one-variable"
}
```

### LaTeX Examples for Different Problem Types

#### Fractions
```latex
\frac{3}{4} + \frac{1}{2} = \frac{5}{4}
```

#### Quadratic Equations
```latex
x^2 - 4x + 4 = 0
```

#### Variables and Exponents
```latex
2x^3 + 5x^2 - 3x + 1
```

#### Square Roots
```latex
\sqrt{16} = 4
```

#### Complex Expressions
```latex
\frac{x^2 + 3x - 4}{x + 1} = x + 2
```

## How MathLive Works in Our App

1. **Input**: User enters mathematical expressions using MathLive's visual editor
2. **Output**: MathLive generates LaTeX code representing the mathematical expression
3. **Validation**: Our `isValidLaTeX()` function checks the syntax
4. **Comparison**: Basic LaTeX comparison for answer validation
5. **Display**: LaTeX preview shows the user what they've entered

## Benefits

- **Rich Math Input**: Users can enter complex expressions with fractions, exponents, etc.
- **Visual Feedback**: MathLive renders math expressions as they're typed
- **LaTeX Standard**: Using LaTeX ensures compatibility with mathematical notation standards
- **Validation**: Built-in validation for mathematical expressions
- **Accessibility**: MathLive provides good accessibility support

## Future Enhancements

1. **Answer Validation**: Integrate with a mathematical engine (like MathJS or computer algebra system) for semantic answer comparison
2. **LaTeX Rendering**: Add LaTeX rendering for problem display using MathJax or KaTeX
3. **Problem Generation**: Update the LLM prompt to generate LaTeX-formatted problems
4. **Custom Keyboards**: Add mathematical keyboard shortcuts for common operations

## Usage Notes

- User answers are now stored as LaTeX strings
- The `answerRHS` field in problems should ideally contain LaTeX for consistency
- MathLive requires a WebView, so it won't work in Expo Go - requires a development build
- The component automatically handles the complexity of integrating web-based MathLive with React Native

## Dependencies Added

- `mathlive`: The core MathLive library (already in package.json)
- DOM component support via existing Expo packages:
  - `@expo/metro-runtime`
  - `react-dom`
  - `react-native-web`
  - `react-native-webview`
