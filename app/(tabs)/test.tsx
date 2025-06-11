import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import EnhancedMathRenderer from '../../components/EnhancedMathRenderer';
import NativeMathRenderer from '../../components/NativeMathRenderer';
import SmartMathRenderer from '../../components/SmartMathRenderer';
import { FractionObject, MathExpressionImpl } from '../../utils/mathObjects';

export default function TestScreen() {
  // Create some example math objects
  const simpleFraction = new FractionObject("8", "9");
  const complexFraction = new FractionObject("x + 3", "2y - 1");
  const fractionWithExponents = new FractionObject("x^2 + 2x + 1", "x - 4");

  // Create a complex expression with multiple fractions
  const multiExpression = new MathExpressionImpl();
  multiExpression.addFraction(new FractionObject("1", "2"));
  multiExpression.addText(" + ");
  multiExpression.addFraction(new FractionObject("3", "4"));
  multiExpression.addText(" = ");
  multiExpression.addFraction(new FractionObject("5", "4"));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>🧮 Math Object System Test</Text>
      <Text style={styles.subtitle}>Testing Our New Fraction Object System</Text>

      {/* Object-based rendering */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🆕 Object-Based Rendering</Text>

                <View style={styles.testContainer}>
          <Text style={styles.label}>Simple Fraction Object: 8/9</Text>
          <Text style={styles.debugText}>FractionObject with .representation & .val properties</Text>
          <EnhancedMathRenderer
            mathExpression={(() => {
              const expr = new MathExpressionImpl();
              expr.addFraction(simpleFraction);
              return expr;
            })()}
            fontSize={32}
            color="#ffffff"
            style={styles.mathRenderer}
          />
          <Text style={styles.valueText}>Display: {simpleFraction.representation}</Text>
          <Text style={styles.valueText}>Math Value: {simpleFraction.val}</Text>
        </View>

        <View style={styles.testContainer}>
          <Text style={styles.label}>Complex Expression with Multiple Fractions</Text>
          <Text style={styles.debugText}>MathExpression object with multiple components</Text>
          <EnhancedMathRenderer
            mathExpression={multiExpression}
            fontSize={24}
            color="#ffffff"
            style={styles.mathRenderer}
          />
          <Text style={styles.valueText}>Display: {multiExpression.toLatex()}</Text>
          <Text style={styles.valueText}>Math Value: {multiExpression.toValue()}</Text>
        </View>
      </View>

      {/* String-based rendering for comparison */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📝 String-Based Rendering (Legacy)</Text>

        <View style={styles.testContainer}>
          <Text style={styles.label}>EnhancedMathRenderer with LaTeX string</Text>
          <Text style={styles.debugText}>Parses LaTeX automatically into objects</Text>
          <EnhancedMathRenderer
            text="\frac{8}{9}"
            fontSize={32}
            color="#ffffff"
            style={styles.mathRenderer}
          />
        </View>

        <View style={styles.testContainer}>
          <Text style={styles.label}>NativeMathRenderer (Original working solution)</Text>
          <Text style={styles.debugText}>Pure React Native components</Text>
          <NativeMathRenderer
            text="\frac{x^2 + 2x + 1}{x - 4}"
            fontSize={24}
            color="#ffffff"
            style={styles.mathRenderer}
          />
        </View>

        <View style={styles.testContainer}>
          <Text style={styles.label}>SmartMathRenderer (Now uses NativeMathRenderer)</Text>
          <Text style={styles.debugText}>Updated to be reliable</Text>
          <SmartMathRenderer
            text="\frac{1}{2} + \frac{3}{4}"
            fontSize={24}
            color="#ffffff"
            style={styles.mathRenderer}
          />
        </View>
      </View>

      {/* Benefits showcase */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>✨ Benefits of Object System</Text>

        <View style={styles.benefitContainer}>
          <Text style={styles.benefitTitle}>🎯 Dual Representation</Text>
          <Text style={styles.benefitText}>
            • Display: {simpleFraction.representation} (beautiful LaTeX)
          </Text>
          <Text style={styles.benefitText}>
            • Validation: {simpleFraction.val} (math-friendly)
          </Text>
        </View>

        <View style={styles.benefitContainer}>
          <Text style={styles.benefitTitle}>🔧 Object Methods</Text>
          <Text style={styles.benefitText}>
            • Empty checks: numeratorEmpty = {complexFraction.numeratorEmpty.toString()}
          </Text>
          <Text style={styles.benefitText}>
            • Setters: setNumerator(), setDenominator()
          </Text>
          <Text style={styles.benefitText}>
            • Cloning: fraction.clone()
          </Text>
        </View>

        <View style={styles.benefitContainer}>
          <Text style={styles.benefitTitle}>🎮 Ready for Desmos-like Input</Text>
          <Text style={styles.benefitText}>
            • Cursor management with object IDs
          </Text>
          <Text style={styles.benefitText}>
            • Smart backspace behavior
          </Text>
          <Text style={styles.benefitText}>
            • Visual focus indicators
          </Text>
        </View>
      </View>

      <View style={styles.testContainer}>
        <Text style={styles.label}>Control: Plain React Native Text</Text>
        <View style={styles.mathRenderer}>
          <Text style={{fontSize: 32, color: '#ffffff', textAlign: 'center'}}>
            8/9 (Plain Text)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  contentContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 15,
  },
  testContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#374151',
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 5,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  valueText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  mathRenderer: {
    backgroundColor: '#4b5563',
    padding: 15,
    borderRadius: 8,
    minHeight: 80,
  },
  benefitContainer: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 4,
  },
});
