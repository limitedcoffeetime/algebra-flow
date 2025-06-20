import TrainingMathInput from '@/components/TrainingMathInput';
import { useProblemStore, useUserProgressStore } from '@/store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
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

export default function Training() {
  const [userAnswer, setUserAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    userAnswerSimplified?: string;
    correctAnswerSimplified?: string;
    errorMessage?: string;
  } | null>(null);

  const problemStore = useProblemStore();
  const userProgressStore = useUserProgressStore();

  // Reset answer when problem changes
  useEffect(() => {
    setUserAnswer('');
    setShowSolution(false);
    setLastResult(null);
  }, [problemStore.currentProblem?.id]);

  // Handle answer verification using MathLive
  const handleVerifyAnswer = (result: VerificationResult) => {
    if (!problemStore.currentProblem) return;

    setLastResult({
      isCorrect: result.isCorrect,
      userAnswer: userAnswer,
      correctAnswer: problemStore.currentProblem.answer as string,
      userAnswerSimplified: result.userAnswerSimplified,
      correctAnswerSimplified: result.correctAnswerSimplified,
      errorMessage: result.errorMessage
    });
  };

  const handleSubmitAnswer = async () => {
    if (!problemStore.currentProblem || !userAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      // Use the MathLive verification result if available, otherwise fallback to store's submit
      if (lastResult) {
        // Record the attempt based on verification result
        await userProgressStore.recordAttempt(lastResult.isCorrect);

        // Update the problem store with the result
        await problemStore.submitAnswer(userAnswer);

        // Move to next problem if correct
        if (lastResult.isCorrect) {
          setTimeout(() => {
            handleNextProblem();
          }, 2000); // Give user time to see the result
        }
      } else {
        // Fallback to original validation
        const result = await problemStore.submitAnswer(userAnswer);
        await userProgressStore.recordAttempt(result.isCorrect);

        setLastResult({
          isCorrect: result.isCorrect,
          userAnswer: userAnswer,
          correctAnswer: problemStore.currentProblem.answer as string
        });
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextProblem = async () => {
    await problemStore.loadNextProblem();
  };

  const formatAnswerDisplay = (answer: any): string => {
    if (typeof answer === 'string') return answer;
    if (typeof answer === 'number') return answer.toString();
    if (Array.isArray(answer)) return answer.join(', ');
    return JSON.stringify(answer);
  };

  // Loading state
  if (problemStore.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading training problems...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No problem state
  if (!problemStore.currentProblem) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No training problems available</Text>
          <Text style={styles.helpText}>
            Try refreshing or check your connection
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const problem = problemStore.currentProblem;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🧮 Math Training</Text>
          {userProgressStore.userProgress && (
            <Text style={styles.progressText}>
              {userProgressStore.userProgress.problemsCorrect} / {userProgressStore.userProgress.problemsAttempted} correct
            </Text>
          )}
        </View>

        {/* Problem Card */}
        <View style={styles.problemCard}>
          <Text style={styles.problemDirection}>{problem.direction}</Text>
          <View style={styles.problemEquation}>
            <Text style={styles.equationText}>{problem.equation}</Text>
          </View>

          {problem.answerLHS && (
            <View style={styles.answerPrefix}>
              <Text style={styles.answerPrefixText}>{problem.answerLHS}</Text>
            </View>
          )}
        </View>

        {/* Math Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Enter your answer:</Text>
          <TrainingMathInput
            value={userAnswer}
            onInput={setUserAnswer}
            onSubmit={handleSubmitAnswer}
            onVerifyAnswer={handleVerifyAnswer}
            readonly={isSubmitting}
            placeholder="Type your mathematical answer..."
            problem={problem}
            userProgress={userProgressStore.userProgress || undefined}
          />

          {/* LaTeX Preview */}
          {userAnswer && (
            <View style={styles.latexPreview}>
              <Text style={styles.latexLabel}>LaTeX:</Text>
              <Text style={styles.latexText}>{userAnswer}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons - Only show if verification hasn't been used */}
        {!lastResult && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!userAnswer.trim() || isSubmitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmitAnswer}
              disabled={!userAnswer.trim() || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Checking...' : 'Submit Answer'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.solutionButton}
              onPress={() => setShowSolution(!showSolution)}
            >
              <Text style={styles.solutionButtonText}>
                {showSolution ? 'Hide Solution' : 'Show Solution'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Result Display */}
        {lastResult && (
          <View style={[
            styles.resultCard,
            lastResult.isCorrect ? styles.correctResult : styles.incorrectResult
          ]}>
            <Text style={styles.resultTitle}>
              {lastResult.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
            </Text>
            <View style={styles.resultDetails}>
              <Text style={styles.resultLabel}>Your answer:</Text>
              <Text style={styles.resultValue}>{lastResult.userAnswer}</Text>

              {lastResult.userAnswerSimplified && lastResult.userAnswerSimplified !== lastResult.userAnswer && (
                <>
                  <Text style={styles.resultLabel}>Simplified:</Text>
                  <Text style={styles.resultValue}>{lastResult.userAnswerSimplified}</Text>
                </>
              )}

              {!lastResult.isCorrect && (
                <>
                  <Text style={styles.resultLabel}>Correct answer:</Text>
                  <Text style={styles.resultValue}>{lastResult.correctAnswer}</Text>
                  {lastResult.correctAnswerSimplified && (
                    <>
                      <Text style={styles.resultLabel}>Simplified:</Text>
                      <Text style={styles.resultValue}>{lastResult.correctAnswerSimplified}</Text>
                    </>
                  )}
                </>
              )}

              {lastResult.errorMessage && (
                <>
                  <Text style={styles.resultLabel}>Note:</Text>
                  <Text style={[styles.resultValue, styles.errorNote]}>{lastResult.errorMessage}</Text>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextProblem}
            >
              <Text style={styles.nextButtonText}>Next Problem →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Solution Steps */}
        {showSolution && problem.solutionSteps && (
          <View style={styles.solutionCard}>
            <Text style={styles.solutionTitle}>📝 Step-by-Step Solution</Text>
            {problem.solutionSteps.map((step, index) => (
              <View key={index} style={styles.solutionStep}>
                <Text style={styles.stepNumber}>Step {index + 1}</Text>
                <Text style={styles.stepExplanation}>{step.explanation}</Text>
                <View style={styles.stepMath}>
                  <Text style={styles.stepMathText}>{step.mathExpression}</Text>
                </View>
              </View>
            ))}

            <View style={styles.finalAnswer}>
              <Text style={styles.finalAnswerLabel}>Final Answer:</Text>
              <Text style={styles.finalAnswerValue}>
                {formatAnswerDisplay(problem.answer)}
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  helpText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  problemCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  problemDirection: {
    fontSize: 18,
    color: '#e5e7eb',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  problemEquation: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  equationText: {
    fontSize: 24,
    color: '#ffffff',
    fontFamily: 'monospace',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  answerPrefix: {
    alignItems: 'center',
  },
  answerPrefixText: {
    fontSize: 20,
    color: '#10b981',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  inputSection: {
    margin: 20,
    marginVertical: 24,
    minHeight: 300,
    height: 300,
  },
  inputLabel: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 12,
    fontWeight: '600',
  },
  latexPreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  latexLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: '500',
  },
  latexText: {
    fontSize: 16,
    color: '#10b981',
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    margin: 20,
    gap: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
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
  solutionButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  solutionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  resultCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  correctResult: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  incorrectResult: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultDetails: {
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 14,
    color: '#e5e7eb',
    marginBottom: 4,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 18,
    color: '#ffffff',
    fontFamily: 'monospace',
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 6,
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  solutionCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  solutionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  solutionStep: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#111827',
    borderRadius: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  stepExplanation: {
    fontSize: 16,
    color: '#e5e7eb',
    marginBottom: 12,
    lineHeight: 22,
  },
  stepMath: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  stepMathText: {
    fontSize: 18,
    color: '#ffffff',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  finalAnswer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#064e3b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  finalAnswerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  finalAnswerValue: {
    fontSize: 20,
    color: '#ffffff',
    fontFamily: 'monospace',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorNote: {
    color: '#ef4444',
    fontStyle: 'italic',
  },
});
