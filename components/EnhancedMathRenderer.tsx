import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { FractionObject, MathExpression, parseLatexToMathExpression } from '../utils/mathObjects';

interface EnhancedMathRendererProps {
  text?: string;
  mathExpression?: MathExpression;
  style?: ViewStyle;
  fontSize?: number;
  color?: string;
  // Interactive props
  onFocusComponent?: (componentId: string, focusTarget?: 'numerator' | 'denominator') => void;
  focusedComponentId?: string;
  focusedTarget?: 'numerator' | 'denominator';
}

const EnhancedMathRenderer: React.FC<EnhancedMathRendererProps> = ({
  text,
  mathExpression,
  style,
  fontSize = 24,
  color = '#333',
  onFocusComponent,
  focusedComponentId,
  focusedTarget
}) => {
  // Determine what to render
  const expression = mathExpression || (text ? parseLatexToMathExpression(text) : null);

  if (!expression) {
    return (
      <View style={[styles.container, style]}>
        <Text style={[styles.mathText, { fontSize, color }]}>
          {text || ''}
        </Text>
      </View>
    );
  }

  // Format text (handle exponents, etc.)
  const formatText = (text: string): string => {
    let formatted = text;

    // Handle exponents
    formatted = formatted.replace(/\^2(?!\d)/g, '²');
    formatted = formatted.replace(/\^3(?!\d)/g, '³');
    formatted = formatted.replace(/\^([4-9])/g, (match, p1) => {
      const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
      return superscripts[parseInt(p1)] || `^${p1}`;
    });

    // Handle simple exponents with curly braces
    formatted = formatted.replace(/\^{([0-9]+)}/g, (match, p1) => {
      const digits = p1.split('');
      const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
      return digits.map(d => superscripts[parseInt(d)] || d).join('');
    });

    // Clean up any remaining LaTeX
    formatted = formatted.replace(/\\/g, '');

    return formatted;
  };

  // Render a single fraction component
  const renderFraction = (fraction: FractionObject, index: number) => {
    const fractionFontSize = fontSize * 0.8;
    const isFocused = focusedComponentId === fraction.id;

    // Get display values
    const numeratorText = typeof fraction.numerator === 'string'
      ? fraction.numerator
      : fraction.numerator.toString();
    const denominatorText = typeof fraction.denominator === 'string'
      ? fraction.denominator
      : fraction.denominator.toString();

    // Show placeholder for empty parts
    const displayNumerator = numeratorText || '□';
    const displayDenominator = denominatorText || '□';

    return (
      <View key={`fraction-${index}`} style={styles.fractionContainer}>
        {/* Clickable Numerator */}
        <TouchableOpacity
          style={[
            styles.numeratorContainer,
            isFocused && focusedTarget === 'numerator' && styles.focusedContainer
          ]}
          onPress={() => onFocusComponent?.(fraction.id, 'numerator')}
          activeOpacity={0.7}
        >
          <Text style={[styles.fractionText, {
            fontSize: fractionFontSize,
            color: numeratorText ? color : (color + '60'), // Dimmed if placeholder
            minHeight: fractionFontSize * 1.2
          }]}>
            {formatText(displayNumerator)}
          </Text>
        </TouchableOpacity>

        <View style={[styles.fractionLine, {
          backgroundColor: color,
          minWidth: Math.max(
            displayNumerator.length * (fractionFontSize * 0.6),
            displayDenominator.length * (fractionFontSize * 0.6),
            30
          )
        }]} />

        {/* Clickable Denominator */}
        <TouchableOpacity
          style={[
            styles.denominatorContainer,
            isFocused && focusedTarget === 'denominator' && styles.focusedContainer
          ]}
          onPress={() => onFocusComponent?.(fraction.id, 'denominator')}
          activeOpacity={0.7}
        >
          <Text style={[styles.fractionText, {
            fontSize: fractionFontSize,
            color: denominatorText ? color : (color + '60'), // Dimmed if placeholder
            minHeight: fractionFontSize * 1.2
          }]}>
            {formatText(displayDenominator)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render a text component
  const renderText = (content: string, index: number) => {
    return (
      <Text key={`text-${index}`} style={[styles.mathText, { fontSize, color }]}>
        {formatText(content)}
      </Text>
    );
  };

  // Render a number component
  const renderNumber = (value: string, index: number) => {
    return (
      <Text key={`number-${index}`} style={[styles.mathText, { fontSize, color }]}>
        {formatText(value)}
      </Text>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.mathContainer}>
        {expression.components.map((component, index) => {
          switch (component.type) {
            case 'fraction':
              return renderFraction(component.fraction, index);
            case 'text':
              return renderText(component.content, index);
            case 'number':
              return renderNumber(component.value, index);
            default:
              return null;
          }
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    width: '100%',
  },
  mathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: 10,
  },
  fractionContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 4,
  },
  numeratorContainer: {
    alignItems: 'center',
    paddingBottom: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    minWidth: 24,
    minHeight: 20,
  },
  denominatorContainer: {
    alignItems: 'center',
    paddingTop: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    minWidth: 24,
    minHeight: 20,
  },
  focusedContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Light blue highlight
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  fractionLine: {
    height: 2,
    marginVertical: 1,
  },
  fractionText: {
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'System',
  },
  mathText: {
    fontWeight: '500',
    fontFamily: 'System',
    marginHorizontal: 4,
  },
});

export default EnhancedMathRenderer;
