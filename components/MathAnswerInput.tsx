import { Problem } from '@/repositories/models/Problem';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface MathAnswerInputProps {
  problem: Problem;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function MathAnswerInput({
  problem,
  userAnswer,
  onAnswerChange,
  onSubmit,
  isSubmitting
}: MathAnswerInputProps) {

  const handleSubmit = () => {
    if (!isSubmitting && userAnswer.trim()) {
      onSubmit();
    }
  };

  return (
    <View style={styles.inputSection}>
      <View style={styles.inputContainer}>
        {/* Answer display with LaTeX preview */}
        <View style={styles.inputDisplay}>
          <Text style={styles.answerPrefix}>
            {problem.answerLHS ? `${problem.answerLHS}` : ''}
          </Text>
          {userAnswer ? (
            <Text style={styles.latexPreview}>
              {userAnswer}
            </Text>
          ) : (
            <Text style={styles.placeholder}>
              Enter your answer (try the Training tab for advanced math input)
            </Text>
          )}
        </View>

        {/* Simple Text Input (fallback) */}
        <View style={styles.mathInputContainer}>
          <TextInput
            style={styles.textInput}
            value={userAnswer}
            onChangeText={onAnswerChange}
            placeholder="Type your answer (or use Training tab for math editor)..."
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            editable={!isSubmitting}
          />
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !userAnswer.trim()}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Checking...' : 'Submit Answer'}
          </Text>
        </TouchableOpacity>

        {/* Helper text */}
        <Text style={styles.helperText}>
          💡 For advanced math input with fractions, exponents, and symbols, use the Training tab!
        </Text>
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
    minHeight: 60,
    justifyContent: 'center',
  },
  answerPrefix: {
    fontSize: 18,
    color: '#ffffff',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  latexPreview: {
    fontSize: 16,
    color: '#10b981',
    fontFamily: 'monospace',
    backgroundColor: '#1f2937',
    padding: 8,
    borderRadius: 4,
  },
  placeholder: {
    fontSize: 16,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  mathInputContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    color: '#ffffff',
    minHeight: 60,
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  helperText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
