import React, { useCallback } from 'react';
import { View } from 'react-native';
import { CustomKeyboard } from './CustomKeyboard';
import { useCursorPosition } from './hooks/useCursorPosition';
import { useKeyboardAnimation } from './hooks/useKeyboardAnimation';
import { InputDisplay } from './InputDisplay';
import { styles } from './styles';
import type { MathInputProps } from './types';

const MathInput: React.FC<MathInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Enter your answer",
  variables = ['x'],
  isValidating = false,
  showPreview = true,
}) => {
  // Custom hooks for clean separation of concerns
  const { insertAtCursor, handleBackspace, cursorPosition, setCursorPosition } = useCursorPosition(value, onChangeText);
  const { keyboardVisible, keyboardHeight, toggleKeyboard } = useKeyboardAnimation();

  // Handle cursor position changes from TextInput
  const handleSelectionChange = useCallback((event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  }, [setCursorPosition]);

  return (
    <View style={styles.container}>
      {/* Input Display Area */}
      <InputDisplay
        value={value}
        placeholder={placeholder}
        showPreview={showPreview}
        keyboardVisible={keyboardVisible}
        onToggleKeyboard={toggleKeyboard}
        onChangeText={onChangeText}
        onSelectionChange={handleSelectionChange}
      />

      {/* Custom Keyboard */}
      <CustomKeyboard
        visible={keyboardVisible}
        keyboardHeight={keyboardHeight}
        variables={variables}
        onInsertText={insertAtCursor}
        onBackspace={handleBackspace}
        onSubmit={onSubmit}
        isValidating={isValidating}
      />
    </View>
  );
};

export default MathInput;
