import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SolutionStep } from '../services/problemGeneration/openaiGenerator';
import { getContextualHint, useRealTimeValidation } from '../utils/useRealTimeValidation';
import MathInput from './MathInput';
import SmartMathRenderer from './SmartMathRenderer';
import StepByStepSolution from './StepByStepSolution';

// Example problem data with new structured format
const EXAMPLE_PROBLEM = {
  equation: "2x + 5 = 13",
  direction: "Solve for x",
  answer: 4,
  variables: ["x"],
  solutionSteps: [
    {
      explanation: "Start with the original equation",
      mathExpression: "2x + 5 = 13",
      isEquation: true
    },
    {
      explanation: "Subtract 5 from both sides to isolate the term with x",
      mathExpression: "2x = 8",
      isEquation: true
    },
    {
      explanation: "Divide both sides by 2 to solve for x",
      mathExpression: "x = 4",
      isEquation: true
    }
  ] as SolutionStep[],
  difficulty: "easy" as const,
  problemType: "linear-one-variable" as const,
  isCompleted: false
};

const ProblemScreen: React.FC = () => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time validation
  const validation = useRealTimeValidation({
    userInput: userAnswer,
    correctAnswer: EXAMPLE_PROBLEM.answer,
    problemDirection: EXAMPLE_PROBLEM.direction,
    variables: EXAMPLE_PROBLEM.variables,
    debounceMs: 300, // Faster for demo
  });

  const contextualHint = getContextualHint(
    EXAMPLE_PROBLEM.direction,
    EXAMPLE_PROBLEM.variables,
    userAnswer
  );

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      Alert.alert('Please enter an answer');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const isCorrect = validation.isValid === true;

      if (isCorrect) {
        Alert.alert(
          'Correct! 🎉',
          'Great job! You solved the equation correctly.',
          [
            { text: 'View Solution', onPress: () => setShowSolution(true) },
            { text: 'Next Problem', onPress: () => {} },
          ]
        );
      } else {
        Alert.alert(
          'Not quite right',
          'Would you like to try again or see the solution?',
          [
            { text: 'Try Again', style: 'cancel' },
            { text: 'Show Solution', onPress: () => setShowSolution(true) },
          ]
        );
      }

      setIsSubmitting(false);
    }, 1000);
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Problem Header */}
          <View style={styles.problemContainer}>
            <Text style={styles.problemTitle}>Algebra Practice</Text>
            <Text style={styles.direction}>{EXAMPLE_PROBLEM.direction}</Text>

            {/* Problem Equation */}
            <View style={styles.equationContainer}>
              <SmartMathRenderer
                text={EXAMPLE_PROBLEM.equation}
                fontSize={28}
                color="#ffffff"
                style={styles.equation}
              />
            </View>

            {/* Difficulty Badge */}
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                {EXAMPLE_PROBLEM.difficulty.toUpperCase()}
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
            solutionSteps={EXAMPLE_PROBLEM.solutionSteps}
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
            variables={EXAMPLE_PROBLEM.variables}
            isValidating={isSubmitting}
            showPreview={true}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    height: 100, // Space for the fixed input
  },
  inputSection: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
});

export default ProblemScreen;
