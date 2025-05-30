import Button from '@/components/Button';
import FeedbackSection from '@/components/FeedbackSection';
import ProblemContainer, { Problem } from '@/components/ProblemContainer';
import React, { useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';

export default function Index() {
  const currentProblem: Problem = {
    id: 'problem1',
    equation: "3y - 7 = 14",
    answer: 7,
    solutionSteps: [
      'Add 7 to both sides:',
      '3y - 7 + 7 = 14 + 7',
      '3y = 21',
      'Divide both sides by 3:',
      '3y ÷ 3 = 21 ÷ 3',
      'y = 7'
    ]
  };

  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    console.log("User's answer:", userAnswer);
    Keyboard.dismiss();

    // Check if answer is correct
    const numericAnswer = parseFloat(userAnswer);
    const correct = numericAnswer === currentProblem.answer;

    setIsCorrect(correct);
    setShowFeedback(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <ProblemContainer problem={currentProblem} />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Your answer"
            placeholderTextColor="#999"
            keyboardType="numeric"
            onChangeText={(text) => {
              setUserAnswer(text);
              // Clear feedback when user starts typing again
              if (showFeedback) {
                setShowFeedback(false);
              }
            }}
            value={userAnswer}
          />
          <Button label="Submit" onPress={handleSubmit} />
        </View>

        {showFeedback && (
          <FeedbackSection
            isCorrect={isCorrect}
            solutionSteps={currentProblem.solutionSteps}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});
