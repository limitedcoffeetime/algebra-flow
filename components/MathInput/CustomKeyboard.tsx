import React from 'react';
import { Animated, View } from 'react-native';
import {
  BackspaceKey,
  ExponentKey,
  FractionKey,
  NumberKey,
  OperatorKey,
  SqrtKey,
  SubmitKey,
  VariableKey,
} from './KeyboardKeys';
import { styles } from './styles';
import type { CustomKeyboardProps } from './types';

const KEYBOARD_FULL_HEIGHT = 405;

export const CustomKeyboard: React.FC<CustomKeyboardProps> = ({
  visible,
  keyboardHeight,
  variables,
  onInsertText,
  onBackspace,
  onSubmit,
  isValidating,
}) => {
  return (
    <Animated.View
      style={[
        styles.keyboard,
        {
          height: keyboardHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, KEYBOARD_FULL_HEIGHT],
          }),
          opacity: keyboardHeight,
        },
      ]}
    >
      {visible && (
        <View style={styles.keyboardContent}>
          {/* Top Row - Special Functions */}
          <View style={styles.keyboardRow}>
            <FractionKey onPress={() => onInsertText('/')} />
            <ExponentKey onPress={() => onInsertText('^')} />
            <SqrtKey onPress={() => onInsertText('sqrt(')} />

            {/* Variable buttons */}
            {variables.map((variable) => (
              <VariableKey
                key={variable}
                variable={variable}
                onPress={() => onInsertText(variable)}
              />
            ))}

            <BackspaceKey onPress={onBackspace} />
          </View>

          {/* Number Pad */}
          {/* Row 1 */}
          <View style={styles.keyboardRow}>
            <NumberKey number="7" onPress={() => onInsertText('7')} />
            <NumberKey number="8" onPress={() => onInsertText('8')} />
            <NumberKey number="9" onPress={() => onInsertText('9')} />
            <OperatorKey operator="÷" onPress={() => onInsertText('/')} />
          </View>

          {/* Row 2 */}
          <View style={styles.keyboardRow}>
            <NumberKey number="4" onPress={() => onInsertText('4')} />
            <NumberKey number="5" onPress={() => onInsertText('5')} />
            <NumberKey number="6" onPress={() => onInsertText('6')} />
            <OperatorKey operator="×" onPress={() => onInsertText('*')} />
          </View>

          {/* Row 3 */}
          <View style={styles.keyboardRow}>
            <NumberKey number="1" onPress={() => onInsertText('1')} />
            <NumberKey number="2" onPress={() => onInsertText('2')} />
            <NumberKey number="3" onPress={() => onInsertText('3')} />
            <OperatorKey operator="-" onPress={() => onInsertText('-')} />
          </View>

          {/* Row 4 */}
          <View style={styles.keyboardRow}>
            <NumberKey number="0" onPress={() => onInsertText('0')} />
            <NumberKey number="." onPress={() => onInsertText('.')} />
            <OperatorKey operator="(" onPress={() => onInsertText('(')} />
            <OperatorKey operator="+" onPress={() => onInsertText('+')} />
          </View>

          {/* Row 5 - Submit and operators */}
          <View style={styles.keyboardRow}>
            <OperatorKey operator=")" onPress={() => onInsertText(')')} />
            <OperatorKey operator="=" onPress={() => onInsertText('=')} />
            <SubmitKey
              isValidating={isValidating}
              text={isValidating ? 'Checking...' : 'Submit'}
              onPress={onSubmit}
            />
          </View>
        </View>
      )}
    </Animated.View>
  );
};
