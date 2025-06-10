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

  return (
    <View style={styles.inputContainer}>
      {/* Hidden TextInput for system integration */}
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

      {/* Math Preview */}
      {showPreview && value.trim() ? (
        <View style={styles.previewContainer}>
          <SmartMathRenderer
            text={value}
            fontSize={20}
            color="#ffffff"
            style={styles.preview}
          />
        </View>
      ) : (
        <>
          {/* Placeholder text when empty */}
          {!value.trim() && (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}

          {/* Fallback text display when preview disabled */}
          {value.trim() && !showPreview && (
            <Text style={styles.inputText}>{value}</Text>
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
