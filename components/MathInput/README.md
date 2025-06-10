# MathInput Component System

A modular, accessible, and maintainable math input component for algebra practice apps.

## Architecture

### 📁 File Structure
```
components/MathInput/
├── index.tsx                    # Main component (orchestration)
├── InputDisplay.tsx            # Input preview & toggle button
├── CustomKeyboard.tsx          # Keyboard layout & animation
├── KeyboardKeys.tsx            # Reusable key components
├── hooks/
│   ├── useCursorPosition.ts    # Cursor & text insertion logic
│   └── useKeyboardAnimation.ts # Animation state management
├── styles.ts                   # Centralized styling
├── types.ts                    # TypeScript interfaces
└── README.md                   # This documentation
```

## Usage

```tsx
import MathInput from '@/components/MathInput';

<MathInput
  value={userAnswer}
  onChangeText={setUserAnswer}
  onSubmit={handleSubmit}
  placeholder="Enter your answer"
  variables={['x', 'y']}
  isValidating={false}
  showPreview={true}
/>
```

## Components

### **MathInput (index.tsx)**
- **Purpose**: Main orchestrator component
- **Responsibilities**: State management, event handling, component composition
- **Best Practice**: Keep this thin, delegate to specialized components

### **InputDisplay**
- **Purpose**: Handles input preview area
- **Features**: Math rendering, placeholder text, keyboard toggle
- **Accessibility**: Proper ARIA labels and screen reader support

### **CustomKeyboard**
- **Purpose**: Animated keyboard layout container
- **Features**: Smooth animations, responsive layout, organized key rows
- **Performance**: Optimized animations with native driver where possible

### **KeyboardKeys**
- **Purpose**: Reusable, typed key components
- **Components**: NumberKey, OperatorKey, SubmitKey, VariableKey, etc.
- **Accessibility**: Each key has proper accessibility labels
- **Best Practice**: Consistent styling and behavior across all keys

## Hooks

### **useCursorPosition**
- **Purpose**: Manages text insertion and cursor tracking
- **Returns**: `{ insertAtCursor, handleBackspace, cursorPosition, setCursorPosition }`
- **Best Practice**: Pure logic, no UI concerns

### **useKeyboardAnimation**
- **Purpose**: Manages keyboard show/hide animations
- **Returns**: `{ keyboardVisible, keyboardHeight, toggleKeyboard }`
- **Performance**: Uses Animated.Value for smooth 60fps animations

## Styling

### **styles.ts**
- **Organization**: Grouped by component section with clear comments
- **Best Practice**: Centralized theming, consistent spacing, responsive design
- **Maintainability**: Easy to find and modify specific style groups

## TypeScript

### **types.ts**
- **Purpose**: Centralized interface definitions
- **Best Practice**: Proper component prop typing, event handler typing
- **Benefits**: Better developer experience, compile-time error checking

## Best Practices Implemented

### **✅ Accessibility**
- Proper `accessibilityRole` and `accessibilityLabel` on all interactive elements
- Screen reader friendly component structure
- Keyboard navigation support

### **✅ Performance**
- Memoized callbacks with `useCallback`
- Optimized animations with native driver
- Efficient re-render patterns

### **✅ Maintainability**
- Single Responsibility Principle for each component
- Clear separation of concerns
- Comprehensive TypeScript typing
- Well-organized file structure

### **✅ Testing Ready**
- Components are easily unit testable
- Pure logic in custom hooks
- Clear component boundaries

## Migration from Legacy

The original 470-line MathInput.tsx has been replaced with a clean barrel export for backward compatibility:

```tsx
// components/MathInput.tsx
export { default } from './MathInput/index';
export type { MathInputProps } from './MathInput/types';
```

No breaking changes to existing code! 🎉

## Future Enhancements

- [ ] Add unit tests for each component
- [ ] Implement keyboard shortcuts
- [ ] Add haptic feedback for key presses
- [ ] Support for more mathematical symbols
- [ ] Theme customization system
