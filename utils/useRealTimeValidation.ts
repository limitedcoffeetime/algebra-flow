import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAnswerCorrect } from './enhancedAnswerUtils';
import { hasObviousSyntaxErrors } from './syntaxValidation';

export interface ValidationResult {
  isValid: boolean | null; // null = unknown/still typing
  confidence: 'high' | 'medium' | 'low' | 'none';
  suggestion?: string;
  errorType?: 'syntax' | 'incomplete' | 'wrong_answer' | 'missing_variable';
}

export interface UseRealTimeValidationProps {
  userInput: string;
  correctAnswer: string | number | number[];
  problemDirection: string;
  variables: string[];
  debounceMs?: number;
  answerLHS?: string;
  answerRHS?: string | number | number[];
  problemType?: string;
  originalEquation?: string;
}

export const useRealTimeValidation = ({
  userInput,
  correctAnswer,
  problemDirection,
  variables,
  debounceMs = 500,
  answerLHS,
  answerRHS,
  problemType,
  originalEquation,
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

  // Simplified validation function
  const validateAnswer = useCallback(async (
    userInput: string,
    correctAnswer: string | number | number[]
  ): Promise<ValidationResult> => {
    const trimmed = userInput.trim();

    // Empty input
    if (!trimmed) {
      return {
        isValid: null,
        confidence: 'none',
      };
    }

    // Check for obvious syntax errors first
    if (hasObviousSyntaxErrors(trimmed)) {
      return {
        isValid: false,
        confidence: 'high',
        errorType: 'syntax',
        suggestion: 'Check your mathematical expression',
      };
    }

    // Check if input appears incomplete
    if (trimmed.endsWith('+') || trimmed.endsWith('-') || trimmed.endsWith('*') || trimmed.endsWith('/') || trimmed.endsWith('^')) {
      return {
        isValid: null,
        confidence: 'low',
        errorType: 'incomplete',
        suggestion: 'Keep typing...',
      };
    }

    try {
      const isCorrect = await isAnswerCorrect(trimmed, correctAnswer, answerLHS, answerRHS, problemType, originalEquation);

      if (isCorrect) {
        return {
          isValid: true,
          confidence: 'high',
          suggestion: 'Correct! 🎉',
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
        suggestion: 'Check your mathematical expression',
      };
    }
  }, [answerLHS, answerRHS, problemType, originalEquation]);

  useEffect(() => {
    const runValidation = async () => {
      const result = await validateAnswer(debouncedInput, memoizedCorrectAnswer);
      setValidationResult(result);
    };

    runValidation();
  }, [
    debouncedInput,
    memoizedCorrectAnswer,
    validateAnswer
  ]);

  return validationResult;
};

// Simple contextual hint function
export function getContextualHint(
  direction: string,
  variables: string[],
  userInput: string
): string {
  const trimmed = userInput.trim();

  if (!trimmed) {
    return `Enter your answer. ${direction}`;
  }

  // If the direction mentions solving for a variable, remind them
  if (direction.toLowerCase().includes('solve for') && !trimmed.match(/[a-zA-Z]/)) {
    return 'Looks like you entered a number. Check if the problem asks for an expression.';
  }

  // If they should include variables but don't
  if (variables.length > 0 && !variables.some(v => trimmed.includes(v))) {
    if (direction.toLowerCase().includes('express') || direction.toLowerCase().includes('terms of')) {
      return `Consider including variable: ${variables.join(', ')}`;
    }
  }

  return '';
}
