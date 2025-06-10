import Button from '@/components/Button';
import MathInput from '@/components/MathInput';
import SmartMathRenderer from '@/components/SmartMathRenderer';
import StepByStepSolution from '@/components/StepByStepSolution';
import { useProblemStore } from '@/store/problemStore';
import { isAnswerCorrect } from '@/utils/enhancedAnswerUtils';
import { hasObviousSyntaxErrors } from '@/utils/syntaxValidation';
import { getContextualHint, useRealTimeValidation } from '@/utils/useRealTimeValidation';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    currentProblem,
    userProgress,
    isLoading,
    error,
    initialize,
    loadNextProblem,
    submitAnswer
  } = useProblemStore();

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Memoize validation props to prevent infinite re-renders
  const validationProps = useMemo(() => ({
    userInput: userAnswer,
    correctAnswer: currentProblem?.answer || '',
    problemDirection: currentProblem?.direction || '',
    variables: currentProblem?.variables || ['x'],
    debounceMs: 300,
    answerLHS: currentProblem?.answerLHS,
    answerRHS: currentProblem?.answerRHS,
  }), [
    userAnswer,
    currentProblem?.answer,
    currentProblem?.direction,
    currentProblem?.variables,
    currentProblem?.answerLHS,
    currentProblem?.answerRHS,
  ]);

  // Real-time validation (only if we have a current problem)
  const validation = useRealTimeValidation(validationProps);

  const contextualHint = currentProblem ? getContextualHint(
    currentProblem.direction,
    currentProblem.variables,
    userAnswer
  ) : '';

  const handleSubmit = async () => {
    if (!currentProblem || !userAnswer.trim()) {
      Alert.alert('Please enter an answer');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for syntax errors first (same as real-time validation)
      const hasError = hasObviousSyntaxErrors(userAnswer.trim());
      if (hasError) {
        Alert.alert('Invalid Input', 'Please check your mathematical expression and try again.');
        setIsSubmitting(false);
        return;
      }

      // Use enhanced validation with LHS/RHS support
      const isCorrect = await isAnswerCorrect(
        userAnswer,
        currentProblem.answer,
        currentProblem.answerLHS,
        currentProblem.answerRHS,
        currentProblem.problemType,
        currentProblem.equation
      );

      // Submit to store
      await submitAnswer(userAnswer, isCorrect);

      if (isCorrect) {
        Alert.alert(
          'Correct! 🎉',
          'Great job! You solved the equation correctly.',
          [
            { text: 'View Solution', onPress: () => setShowSolution(true) },
            { text: 'Next Problem', onPress: handleNextProblem },
          ]
        );
      } else {
        Alert.alert(
          'Not quite right',
          'Would you like to try again or see the solution?',
          [
            { text: 'Try Again', style: 'cancel' },
            { text: 'Show Solution', onPress: () => setShowSolution(true) },
            { text: 'Next Problem', onPress: handleNextProblem },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }

    setIsSubmitting(false);
  };

  const handleNextProblem = async () => {
    setUserAnswer('');
    setShowSolution(false);
    await loadNextProblem();
  };

  const getValidationColor = (): string => {
    if (validation.isValid === true) return '#10b981'; // Green
    if (validation.isValid === false && validation.confidence === 'high') return '#ef4444'; // Red
    if (validation.errorType === 'syntax') return '#f59e0b'; // Orange
    return '#6b7280'; // Gray
  };

  const getValidationMessage = (): string => {
    if (validation.suggestion) return validation.suggestion;
    if (contextualHint) return contextualHint;
    return '';
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading problems...</Text>
      </View>
    );
  }

  // Error state
  if (error && !currentProblem) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>{error}</Text>
        <Button label="Retry" onPress={initialize} />
      </View>
    );
  }

  // No problem state
  if (!currentProblem) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>No problems available</Text>
        <Button label="Retry" onPress={initialize} />
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
          {userProgress && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Progress: {userProgress.problemsCorrect}/{userProgress.problemsAttempted}
              </Text>
            </View>
          )}

          {/* Problem Header */}
          <View style={styles.problemContainer}>
            <Text style={styles.problemTitle}>Algebra Practice</Text>
            <Text style={styles.direction}>{currentProblem.direction}</Text>

            {/* Problem Equation */}
            <View style={styles.equationContainer}>
              <SmartMathRenderer
                text={currentProblem.equation}
                fontSize={28}
                color="#ffffff"
                style={styles.equation}
              />
            </View>

            {/* Difficulty Badge */}
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                {currentProblem.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Real-time Feedback */}
          {userAnswer.trim() && validation.suggestion && (
            <View style={[styles.feedbackContainer, { borderLeftColor: getValidationColor() }]}>
              <Text style={[styles.feedbackText, { color: getValidationColor() }]}>
                {getValidationMessage()}
              </Text>
              {validation.isValid === true && (
                <Text style={styles.encouragementText}>
                  Ready to submit! 🎯
                </Text>
              )}
            </View>
          )}

          {/* Step-by-step Solution */}
          <StepByStepSolution
            solutionSteps={currentProblem.solutionSteps}
            isVisible={showSolution}
            onToggle={() => setShowSolution(!showSolution)}
          />

          {/* Some spacing before the input */}
          <View style={styles.spacer} />
        </ScrollView>

        {/* Math Input - Fixed at bottom */}
        <View style={styles.inputSection}>
          <MathInput
            value={userAnswer}
            onChangeText={setUserAnswer}
            onSubmit={handleSubmit}
            placeholder="Enter your answer"
            variables={currentProblem.variables}
            isValidating={isSubmitting}
            showPreview={true}
            answerPrefix={currentProblem.answerLHS}
          />
        </View>
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
  progressContainer: {
    backgroundColor: '#1a1a2e',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  problemContainer: {
    backgroundColor: '#1a1a2e',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  problemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  direction: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 20,
    textAlign: 'center',
  },
  equationContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  equation: {
    minHeight: 60,
  },
  difficultyBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    backgroundColor: '#1e293b',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  encouragementText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  spacer: {
    height: 80, // Reduced to pull keyboard higher
  },
  inputSection: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    // Removed maxHeight and minHeight constraints
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
