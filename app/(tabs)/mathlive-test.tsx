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

export default function MathLiveTest() {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, [problemStore.currentProblem?.id]);

  const handleInput = (latex: string) => {
    setUserAnswer(latex);
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

      const result = await problemStore.submitAnswer(userAnswer);
      await userProgressStore.recordAttempt(result.isCorrect);

      if (result.isCorrect) {
        Alert.alert(
          'Correct! 🎉',
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
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  mathLiveContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  actionBar: {
    backgroundColor: '#1e293b',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
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
    fontWeight: 'bold',
  },
});
