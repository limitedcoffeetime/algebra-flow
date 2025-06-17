# AI Agent Guide: Components Directory

> **Context**: This directory contains React Native UI components following Clean Architecture principles. Components are focused, reusable, and composed to create complex interfaces.

## 🤖 AI Agent Instructions

### When Working in This Directory
**You are working in the UI LAYER. This means:**
- **Components handle presentation only** - No business logic
- **Single responsibility per component** - Each component does one thing well
- **Use stores for state** - Never access services directly from components
- **Compose, don't inherit** - Build complex UIs from simple components

### Critical Architecture Rules
1. **NEVER put business logic in components** - Use custom hooks instead
2. **ALWAYS use focused props interfaces** - Avoid passing entire objects when only specific fields needed
3. **MAINTAIN component purity** - Minimize side effects where possible
4. **FOLLOW composition patterns** - Components should be composable building blocks

## Component Architecture Patterns

### Pure Component Pattern
```typescript
// ✅ CORRECT: Pure, focused component
interface ComponentProps {
  data: SpecificDataType;
  onAction: (param: ParamType) => void;
}

export default function Component({ data, onAction }: ComponentProps) {
  return (
    <View>
      <Text>{data.displayValue}</Text>
      <TouchableOpacity onPress={() => onAction(data.id)}>
        <Text>Action</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Container Component Pattern (with hooks)
```typescript
// ✅ CORRECT: Container handles state, presents via pure components
export default function Container() {
  // State management via stores
  const store = useAppropriateStore();

  // Complex logic via custom hooks
  const { handleComplexOperation } = useCustomHook();

  // Compose pure components
  return (
    <>
      <PureComponent1 data={store.data1} onAction={handleComplexOperation} />
      <PureComponent2 data={store.data2} />
    </>
  );
}
```

## Current Component Structure

### Core Components
- **ProblemDisplay.tsx** → Problem presentation ONLY (pure)
- **ProgressIndicator.tsx** → Progress display ONLY (pure)
- **AnswerInput.tsx** → Input handling ONLY (controlled)
- **StepByStepSolution.tsx** → Solution display ONLY (existing)
- **BatchManager.tsx** → Admin interface ONLY (existing)

## Code Generation Guidelines

### Creating New Pure Components
```typescript
// ✅ CORRECT: Pure component pattern
interface NewComponentProps {
  data: SpecificDataType;
  onAction?: (id: string) => void;
}

export default function NewComponent({ data, onAction }: NewComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{data.displayValue}</Text>
      {onAction && (
        <TouchableOpacity onPress={() => onAction(data.id)}>
          <Text>Action</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { /* component-specific styles */ },
  text: { /* component-specific styles */ }
});
```

### Creating Container Components
```typescript
// ✅ CORRECT: Container with stores and composition
export default function NewContainer() {
  // Store state
  const store = useRelevantStore();

  // Custom hook for complex logic
  const { handleComplexOperation, isLoading } = useCustomLogic();

  // Local UI state only
  const [isExpanded, setIsExpanded] = useState(false);

  if (store.isLoading) {
    return <LoadingComponent />;
  }

  return (
    <View>
      <PureComponent1
        data={store.data}
        onAction={handleComplexOperation}
        isExpanded={isExpanded}
        onToggleExpanded={setIsExpanded}
      />
      <PureComponent2 data={store.otherData} />
    </View>
  );
}
```

### Custom Hooks for Component Logic
```typescript
// ✅ CORRECT: Extract complex logic to hooks
export const useCustomLogic = () => {
  const store = useRelevantStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleComplexOperation = useCallback(async (id: string) => {
    setIsProcessing(true);
    try {
      await store.performAction(id);
    } finally {
      setIsProcessing(false);
    }
  }, [store]);

  return {
    handleComplexOperation,
    isProcessing
  };
};
```

## Common AI Tasks

### Task: Create new display component
1. Identify what data it needs to display
2. Create focused props interface
3. Implement as pure function
4. Add component-specific styles
5. Export with proper TypeScript types

### Task: Add interactivity to component
1. Identify if logic belongs in component or hook
2. If complex: extract to custom hook
3. If simple: keep in component with useState
4. Pass handlers via props (don't create in component)
5. Follow existing interaction patterns

### Task: Compose existing components
1. Identify container component responsibility
2. Import relevant stores for state
3. Use custom hooks for complex operations
4. Compose pure components with proper props
5. Handle loading/error states at container level

## Props Interface Guidelines

### Focused Props Pattern
```typescript
// ✅ CORRECT: Only what component needs
interface ProgressDisplayProps {
  correct: number;
  total: number;
  showPercentage?: boolean;
}

// ❌ WRONG: Entire objects when only fields needed
interface BadProgressProps {
  userProgress: UserProgress;  // Component only needs correct/total
  settings: AppSettings;       // Component only needs display preferences
}
```

### Action Props Pattern
```typescript
// ✅ CORRECT: Specific action callbacks
interface ComponentProps {
  onSave: (data: SaveData) => void;
  onCancel: () => void;
  onValidate: (input: string) => boolean;
}

// ❌ WRONG: Generic handlers
interface BadComponentProps {
  onAction: (type: string, data: any) => void;  // Too generic
}
```

## State Management Rules

### Local State (useState)
```typescript
// ✅ USE FOR: UI-only state
const [isExpanded, setIsExpanded] = useState(false);
const [selectedTab, setSelectedTab] = useState(0);
const [inputValue, setInputValue] = useState('');
```

### Store State (via hooks)
```typescript
// ✅ USE FOR: Business/application state
const { currentProblem, isLoading } = useProblemStore();
const { userProgress } = useUserProgressStore();
const { isSyncing } = useSyncStore();
```

### Custom Hooks
```typescript
// ✅ USE FOR: Complex component logic
const { submitAnswer, isSubmitting } = useAnswerSubmission();
const { validationResult, validateInput } = useInputValidation();
```

## Anti-Patterns to Avoid

```typescript
// ❌ NEVER DO THESE:

// Don't put business logic in components
function BadComponent() {
  const handleSubmit = async () => {
    // Complex business logic - WRONG! Use custom hook
    const validation = validateComplexRules(input);
    const result = await callBusinessService(validation);
    updateMultipleStores(result);
  };
}

// Don't access services directly from components
import { databaseService } from '../services'; // WRONG!

function BadComponent() {
  useEffect(() => {
    databaseService.getData(); // WRONG! Use stores
  }, []);
}

// Don't create massive prop interfaces
interface BadProps {
  problem: Problem;
  progress: UserProgress;
  sync: SyncState;
  settings: AppSettings;
  user: User;
  // ... 20+ more props - WRONG!
}

// Don't mix multiple concerns in one component
function BadMegaComponent() {
  // Problem display logic
  // Progress calculation
  // Sync operations
  // User input handling
  // Navigation logic
  // All in one component - WRONG!
}
```

## Testing Patterns

### Component Testing
```typescript
// ✅ CORRECT: Test component behavior with props
describe('ProblemDisplay', () => {
  test('displays problem equation', () => {
    const mockProblem = { equation: '2x + 3 = 7', difficulty: 'easy' };
    render(<ProblemDisplay problem={mockProblem} />);
    expect(screen.getByText('2x + 3 = 7')).toBeInTheDocument();
  });

  test('calls onAction when button pressed', () => {
    const mockAction = jest.fn();
    render(<ComponentWithAction onAction={mockAction} />);
    fireEvent.press(screen.getByText('Action'));
    expect(mockAction).toHaveBeenCalled();
  });
});
```

## Styling Guidelines

### Component-Scoped Styles
```typescript
// ✅ CORRECT: Styles specific to component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  }
});
```

### Style Organization
- Keep styles at bottom of component file
- Use descriptive style names
- Group related styles together
- Don't create global style dependencies

---
**🎯 Key Success Metrics**: Single responsibility components, pure functions, focused props, proper state management, testable interfaces
