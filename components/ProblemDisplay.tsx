import { Problem } from '@/repositories/models/Problem';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProblemDisplayProps {
  problem: Problem;
}

export default function ProblemDisplay({ problem }: ProblemDisplayProps) {
  return (
    <View style={styles.problemContainer}>
      <Text style={styles.problemTitle}>Algebra Practice</Text>
      <Text style={styles.direction}>{problem.direction}</Text>

      {/* Problem Equation */}
      <View style={styles.equationContainer}>
        <Text style={styles.equation}>{problem.equation}</Text>
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
});
