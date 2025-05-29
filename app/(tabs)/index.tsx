import Button from '@/components/Button';
import ProblemContainer, { Problem } from '@/components/ProblemContainer';
import React, { useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';

export default function Index() {
  const currentProblem: Problem = {
    id: 'problem1',
    equation: "3y - 7 = 14",
    answer: 7,
  };

  const [userAnswer, setUserAnswer] = useState('');

  const handleSubmit = () => {
    console.log("User's answer:", userAnswer);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <ProblemContainer problem={currentProblem} />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Your answer"
          placeholderTextColor="#999"
          keyboardType="numeric"
          onChangeText={setUserAnswer}
          value={userAnswer}
        />
        <Button label="Submit" onPress={handleSubmit} />
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    width: '90%',
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
