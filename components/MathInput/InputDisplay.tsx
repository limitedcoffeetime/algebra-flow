import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SmartMathRenderer from '../SmartMathRenderer';
import { styles } from './styles';
import type { InputDisplayProps } from './types';

interface InputDisplayExtendedProps extends InputDisplayProps {
  onChangeText: (text: string) => void;
  onSelectionChange: (event: any) => void;
}

export const InputDisplay: React.FC<InputDisplayExtendedProps> = ({
  value,
  placeholder,
  showPreview,
  keyboardVisible,
  answerPrefix,
  onToggleKeyboard,
  onChangeText,
  onSelectionChange,
}) => {
  const textInputRef = useRef<TextInput>(null);

  // Focus input on mount for iOS
  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      textInputRef.current?.focus();
    }
  }, []);

  // Combine prefix with user input for display
  const displayValue = answerPrefix ? `${answerPrefix}${value}` : value;
  const actualPlaceholder = answerPrefix ? `${answerPrefix}${placeholder}` : placeholder;

  return (
    <View style={styles.inputContainer}>
      {/* Hidden TextInput for system integration - only handles user input part */}
      <TextInput
        ref={textInputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={onSelectionChange}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType="numeric"
        showSoftInputOnFocus={false}
        autoComplete="off"
        autoCorrect={false}
        spellCheck={false}
        accessibilityLabel="Math input field"
      />

      {/* Math Preview with prefix */}
      {showPreview && displayValue.trim() ? (
        <View style={styles.previewContainer}>
          {answerPrefix ? (
            <View style={styles.prefixContainer}>
              <SmartMathRenderer
                text={answerPrefix}
                fontSize={20}
                color="#94a3b8"
                style={styles.prefixText}
              />
              <SmartMathRenderer
                text={value || ' '}
                fontSize={20}
                color="#ffffff"
                style={styles.preview}
              />
            </View>
          ) : (
            <SmartMathRenderer
              text={displayValue}
              fontSize={20}
              color="#ffffff"
              style={styles.preview}
            />
          )}
        </View>
      ) : (
        <>
          {/* Placeholder text when empty */}
          {!displayValue.trim() && (
            <Text style={styles.placeholderText}>{actualPlaceholder}</Text>
          )}

          {/* Fallback text display when preview disabled */}
          {displayValue.trim() && !showPreview && (
            <View style={answerPrefix ? styles.prefixContainer : undefined}>
              {answerPrefix && (
                <Text style={styles.prefixFallbackText}>{answerPrefix}</Text>
              )}
              <Text style={styles.inputText}>{value}</Text>
            </View>
          )}
        </>
      )}

      {/* Keyboard Toggle Button */}
      <TouchableOpacity
        style={styles.keyboardToggle}
        onPress={onToggleKeyboard}
        accessibilityRole="button"
        accessibilityLabel={keyboardVisible ? "Hide keyboard" : "Show keyboard"}
      >
        <Ionicons
          name={keyboardVisible ? "chevron-down" : "chevron-up"}
          size={20}
          color="#94a3b8"
        />
        <Text style={styles.toggleText}>
          {keyboardVisible ? "Hide" : "Show"} Keyboard
        </Text>
      </TouchableOpacity>
    </View>
  );
};
