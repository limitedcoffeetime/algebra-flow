import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import SmartMathRenderer from './SmartMathRenderer';

interface MathInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  variables?: string[]; // Variables used in the current problem
  isValidating?: boolean;
  showPreview?: boolean;
}

const { width } = Dimensions.get('window');

const MathInput: React.FC<MathInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Enter your answer",
  variables = ['x'],
  isValidating = false,
  showPreview = true,
}) => {
  const [cursorPosition, setCursorPosition] = useState(0);
  const textInputRef = useRef<TextInput>(null);

  // Track cursor position
  const handleSelectionChange = (event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  // Insert text at cursor position
  const insertAtCursor = (text: string) => {
    const newValue = value.slice(0, cursorPosition) + text + value.slice(cursorPosition);
    onChangeText(newValue);
    setCursorPosition(cursorPosition + text.length);
  };

  // Handle backspace
  const handleBackspace = () => {
    if (cursorPosition > 0) {
      const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
      onChangeText(newValue);
      setCursorPosition(cursorPosition - 1);
    }
  };

  // Focus input when component mounts
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // On iOS, we'll hide the keyboard but keep focus for cursor
      textInputRef.current?.focus();
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Input Display */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={textInputRef}
          style={styles.hiddenInput}
          value={value}
          onChangeText={onChangeText}
          onSelectionChange={handleSelectionChange}
          placeholder={placeholder}
          placeholderTextColor="#666"
          keyboardType="numeric"
          showSoftInputOnFocus={false} // Hide system keyboard
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
        />

        {/* Math Preview */}
        {showPreview && value.trim() && (
          <View style={styles.previewContainer}>
            <SmartMathRenderer
              text={value}
              fontSize={20}
              color="#ffffff"
              style={styles.preview}
            />
          </View>
        )}

        {/* Fallback text display */}
        {!value.trim() && (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}

        {value.trim() && !showPreview && (
          <Text style={styles.inputText}>{value}</Text>
        )}
      </View>

      {/* Custom Keyboard */}
      <View style={styles.keyboard}>
        {/* Top Row - Special Functions */}
        <View style={styles.keyboardRow}>
          <TouchableOpacity
            style={styles.specialKey}
            onPress={() => insertAtCursor('/')}
          >
            <View style={styles.fractionKey}>
              <Text style={styles.keyText}>□</Text>
              <View style={styles.fractionLine} />
              <Text style={styles.keyText}>□</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.specialKey}
            onPress={() => insertAtCursor('^')}
          >
            <View style={styles.exponentKey}>
              <Text style={styles.keyText}>x</Text>
              <Text style={[styles.keyText, styles.superscript]}>n</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.specialKey}
            onPress={() => insertAtCursor('sqrt(')}
          >
            <Text style={styles.keyText}>√</Text>
          </TouchableOpacity>

          {/* Variable buttons */}
          {variables.map((variable) => (
            <TouchableOpacity
              key={variable}
              style={styles.variableKey}
              onPress={() => insertAtCursor(variable)}
            >
              <Text style={styles.keyText}>{variable}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.backspaceKey}
            onPress={handleBackspace}
          >
            <Ionicons name="backspace" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Number Pad */}
        <View style={styles.numberPad}>
          {/* Row 1 */}
          <View style={styles.keyboardRow}>
            <NumberKey number="7" onPress={() => insertAtCursor('7')} />
            <NumberKey number="8" onPress={() => insertAtCursor('8')} />
            <NumberKey number="9" onPress={() => insertAtCursor('9')} />
            <OperatorKey operator="÷" onPress={() => insertAtCursor('/')} />
          </View>

          {/* Row 2 */}
          <View style={styles.keyboardRow}>
            <NumberKey number="4" onPress={() => insertAtCursor('4')} />
            <NumberKey number="5" onPress={() => insertAtCursor('5')} />
            <NumberKey number="6" onPress={() => insertAtCursor('6')} />
            <OperatorKey operator="×" onPress={() => insertAtCursor('*')} />
          </View>

          {/* Row 3 */}
          <View style={styles.keyboardRow}>
            <NumberKey number="1" onPress={() => insertAtCursor('1')} />
            <NumberKey number="2" onPress={() => insertAtCursor('2')} />
            <NumberKey number="3" onPress={() => insertAtCursor('3')} />
            <OperatorKey operator="-" onPress={() => insertAtCursor('-')} />
          </View>

          {/* Row 4 */}
          <View style={styles.keyboardRow}>
            <NumberKey number="0" onPress={() => insertAtCursor('0')} />
            <NumberKey number="." onPress={() => insertAtCursor('.')} />
            <OperatorKey operator="(" onPress={() => insertAtCursor('(')} />
            <OperatorKey operator="+" onPress={() => insertAtCursor('+')} />
          </View>

          {/* Row 5 */}
          <View style={styles.keyboardRow}>
            <OperatorKey operator=")" onPress={() => insertAtCursor(')')} />
            <OperatorKey operator="=" onPress={() => insertAtCursor('=')} />
            <TouchableOpacity
              style={[styles.submitKey, isValidating && styles.submitKeyDisabled]}
              onPress={onSubmit}
              disabled={isValidating}
            >
              <Text style={styles.submitKeyText}>
                {isValidating ? '...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// Helper components
const NumberKey: React.FC<{ number: string; onPress: () => void }> = ({ number, onPress }) => (
  <TouchableOpacity style={styles.numberKey} onPress={onPress}>
    <Text style={styles.keyText}>{number}</Text>
  </TouchableOpacity>
);

const OperatorKey: React.FC<{ operator: string; onPress: () => void }> = ({ operator, onPress }) => (
  <TouchableOpacity style={styles.operatorKey} onPress={onPress}>
    <Text style={styles.keyText}>{operator}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
  },
  inputContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    minHeight: 80,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    minHeight: 40,
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  inputText: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  keyboard: {
    backgroundColor: '#16213e',
    paddingTop: 16,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  specialKey: {
    backgroundColor: '#374151',
    minWidth: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  fractionKey: {
    alignItems: 'center',
  },
  fractionLine: {
    width: 20,
    height: 1,
    backgroundColor: '#ffffff',
    marginVertical: 2,
  },
  exponentKey: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  superscript: {
    fontSize: 12,
    marginLeft: 2,
    marginTop: -4,
  },
  variableKey: {
    backgroundColor: '#7c3aed',
    minWidth: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  backspaceKey: {
    backgroundColor: '#dc2626',
    minWidth: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  numberPad: {
    paddingBottom: 16,
  },
  numberKey: {
    backgroundColor: '#475569',
    width: (width - 64) / 4 - 8,
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  operatorKey: {
    backgroundColor: '#f59e0b',
    width: (width - 64) / 4 - 8,
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  submitKey: {
    backgroundColor: '#10b981',
    width: ((width - 64) / 4) * 2 - 4,
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  submitKeyDisabled: {
    backgroundColor: '#6b7280',
  },
  keyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  submitKeyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default MathInput;
