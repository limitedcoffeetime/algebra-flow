import TrainingMathInput from '@/components/TrainingMathInput';
import { useInitializeApp, useProblemStore, useUserProgressStore } from '@/store';
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
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [buttonState, setButtonState] = useState<'verify' | 'next'>('verify');
  const [hasRecordedAttempt, setHasRecordedAttempt] = useState(false);

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
    setShowSolution(false);
    setButtonState('verify');
    setHasRecordedAttempt(false);
  }, [problemStore.currentProblem?.id]);

  const handleInput = (latex: string) => {
    setUserAnswer(latex);
    // Clear previous verification when user changes input (but keep them in verify mode if they were there)
    if (buttonState === 'verify') {
      setVerificationResult(null);
      setShowSolution(false);
    }
  };

  // Handle answer verification using MathLive
  const handleVerifyAnswer = async (result: VerificationResult) => {
    setVerificationResult(result);

    // Record attempt only once per problem
    if (!hasRecordedAttempt) {
      await userProgressStore.recordAttempt(result.isCorrect);
      setHasRecordedAttempt(true);
    }

    if (result.isCorrect) {
      // Correct answer flow
      Alert.alert(
        '🎉 Correct!',
        `Great job! Your answer "${result.userAnswerSimplified}" is correct.\n\nWould you like to see the step-by-step solution?`,
        [
          {
            text: 'No, Next Problem',
            onPress: () => {
              setButtonState('next');
            }
          },
          {
            text: 'Show Solution',
            onPress: () => {
              setShowSolution(true);
              setButtonState('next');
            }
          },
        ]
      );
    } else {
      // Incorrect answer flow
      Alert.alert(
        '❌ Not Quite Right',
        `Your answer: ${result.userAnswerSimplified}\nCorrect answer: ${result.correctAnswerSimplified}${result.errorMessage ? `\n\nNote: ${result.errorMessage}` : ''}`,
        [
          {
            text: 'Try Again',
            style: 'cancel',
            onPress: () => {
              // Reset for another attempt (but don't reset hasRecordedAttempt)
              setVerificationResult(null);
              setShowSolution(false);
              setButtonState('verify');
            }
          },
          {
            text: 'Show Solution',
            onPress: () => {
              setShowSolution(true);
              setButtonState('next');
            }
          },
        ]
      );
    }
  };

  // This is only called when button is in "next" state
  const handleButtonPress = () => {
    handleNextProblem();
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
            onVerifyAnswer={handleVerifyAnswer}
            onButtonPress={handleButtonPress}
            buttonState={buttonState}
            placeholder="Enter your answer using the full screen..."
            problem={problem}
            userProgress={userProgressStore.userProgress || undefined}
            showSolution={showSolution}
          />
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
    borderWidth: 1,
    borderColor: '#2563eb',
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
});
