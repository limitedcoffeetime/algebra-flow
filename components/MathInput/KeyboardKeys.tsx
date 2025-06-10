import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';
import type {
  NumberKeyProps,
  OperatorKeyProps,
  SpecialKeyProps,
  SubmitKeyProps,
  VariableKeyProps,
} from './types';

export const NumberKey: React.FC<NumberKeyProps> = ({ number, onPress, disabled = false }) => (
  <TouchableOpacity
    style={[styles.numberKey, disabled && { opacity: 0.5 }]}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={`Number ${number}`}
  >
    <Text style={styles.keyText}>{number}</Text>
  </TouchableOpacity>
);

export const OperatorKey: React.FC<OperatorKeyProps> = ({ operator, onPress, disabled = false }) => (
  <TouchableOpacity
    style={[styles.operatorKey, disabled && { opacity: 0.5 }]}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={`Operator ${operator}`}
  >
    <Text style={styles.keyText}>{operator}</Text>
  </TouchableOpacity>
);

export const SpecialKey: React.FC<SpecialKeyProps> = ({ children, onPress, disabled = false }) => (
  <TouchableOpacity
    style={[styles.specialKey, disabled && { opacity: 0.5 }]}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
  >
    {children}
  </TouchableOpacity>
);

export const VariableKey: React.FC<VariableKeyProps> = ({ variable, onPress, disabled = false }) => (
  <TouchableOpacity
    style={[styles.variableKey, disabled && { opacity: 0.5 }]}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={`Variable ${variable}`}
  >
    <Text style={styles.keyText}>{variable}</Text>
  </TouchableOpacity>
);

export const BackspaceKey: React.FC<{ onPress: () => void; disabled?: boolean }> = ({
  onPress,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[styles.backspaceKey, disabled && { opacity: 0.5 }]}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel="Backspace"
  >
    <Ionicons name="backspace" size={24} color="#ffffff" />
  </TouchableOpacity>
);

export const SubmitKey: React.FC<SubmitKeyProps> = ({
  isValidating,
  text,
  onPress,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[
      styles.submitKey,
      (isValidating || disabled) && styles.submitKeyDisabled,
    ]}
    onPress={onPress}
    disabled={isValidating || disabled}
    accessibilityRole="button"
    accessibilityLabel="Submit answer"
  >
    <Text style={styles.submitKeyText}>
      {text}
    </Text>
  </TouchableOpacity>
);

// Compound keys with specific layouts
export const FractionKey: React.FC<{ onPress: () => void; disabled?: boolean }> = ({
  onPress,
  disabled = false,
}) => (
  <SpecialKey onPress={onPress} disabled={disabled}>
    <View style={styles.fractionKey}>
      <Text style={styles.keyText}>□</Text>
      <View style={styles.fractionLine} />
      <Text style={styles.keyText}>□</Text>
    </View>
  </SpecialKey>
);

export const ExponentKey: React.FC<{ onPress: () => void; disabled?: boolean }> = ({
  onPress,
  disabled = false,
}) => (
  <SpecialKey onPress={onPress} disabled={disabled}>
    <View style={styles.exponentKey}>
      <Text style={styles.keyText}>x</Text>
      <Text style={[styles.keyText, styles.superscript]}>n</Text>
    </View>
  </SpecialKey>
);

export const SqrtKey: React.FC<{ onPress: () => void; disabled?: boolean }> = ({
  onPress,
  disabled = false,
}) => (
  <SpecialKey onPress={onPress} disabled={disabled}>
    <Text style={styles.keyText}>√</Text>
  </SpecialKey>
);
