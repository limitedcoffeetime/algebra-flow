import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAnswerCorrect } from './enhancedAnswerUtils';

export interface ValidationResult {
  isValid: boolean | null; // null = unknown/still typing
  confidence: 'high' | 'medium' | 'low' | 'none';
  suggestion?: string;
  errorType?: 'syntax' | 'incomplete' | 'wrong_answer' | 'missing_variable';
}

interface UseRealTimeValidationProps {
  userInput: string;
  correctAnswer: string | number | number[];
  problemDirection: string;
  variables: string[];
  debounceMs?: number;
}

export const useRealTimeValidation = ({
  userInput,
  correctAnswer,
  problemDirection,
  variables,
  debounceMs = 500,
}: UseRealTimeValidationProps): ValidationResult => {
  const [debouncedInput, setDebouncedInput] = useState(userInput);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: null,
    confidence: 'none',
  });

  // Memoize the correct answer to prevent unnecessary re-renders
  const memoizedCorrectAnswer = useMemo(() => correctAnswer, [JSON.stringify(correctAnswer)]);

  // Memoize variables array to prevent re-renders
  const memoizedVariables = useMemo(() => variables, [JSON.stringify(variables)]);

  // Debounce the input to avoid excessive validation calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(userInput);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [userInput, debounceMs]);

  // Memoize validation functions to prevent re-creation
  const checkSyntaxIssues = useCallback((input: string): { hasError: boolean; suggestion?: string } => {
    // Check for mismatched parentheses
    const openParens = (input.match(/\(/g) || []).length;
    const closeParens = (input.match(/\)/g) || []).length;

    if (openParens > closeParens) {
      return {
        hasError: false, // Not an error yet, just incomplete
        suggestion: 'Missing closing parentheses',
      };
    }

    if (closeParens > openParens) {
      return {
        hasError: true,
        suggestion: 'Too many closing parentheses',
      };
    }

    // Check for invalid operator sequences
    if (/[\+\-\*\/]{2,}/.test(input) && !input.includes('--')) {
      return {
        hasError: true,
        suggestion: 'Invalid operator sequence',
      };
    }

    // Check for division by zero
    if (/\/\s*0(?!\d)/.test(input)) {
      return {
        hasError: true,
        suggestion: 'Division by zero is undefined',
      };
    }

    // Check for incomplete fractions
    if (input.endsWith('/') || /\/\s*$/.test(input)) {
      return {
        hasError: false,
        suggestion: 'Complete the fraction',
      };
    }

    // Check for incomplete exponents
    if (input.endsWith('^') || /\^\s*$/.test(input)) {
      return {
        hasError: false,
        suggestion: 'Complete the exponent',
      };
    }

    return { hasError: false };
  }, []);

  const isIncomplete = useCallback((input: string): boolean => {
    // Common patterns that suggest the user is still typing
    const incompletePatterns = [
      /[\+\-\*\/]$/, // Ends with operator
      /sqrt\($/, // Incomplete sqrt
      /\($/, // Just opened parenthesis
      /\d+\.$/, // Number with decimal but no digits after
    ];

    return incompletePatterns.some(pattern => pattern.test(input));
  }, []);

  const checkMissingVariables = useCallback((
    input: string,
    direction: string,
    expectedVars: string[]
  ): string[] => {
    // If the problem asks to "solve for x" but input doesn't contain x
    const solveForMatch = direction.match(/solve for (\w+)/i);
    if (solveForMatch) {
      const targetVar = solveForMatch[1].toLowerCase();
      if (!input.toLowerCase().includes(targetVar) && !isNumericAnswer(input)) {
        // Only suggest missing variable if the answer isn't purely numeric
        return [targetVar];
      }
    }

    // For "express x in terms of y" type problems
    const expressMatch = direction.match(/express (\w+) in terms of (\w+)/i);
    if (expressMatch) {
      const [, targetVar, dependentVar] = expressMatch;
      const missing: string[] = [];

      if (!input.toLowerCase().includes(targetVar.toLowerCase())) {
        missing.push(targetVar);
      }
      if (!input.toLowerCase().includes(dependentVar.toLowerCase()) &&
          !isNumericAnswer(input)) {
        missing.push(dependentVar);
      }

      return missing;
    }

    return [];
  }, []);

  const isNumericAnswer = useCallback((input: string): boolean => {
    // Check if the input is purely numeric (including fractions and decimals)
    return /^[\d\.\+\-\/\(\)\s]+$/.test(input) && !/[a-zA-Z]/.test(input);
  }, []);

  const validateAnswer = useCallback(async (
    userInput: string,
    correctAnswer: string | number | number[]
  ): Promise<ValidationResult> => {
    try {
      const isCorrect = await isAnswerCorrect(userInput, correctAnswer);

      if (isCorrect) {
        return {
          isValid: true,
          confidence: 'high',
          suggestion: 'Correct!',
        };
      } else {
        return {
          isValid: false,
          confidence: 'high',
          errorType: 'wrong_answer',
          suggestion: 'This doesn\'t match the expected answer',
        };
      }
    } catch (error) {
      // If validation fails due to mathematical errors
      return {
        isValid: false,
        confidence: 'medium',
        errorType: 'syntax',
        suggestion: 'Mathematical expression has an error',
      };
    }
  }, []);

  useEffect(() => {
    const validateInput = async () => {
      const trimmed = debouncedInput.trim();

      // Empty input
      if (!trimmed) {
        setValidationResult({
          isValid: null,
          confidence: 'none',
        });
        return;
      }

      // Check for obvious syntax errors
      const syntaxIssues = checkSyntaxIssues(trimmed);
      if (syntaxIssues.hasError) {
        setValidationResult({
          isValid: false,
          confidence: 'high',
          errorType: 'syntax',
          suggestion: syntaxIssues.suggestion,
        });
        return;
      }

      // Check if input appears incomplete
      if (isIncomplete(trimmed)) {
        setValidationResult({
          isValid: null,
          confidence: 'low',
          errorType: 'incomplete',
          suggestion: 'Keep typing...',
        });
        return;
      }

      // Check for missing expected variables
      const missingVars = checkMissingVariables(trimmed, problemDirection, memoizedVariables);
      if (missingVars.length > 0) {
        setValidationResult({
          isValid: false,
          confidence: 'medium',
          errorType: 'missing_variable',
          suggestion: `Consider including: ${missingVars.join(', ')}`,
        });
        return;
      }

      // Perform actual mathematical validation
      const result = await validateAnswer(trimmed, memoizedCorrectAnswer);
      setValidationResult(result);
    };

    validateInput();
  }, [
    debouncedInput,
    memoizedCorrectAnswer,
    problemDirection,
    memoizedVariables,
    checkSyntaxIssues,
    isIncomplete,
    checkMissingVariables,
    validateAnswer
  ]);

  return validationResult;
};

// Additional utility for providing contextual hints
export function getContextualHint(
  direction: string,
  variables: string[],
  currentInput: string
): string {
  if (!currentInput.trim()) {
    if (direction.toLowerCase().includes('solve for')) {
      return `Enter a value or expression`;
    }
    if (direction.toLowerCase().includes('simplify')) {
      return `Enter the simplified form`;
    }
    if (direction.toLowerCase().includes('factor')) {
      return `Enter the factored form`;
    }
  }

  // Provide hints based on common patterns
  if (variables.length > 1 && !currentInput.includes('=')) {
    if (direction.toLowerCase().includes('in terms of')) {
      return `Try format like: ${variables[0]} = ...`;
    }
  }

  return '';
}
