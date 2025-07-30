import { Problem } from '@/repositories/models/Problem';
import { calculateResponsiveFontSize } from '@/utils/responsiveText';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

interface ProblemDisplayProps {
  problem: Problem;
}

// Helper function to get answer format instructions
const getAnswerFormatInstructions = (problemType: string): string => {
  switch (problemType) {
    case 'quadratic-factoring':
    case 'quadratic-formula':
      return 'Submit both answers separated by a comma (e.g., "3, -2"). Order does not matter.';
    case 'systems-of-equations':
      return 'Submit your answer as an ordered pair (x, y), for example: (3, -2) or 3, -2';
    case 'polynomial-simplification':
      return 'Submit your answer in standard form (terms in ascending order of degree) and fully simplified.';
    case 'linear-one-variable':
    case 'linear-two-variables':
      return 'Submit your answer in fully simplified form.';
    default:
      return 'Submit your answer in fully simplified form.';
  }
};

export default function ProblemDisplay({ problem }: ProblemDisplayProps) {
  // Get screen dimensions for responsive calculations
  const screenWidth = Dimensions.get('window').width;
  const containerWidth = Math.min(screenWidth - 64, 400); // Account for margins and max width

  // Always use equations array (clean and simple!)
  const equationsToDisplay = problem.equations;
  
  // Calculate responsive font sizes for native platform using first equation
  const responsiveSettings = calculateResponsiveFontSize(equationsToDisplay[0], problem.direction, containerWidth, 'native');

  const answerInstructions = getAnswerFormatInstructions(problem.problemType);

  return (
    <View style={styles.problemContainer}>
      <Text style={styles.problemTitle}>Algebra Practice</Text>
      <Text style={[
        styles.direction,
        {
          fontSize: responsiveSettings.directionFontSize,
          lineHeight: responsiveSettings.directionFontSize * 1.4,
        }
      ]}>
        {problem.direction}
      </Text>

      {/* Problem Equation(s) */}
      <View style={styles.equationContainer}>
        {equationsToDisplay.map((equation, index) => (
          <Text 
            key={index} 
            style={[
              styles.equation,
              {
                fontSize: responsiveSettings.equationFontSize,
                lineHeight: responsiveSettings.equationFontSize * 1.2,
                marginBottom: index < equationsToDisplay.length - 1 ? 8 : 0,
              }
            ]}
          >
            {equation}
          </Text>
        ))}
      </View>

      {/* Answer Format Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsLabel}>Answer Format:</Text>
        <Text style={styles.instructionsText}>{answerInstructions}</Text>
      </View>

      {/* Difficulty Badge */}
      <View style={styles.difficultyBadge}>
        <Text style={styles.difficultyText}>
          {problem.difficulty.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  problemContainer: {
    backgroundColor: '#1a1a2e',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: '100%',
  },
  problemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  direction: {
    fontSize: 16, // This will be overridden by responsive settings
    color: '#94a3b8',
    marginBottom: 20,
    textAlign: 'center',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  equationContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    maxWidth: '100%',
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  equation: {
    fontSize: 28, // This will be overridden by responsive settings
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'monospace',
    maxWidth: '100%',
  },
  instructionsContainer: {
    backgroundColor: '#0f1629',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
    maxWidth: '100%',
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 4,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 12,
    color: '#fde68a',
    textAlign: 'center',
    lineHeight: 16,
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
});
