import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProgressIndicatorProps {
  problemsCorrect: number;
  problemsAttempted: number;
}

export default function ProgressIndicator({
  problemsCorrect,
  problemsAttempted
}: ProgressIndicatorProps) {
  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        Progress: {problemsCorrect}/{problemsAttempted}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
