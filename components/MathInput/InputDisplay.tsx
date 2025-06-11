import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import EnhancedMathRenderer from '../EnhancedMathRenderer';
import SmartMathRenderer from '../SmartMathRenderer';
import { styles } from './styles';
import type { InputDisplayProps } from './types';

interface InputDisplayExtendedProps extends InputDisplayProps {
  onPositionCursor?: (position: number) => void;
}

export const InputDisplay: React.FC<InputDisplayExtendedProps> = ({
  value,
  placeholder,
  showPreview,
  keyboardVisible,
  answerPrefix,
  onToggleKeyboard,
  onFocusComponent,
  focusedComponentId,
  onPositionCursor,
}) => {
  // Check if the expression has any components
  const hasContent = value.components.length > 0;
  const displayValue = hasContent ? value.toLatex() : '';

  // Helper to handle fraction focus with target
  const handleFractionFocus = (componentId: string, focusTarget?: 'numerator' | 'denominator') => {
    onFocusComponent(componentId + (focusTarget ? `:${focusTarget}` : ''));
  };

  // Helper to clear focus and position cursor
  const handleCursorPosition = (position: number) => {
    onFocusComponent(''); // Clear any focused components
    onPositionCursor?.(position);
  };

  // Parse focused component to get ID and target
  const parseFocusedComponent = () => {
    if (!focusedComponentId) return { id: undefined, target: undefined };

    const [id, target] = focusedComponentId.split(':');
    return {
      id,
      target: target as 'numerator' | 'denominator' | undefined
    };
  };

  const { id: focusedId, target: focusedTarget } = parseFocusedComponent();

  // Custom renderer that adds click areas between components
  const renderInteractiveMath = () => {
    if (!hasContent) return null;

    return (
      <View style={styles.interactiveMathContainer}>
        {/* Click area before first component */}
        <TouchableOpacity
          style={styles.cursorArea}
          onPress={() => handleCursorPosition(0)}
          activeOpacity={0.3}
        >
          <View style={styles.cursorIndicator} />
        </TouchableOpacity>

        {/* Render components with click areas between them */}
        {value.components.map((component, index) => (
          <React.Fragment key={component.id}>
            {/* The component itself */}
            <View style={styles.componentWrapper}>
              <EnhancedMathRenderer
                mathExpression={{
                  components: [component],
                  toString: () => component.type === 'text' ? component.content :
                            component.type === 'fraction' ? `${component.fraction.numerator}/${component.fraction.denominator}` :
                            component.type === 'number' ? component.value : '',
                  toLatex: () => component.type === 'text' ? component.content :
                            component.type === 'fraction' ? component.fraction.representation :
                            component.type === 'number' ? component.value : '',
                  toValue: () => component.type === 'text' ? component.content :
                            component.type === 'fraction' ? component.fraction.val :
                            component.type === 'number' ? component.value : ''
                }}
                fontSize={20}
                color="#ffffff"
                onFocusComponent={handleFractionFocus}
                focusedComponentId={focusedId}
                focusedTarget={focusedTarget}
              />
            </View>

            {/* Click area after this component */}
            <TouchableOpacity
              style={styles.cursorArea}
              onPress={() => handleCursorPosition(index + 1)}
              activeOpacity={0.3}
            >
              <View style={styles.cursorIndicator} />
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.inputContainer}>
      {/* Math Preview */}
      {showPreview && hasContent ? (
        <View style={styles.previewContainer}>
          {answerPrefix ? (
            <View style={styles.prefixContainer}>
              <SmartMathRenderer
                text={answerPrefix}
                fontSize={20}
                color="#94a3b8"
                style={styles.prefixText}
              />
              {renderInteractiveMath()}
            </View>
          ) : (
            renderInteractiveMath()
          )}
        </View>
      ) : (
        <>
          {/* Placeholder text when empty */}
          {!hasContent && (
            <TouchableOpacity
              style={styles.placeholderArea}
              onPress={() => handleCursorPosition(0)}
              activeOpacity={0.7}
            >
              <Text style={styles.placeholderText}>
                {answerPrefix ? `${answerPrefix}${placeholder}` : placeholder}
              </Text>
            </TouchableOpacity>
          )}

          {/* Fallback text display when preview disabled */}
          {hasContent && !showPreview && (
            <View style={answerPrefix ? styles.prefixContainer : undefined}>
              {answerPrefix && (
                <Text style={styles.prefixFallbackText}>{answerPrefix}</Text>
              )}
              <Text style={styles.inputText}>{value.toString()}</Text>
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
