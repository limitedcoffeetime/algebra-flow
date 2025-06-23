import TrainingMathInput from '@/components/TrainingMathInput';
import { useInitializeApp, useProblemStore, useUserProgressStore } from '@/store';
import { isValidLaTeX } from '@/utils/mathUtils';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Add the VerificationResult interface to match the component
interface VerificationResult {
  isCorrect: boolean;
  userAnswerSimplified: string;
  correctAnswerSimplified: string;
  errorMessage?: string;
}

export default function MathLiveTest() {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Store hooks
  const problemStore = useProblemStore();
  const userProgressStore = useUserProgressStore();
  const { initializeAll } = useInitializeApp();

  // Initialize on mount
  useEffect(() => {
    initializeAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset answer when problem changes
  useEffect(() => {
    setUserAnswer('');
    setVerificationResult(null);
  }, [problemStore.currentProblem?.id]);

  const handleInput = (latex: string) => {
    setUserAnswer(latex);
    // Clear previous verification when user changes input
    setVerificationResult(null);
  };

  // Handle answer verification using MathLive
  const handleVerifyAnswer = (result: VerificationResult) => {
    setVerificationResult(result);

    // Show immediate feedback via Alert
    if (result.isCorrect) {
      Alert.alert(
        'Correct!',
        `Great job! Your answer "${result.userAnswerSimplified}" is correct.`,
        [
          { text: 'Continue', style: 'default' },
        ]
      );
    } else {
      Alert.alert(
        'Not quite right',
        `Your answer: ${result.userAnswerSimplified}\nCorrect answer: ${result.correctAnswerSimplified}${result.errorMessage ? `\n\nNote: ${result.errorMessage}` : ''}`,
        [
          { text: 'Try Again', style: 'cancel' },
        ]
      );
    }
  };

  const handleSubmit = async () => {
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

      // Use verification result if available, otherwise fallback to store's submit
      let isCorrect = false;
      if (verificationResult) {
        isCorrect = verificationResult.isCorrect;
        // Update the problem store
        await problemStore.submitAnswer(userAnswer);
      } else {
        // Fallback to original validation
        const result = await problemStore.submitAnswer(userAnswer);
        isCorrect = result.isCorrect;
      }

      await userProgressStore.recordAttempt(isCorrect);

      if (isCorrect) {
        Alert.alert(
          'Correct!',
          'Great job! You solved the equation correctly.',
          [
            { text: 'Next Problem', onPress: () => handleNextProblem() },
          ]
        );
      } else {
        Alert.alert(
          'Not quite right',
          `The correct answer is: ${problemStore.currentProblem.answer}`,
          [
            { text: 'Try Again', style: 'cancel' },
            { text: 'Next Problem', onPress: () => handleNextProblem() },
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }

    setIsSubmitting(false);
  };

  const handleNextProblem = async () => {
    await problemStore.loadNextProblem();
  };

  // Loading state
  if (problemStore.isLoading) {
    return (
      <SafeAreaView style={styles.fullScreen}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading problems...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (problemStore.error && !problemStore.currentProblem) {
    return (
      <SafeAreaView style={styles.fullScreen}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{problemStore.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeAll}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No problem state
  if (!problemStore.currentProblem) {
    return (
      <SafeAreaView style={styles.fullScreen}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No problems available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeAll}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const problem = problemStore.currentProblem;

    return (
    <SafeAreaView style={styles.fullScreen}>
      <View style={styles.container}>
        {/* Full Screen MathLive Area with Problem Display */}
        <View style={styles.mathLiveContainer}>
          <TrainingMathInput
            value={userAnswer}
            onInput={handleInput}
            onSubmit={handleSubmit}
            onVerifyAnswer={handleVerifyAnswer}
            placeholder="Enter your answer using the full screen..."
            problem={problem}
            userProgress={userProgressStore.userProgress || undefined}
          />
        </View>

        {/* Minimal Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionButton, styles.nextButton]}
            onPress={handleNextProblem}
          >
            <Text style={styles.actionButtonText}>Next Problem</Text>
          </TouchableOpacity>

          {/* Only show submit button if no verification result or if verification failed */}
          {(!verificationResult || !verificationResult.isCorrect) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.actionButtonText}>Submit Answer</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Show verification status */}
          {verificationResult && (
            <View style={[
              styles.verificationStatus,
              verificationResult.isCorrect ? styles.correctStatus : styles.incorrectStatus
            ]}>
              <Text style={styles.verificationText}>
                {verificationResult.isCorrect ? 'Verified Correct' : 'Needs Correction'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  mathLiveContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  actionBar: {
    backgroundColor: '#1f2937',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  nextButton: {
    backgroundColor: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  disabledButton: {
    backgroundColor: '#4b5563',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  verificationStatus: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctStatus: {
    backgroundColor: '#15803d',
  },
  incorrectStatus: {
    backgroundColor: '#b91c1c',
  },
  verificationText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
