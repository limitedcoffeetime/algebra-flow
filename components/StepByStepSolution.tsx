import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SmartMathRenderer from './SmartMathRenderer';

interface SolutionStep {
  explanation: string;
  mathExpression: string;
  isEquation: boolean;
}

interface StepByStepSolutionProps {
  solutionSteps: SolutionStep[] | string[]; // Support both old and new formats
  isVisible: boolean;
  onToggle: () => void;
}

const StepByStepSolution: React.FC<StepByStepSolutionProps> = ({
  solutionSteps,
  isVisible,
  onToggle
}) => {
  // Convert old string format to new structured format for backward compatibility
  const normalizeSteps = (steps: SolutionStep[] | string[]): SolutionStep[] => {
    if (!Array.isArray(steps) || steps.length === 0) return [];

    // Check if it's the old string format
    if (typeof steps[0] === 'string') {
      return (steps as string[]).map((step, index) => ({
        explanation: `Step ${index + 1}`,
        mathExpression: step,
        isEquation: step.includes('=')
      }));
    }

    return steps as SolutionStep[];
  };

  const normalizedSteps = normalizeSteps(solutionSteps);

  if (normalizedSteps.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle}>
        <Text style={styles.title}>Step-by-Step Solution</Text>
        <Ionicons
          name={isVisible ? "chevron-up" : "chevron-down"}
          size={24}
          color="#ffffff"
        />
      </TouchableOpacity>

      {isVisible && (
        <View style={styles.stepsContainer}>
          {normalizedSteps.map((step, index) => (
            <SolutionStep
              key={index}
              step={step}
              stepNumber={index + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Individual step component for better modularity
const SolutionStep: React.FC<{ step: SolutionStep; stepNumber: number }> = ({ step, stepNumber }) => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{stepNumber}</Text>
        </View>
        <Text style={styles.stepExplanation}>{step.explanation}</Text>
      </View>

      <View style={styles.mathContainer}>
        <SmartMathRenderer
          text={step.mathExpression}
          fontSize={18}
          color="#ffffff"
          style={styles.stepMath}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#16213e',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepsContainer: {
    padding: 16,
  },
  stepContainer: {
    marginBottom: 20,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepExplanation: {
    fontSize: 16,
    color: '#e2e8f0',
    flex: 1,
    lineHeight: 22,
  },
  mathContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  stepMath: {
    minHeight: 40,
  },
});

export default StepByStepSolution;
