import Button from '@/components/Button';
import MathAnswerInput from '@/components/MathAnswerInput';
import ProblemDisplay from '@/components/ProblemDisplay';
import ProgressIndicator from '@/components/ProgressIndicator';
import StepByStepSolution from '@/components/StepByStepSolution';
import { useAnswerSubmission } from '@/hooks/useAnswerSubmission';
import { useInitializeApp, useProblemStore, useUserProgressStore } from '@/store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const [userAnswer, setUserAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);

  // Store hooks
  const problemStore = useProblemStore();
  const userProgressStore = useUserProgressStore();
  const { initializeAll } = useInitializeApp();

  // Custom hook for answer submission
  const { submitAnswer, isSubmitting } = useAnswerSubmission();

  // Initialize on mount
  useEffect(() => {
    initializeAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = () => {
    submitAnswer(userAnswer, () => setShowSolution(true));
  };

  const handleAnswerChange = (answer: string) => {
    setUserAnswer(answer);
  };

  // Loading state
  if (problemStore.isLoading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading problems...</Text>
      </View>
    );
  }

  // Error state
  if (problemStore.error && !problemStore.currentProblem) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>{problemStore.error}</Text>
        <Button label="Retry" onPress={initializeAll} />
      </View>
    );
  }

  // No problem state
  if (!problemStore.currentProblem) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>No problems available</Text>
        <Button label="Retry" onPress={initializeAll} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Progress indicator */}
          {userProgressStore.userProgress && (
            <ProgressIndicator
              problemsCorrect={userProgressStore.userProgress.problemsCorrect}
              problemsAttempted={userProgressStore.userProgress.problemsAttempted}
            />
          )}

          {/* Problem display */}
          <ProblemDisplay problem={problemStore.currentProblem} />

          {/* Step-by-step Solution */}
          <StepByStepSolution
            solutionSteps={problemStore.currentProblem.solutionSteps}
            isVisible={showSolution}
            onToggle={() => setShowSolution(!showSolution)}
          />

          <View style={styles.spacer} />
        </ScrollView>

        {/* Answer Input - Fixed at bottom */}
        <MathAnswerInput
          problem={problemStore.currentProblem}
          userAnswer={userAnswer}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spacer: {
    height: 80,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});
