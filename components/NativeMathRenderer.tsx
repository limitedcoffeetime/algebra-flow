import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface NativeMathRendererProps {
  text: string;
  style?: ViewStyle;
  fontSize?: number;
  color?: string;
}

interface FractionComponent {
  type: 'fraction';
  numerator: string;
  denominator: string;
}

interface TextComponent {
  type: 'text';
  content: string;
}

type MathComponent = FractionComponent | TextComponent;

const NativeMathRenderer: React.FC<NativeMathRendererProps> = ({
  text,
  style,
  fontSize = 24,
  color = '#333'
}) => {
  // Parse LaTeX into components
  const parseLatex = (input: string): MathComponent[] => {
    const components: MathComponent[] = [];
    let currentIndex = 0;

    // Find all fractions in the input
    const fractionRegex = /\\frac\{([^}]+)\}\{([^}]+)\}/g;
    let match;

    while ((match = fractionRegex.exec(input)) !== null) {
      // Add text before this fraction
      if (match.index > currentIndex) {
        const beforeText = input.substring(currentIndex, match.index);
        if (beforeText.trim()) {
          components.push({
            type: 'text',
            content: beforeText.trim()
          });
        }
      }

      // Add the fraction
      components.push({
        type: 'fraction',
        numerator: match[1],
        denominator: match[2]
      });

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < input.length) {
      const remainingText = input.substring(currentIndex);
      if (remainingText.trim()) {
        components.push({
          type: 'text',
          content: remainingText.trim()
        });
      }
    }

    // If no fractions found, treat entire input as text
    if (components.length === 0) {
      components.push({
        type: 'text',
        content: input
      });
    }

    return components;
  };

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
  const renderFraction = (fraction: FractionComponent, index: number) => {
    const fractionFontSize = fontSize * 0.8;

    return (
      <View key={`fraction-${index}`} style={styles.fractionContainer}>
        <View style={styles.numeratorContainer}>
          <Text style={[styles.fractionText, {
            fontSize: fractionFontSize,
            color,
            minHeight: fractionFontSize * 1.2
          }]}>
            {formatText(fraction.numerator)}
          </Text>
        </View>

        <View style={[styles.fractionLine, {
          backgroundColor: color,
          minWidth: Math.max(
            fraction.numerator.length * (fractionFontSize * 0.6),
            fraction.denominator.length * (fractionFontSize * 0.6),
            20
          )
        }]} />

        <View style={styles.denominatorContainer}>
          <Text style={[styles.fractionText, {
            fontSize: fractionFontSize,
            color,
            minHeight: fractionFontSize * 1.2
          }]}>
            {formatText(fraction.denominator)}
          </Text>
        </View>
      </View>
    );
  };

  // Render a text component
  const renderText = (textComp: TextComponent, index: number) => {
    return (
      <Text key={`text-${index}`} style={[styles.mathText, { fontSize, color }]}>
        {formatText(textComp.content)}
      </Text>
    );
  };

  const components = parseLatex(text);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.mathContainer}>
        {components.map((component, index) => {
          if (component.type === 'fraction') {
            return renderFraction(component, index);
          } else {
            return renderText(component, index);
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
  },
  fractionLine: {
    height: 2,
    marginVertical: 1,
  },
  denominatorContainer: {
    alignItems: 'center',
    paddingTop: 2,
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

export default NativeMathRenderer;
