import { useProblemStore, useUserProgressStore } from '@/store';
import { isAnswerCorrect } from '@/utils/enhancedAnswerUtils';
import { ErrorStrategy, handleError } from '@/utils/errorHandler';
import { hasObviousSyntaxErrors } from '@/utils/syntaxValidation';
import { useState } from 'react';
import { Alert } from 'react-native';

export const useAnswerSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const problemStore = useProblemStore();
  const userProgressStore = useUserProgressStore();

  const submitAnswer = async (userAnswer: string, onSuccess?: () => void) => {
    if (!problemStore.currentProblem || userAnswer.trim() === '') {
      Alert.alert('Please enter an answer');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for syntax errors first
      const hasError = hasObviousSyntaxErrors(userAnswer);
      if (hasError) {
        Alert.alert('Invalid Input', 'Please check your mathematical expression and try again.');
        setIsSubmitting(false);
        return;
      }

      // Use enhanced validation with LHS/RHS support
      const isCorrect = await isAnswerCorrect(
        userAnswer,
        problemStore.currentProblem.answer,
        problemStore.currentProblem.answerLHS,
        problemStore.currentProblem.answerRHS,
        problemStore.currentProblem.problemType,
        problemStore.currentProblem.equation
      );

      // Submit to store and record attempt
      const result = await problemStore.submitAnswer(userAnswer);
      await userProgressStore.recordAttempt(result.isCorrect);

      if (result.isCorrect) {
        Alert.alert(
          'Correct! 🎉',
          'Great job! You solved the equation correctly.',
          [
            { text: 'View Solution', onPress: () => onSuccess?.() },
            { text: 'Next Problem', onPress: () => problemStore.loadNextProblem() },
          ]
        );
      } else {
        Alert.alert(
          'Not quite right',
          'Would you like to try again or see the solution?',
          [
            { text: 'Try Again', style: 'cancel' },
            { text: 'Show Solution', onPress: () => onSuccess?.() },
            { text: 'Next Problem', onPress: () => problemStore.loadNextProblem() },
          ]
        );
      }
    } catch (error) {
      handleError(error, 'submitting answer', ErrorStrategy.SILENT);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }

    setIsSubmitting(false);
  };

  const loadNextProblem = async () => {
    await problemStore.loadNextProblem();
  };

  return {
    submitAnswer,
    loadNextProblem,
    isSubmitting
  };
};
