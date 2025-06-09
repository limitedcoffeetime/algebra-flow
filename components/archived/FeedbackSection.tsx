import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import StepByStepSolution from './StepByStepSolution';

interface FeedbackSectionProps {
  isCorrect: boolean;
  solutionSteps?: string[];
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  isCorrect,
  solutionSteps
}) => {
  const [isSolutionExpanded, setIsSolutionExpanded] = useState(false);

  // Reset expanded state when feedback changes (new submission)
  useEffect(() => {
    setIsSolutionExpanded(false);
  }, [isCorrect]);

  const toggleSolution = () => {
    setIsSolutionExpanded(!isSolutionExpanded);
  };

  return (
    <View style={styles.feedbackContainer}>
      {isCorrect ? (
        <Text style={styles.correctText}>Correct! Well done!</Text>
      ) : (
        <>
          <Text style={styles.incorrectText}>Incorrect</Text>
          {solutionSteps && solutionSteps.length > 0 && (
            <StepByStepSolution
              steps={solutionSteps}
              isExpanded={isSolutionExpanded}
              onToggle={toggleSolution}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  feedbackContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  correctText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  incorrectText: {
    fontSize: 18,
    color: '#F44336',
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default FeedbackSection;
