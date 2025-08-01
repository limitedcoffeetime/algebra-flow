import { useProblemStore, useUserProgressStore } from '@/store';
import { ErrorStrategy, handleError } from '@/utils/errorHandler';
import { isValidLaTeX } from '@/utils/mathUtils';
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
      // Check for LaTeX syntax errors first
      if (!isValidLaTeX(userAnswer)) {
        Alert.alert('Invalid Input', 'Please check your mathematical expression and try again.');
        setIsSubmitting(false);
        return;
      }

      const result = await problemStore.submitAnswer(userAnswer);
      
      // Only record attempt if not giving feedback (correct or definitely wrong)
      if (!result.needsFeedback) {
        await userProgressStore.recordAttempt(result.isCorrect);
      }

      if (result.isCorrect) {
        Alert.alert(
          'Correct! 🎉',
          'Great job! You solved the equation correctly.',
          [
            { text: 'View Solution', onPress: () => onSuccess?.() },
            { text: 'Next Problem', onPress: () => problemStore.loadNextProblem() },
          ]
        );
      } else if (result.needsFeedback && result.feedbackMessage) {
        Alert.alert(
          'Almost there! 💡',
          result.feedbackMessage,
          [
            { text: 'Try Again', style: 'default' }
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
