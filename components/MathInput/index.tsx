import React from 'react';
import { View } from 'react-native';
import { CustomKeyboard } from './CustomKeyboard';
import { useKeyboardAnimation } from './hooks/useKeyboardAnimation';
import { useMathCursor } from './hooks/useMathCursor';
import { InputDisplay } from './InputDisplay';
import { styles } from './styles';
import type { MathInputProps } from './types';

const MathInput: React.FC<MathInputProps> = ({
  value,
  onChangeExpression,
  onSubmit,
  placeholder = "Enter your answer",
  variables = ['x'],
  isValidating = false,
  showPreview = true,
  answerPrefix,
}) => {
  // Custom hooks for clean separation of concerns
  const {
    insertComponentAtCursor,
    insertTextAtCursor,
    handleBackspace,
    cursorPosition,
    setCursorPosition,
    setFocusedComponent,
    focusedComponentId
  } = useMathCursor(value, onChangeExpression);
  const { keyboardVisible, keyboardHeight, toggleKeyboard } = useKeyboardAnimation();

  return (
    <View style={styles.container}>
      {/* Input Display Area */}
      <InputDisplay
        value={value}
        placeholder={placeholder}
        showPreview={showPreview}
        keyboardVisible={keyboardVisible}
        answerPrefix={answerPrefix}
        onToggleKeyboard={toggleKeyboard}
        onFocusComponent={setFocusedComponent}
        focusedComponentId={focusedComponentId}
        onPositionCursor={setCursorPosition}
      />

      {/* Custom Keyboard */}
      <CustomKeyboard
        visible={keyboardVisible}
        keyboardHeight={keyboardHeight}
        variables={variables}
        onInsertComponent={insertComponentAtCursor}
        onInsertText={insertTextAtCursor}
        onBackspace={handleBackspace}
        onSubmit={onSubmit}
        isValidating={isValidating}
      />
    </View>
  );
};

export default MathInput;
