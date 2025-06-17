import { Problem } from '@/repositories/models/Problem';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AnswerInputProps {
  problem: Problem;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function AnswerInput({
  problem,
  userAnswer,
  onAnswerChange,
  onSubmit,
  isSubmitting
}: AnswerInputProps) {
  return (
    <View style={styles.inputSection}>
      <View style={styles.inputContainer}>
        {/* Answer display */}
        <View style={styles.inputDisplay}>
          <Text style={styles.answerPrefix}>
            {problem.answerLHS ? `${problem.answerLHS}  ` : ''}
            {userAnswer || 'Enter your answer'}
          </Text>
        </View>

        {/* Text input */}
        <TextInput
          style={styles.textInput}
          value={userAnswer}
          onChangeText={onAnswerChange}
          placeholder="Type your answer..."
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="default"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Checking...' : 'Submit Answer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputSection: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  inputContainer: {
    padding: 16,
  },
  inputDisplay: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  answerPrefix: {
    fontSize: 20,
    color: '#ffffff',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#4b5563',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
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
});
