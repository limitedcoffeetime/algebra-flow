import Button from '@/components/Button';
import StepByStepSolution from '@/components/StepByStepSolution';
import { useProblemStore } from '@/store/problemStore';
import { isAnswerCorrect } from '@/utils/enhancedAnswerUtils';
import { ErrorStrategy, handleError } from '@/utils/errorHandler';
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
    TextInput,
    TouchableOpacity,
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
    problemType: currentProblem?.problemType,
    originalEquation: currentProblem?.equation,
  }), [
    userAnswer,
    currentProblem?.answer,
    currentProblem?.direction,
    currentProblem?.variables,
    currentProblem?.answerLHS,
    currentProblem?.answerRHS,
    currentProblem?.problemType,
    currentProblem?.equation,
  ]);

  // Real-time validation (only if we have a current problem)
  const validation = useRealTimeValidation(validationProps);

  const contextualHint = currentProblem ? getContextualHint(
    currentProblem.direction,
    currentProblem.variables,
    userAnswer
  ) : '';

  const handleSubmit = async () => {
    if (!currentProblem || userAnswer.trim() === '') {
      Alert.alert('Please enter an answer');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for syntax errors first (same as real-time validation)
      const hasError = hasObviousSyntaxErrors(userAnswer);
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
      handleError(error, 'submitting answer', ErrorStrategy.SILENT);
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
              <Text style={styles.equation}>{currentProblem.equation}</Text>
            </View>

            {/* Difficulty Badge */}
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                {currentProblem.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Real-time Feedback */}
          {userAnswer.length > 0 && validation.suggestion && (
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
          <View style={styles.inputContainer}>
            {/* Answer display */}
            <View style={styles.inputDisplay}>
              <Text style={styles.answerPrefix}>
                {currentProblem.answerLHS ? `${currentProblem.answerLHS}  ` : ''}
                {userAnswer || 'Enter your answer'}
              </Text>
            </View>

            {/* Text input */}
            <TextInput
              style={styles.textInput}
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Type your answer..."
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {/* Submit button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Checking...' : 'Submit Answer'}
              </Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'monospace',
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
    height: 80,
  },
  inputSection: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  inputContainer: {
    padding: 16,
  },
  inputDisplay: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  answerPrefix: {
    fontSize: 20,
    color: '#ffffff',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#4b5563',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
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
