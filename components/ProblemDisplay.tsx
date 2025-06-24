import { Problem } from '@/repositories/models/Problem';
import { calculateResponsiveFontSize } from '@/utils/responsiveText';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

interface ProblemDisplayProps {
  problem: Problem;
}

export default function ProblemDisplay({ problem }: ProblemDisplayProps) {
  // Get screen dimensions for responsive calculations
  const screenWidth = Dimensions.get('window').width;
  const containerWidth = Math.min(screenWidth - 64, 400); // Account for margins and max width

  // Calculate responsive font sizes for native platform
  const responsiveSettings = calculateResponsiveFontSize(problem.equation, problem.direction, containerWidth, 'native');

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

      {/* Problem Equation */}
      <View style={styles.equationContainer}>
        <Text style={[
          styles.equation,
          {
            fontSize: responsiveSettings.equationFontSize,
            lineHeight: responsiveSettings.equationFontSize * 1.3,
            flexWrap: responsiveSettings.shouldWrap ? 'wrap' : 'nowrap',
          }
        ]}>
          {problem.equation}
        </Text>
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
