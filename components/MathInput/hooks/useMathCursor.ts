import { useCallback, useState } from 'react';
import { MathComponent, MathExpression, MathExpressionImpl } from '../../../utils/mathObjects';
import type { TextInsertionHandlers } from '../types';

export interface UseMathCursorReturn extends TextInsertionHandlers {
  setCursorPosition: (position: number) => void;
  setFocusedComponent: (componentId?: string) => void;
}

export const useMathCursor = (
  value: MathExpression,
  onChangeExpression: (expression: MathExpression) => void
): UseMathCursorReturn => {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [focusedComponentId, setFocusedComponent] = useState<string>();

  // Helper to parse focused component ID
  const parseFocusedComponent = (componentId?: string) => {
    if (!componentId) return { id: undefined, target: undefined };

    const [id, target] = componentId.split(':');
    return {
      id,
      target: target as 'numerator' | 'denominator' | undefined
    };
  };

  const insertComponentAtCursor = useCallback((component: MathComponent) => {
    const newExpression = new MathExpressionImpl([...value.components]);
    newExpression.components.splice(cursorPosition, 0, component);
    onChangeExpression(newExpression);
    setCursorPosition(cursorPosition + 1);
  }, [value, cursorPosition, onChangeExpression]);

  const insertTextAtCursor = useCallback((text: string) => {
    const { id: focusedId, target: focusedTarget } = parseFocusedComponent(focusedComponentId);

    // Check if we're focused on a fraction component for editing
    if (focusedId) {
      const newExpression = new MathExpressionImpl([...value.components]);
      const componentIndex = newExpression.components.findIndex(c => c.id === focusedId);

      if (componentIndex !== -1) {
        const component = newExpression.components[componentIndex];
        if (component.type === 'fraction') {
          // Handle fraction editing based on focused target
          if (focusedTarget === 'numerator') {
            const currentNumerator = typeof component.fraction.numerator === 'string'
              ? component.fraction.numerator
              : component.fraction.numerator.toString();
            component.fraction.setNumerator(currentNumerator + text);
          } else if (focusedTarget === 'denominator') {
            const currentDenominator = typeof component.fraction.denominator === 'string'
              ? component.fraction.denominator
              : component.fraction.denominator.toString();
            component.fraction.setDenominator(currentDenominator + text);
          } else {
            // No specific target, default to numerator if empty, then denominator
            if (component.fraction.numeratorEmpty) {
              component.fraction.setNumerator(text);
              // Auto-focus numerator for continued typing
              setFocusedComponent(`${focusedId}:numerator`);
            } else if (component.fraction.denominatorEmpty) {
              component.fraction.setDenominator(text);
              // Auto-focus denominator for continued typing
              setFocusedComponent(`${focusedId}:denominator`);
            } else {
              // Both filled, insert text as new component after this fraction
              newExpression.addText(text);
              setCursorPosition(componentIndex + 2);
              setFocusedComponent(undefined);
            }
          }
          onChangeExpression(newExpression);
          return;
        }
      }
    }

    // Smart text insertion: append to previous text component if possible
    const newExpression = new MathExpressionImpl([...value.components]);

    // Check if the component just before cursor position is a text component
    const prevIndex = cursorPosition - 1;
    if (prevIndex >= 0 &&
        prevIndex < newExpression.components.length &&
        newExpression.components[prevIndex].type === 'text') {

      // Append to existing text component
      newExpression.components[prevIndex].content += text;
      onChangeExpression(newExpression);
      // Don't move cursor position since we're appending to existing component
    } else {
      // Create new text component
      newExpression.components.splice(cursorPosition, 0, {
        type: 'text',
        content: text,
        id: Math.random().toString(36).substr(2, 9)
      });
      onChangeExpression(newExpression);
      setCursorPosition(cursorPosition + 1);
    }
  }, [value, cursorPosition, focusedComponentId, onChangeExpression]);

  const handleBackspace = useCallback(() => {
    const { id: focusedId, target: focusedTarget } = parseFocusedComponent(focusedComponentId);

    if (focusedId) {
      // If we're focused on a fraction, handle backspace intelligently
      const component = value.components.find(c => c.id === focusedId);
      if (component && component.type === 'fraction') {
        const newExpression = new MathExpressionImpl([...value.components]);
        const targetComponent = newExpression.components.find(c => c.id === focusedId);

        if (targetComponent && targetComponent.type === 'fraction') {
          if (focusedTarget === 'numerator') {
            const currentNumerator = typeof targetComponent.fraction.numerator === 'string'
              ? targetComponent.fraction.numerator
              : targetComponent.fraction.numerator.toString();
            if (currentNumerator.length > 0) {
              targetComponent.fraction.setNumerator(currentNumerator.slice(0, -1));
            } else {
              // Switch focus to denominator if numerator is empty
              setFocusedComponent(`${focusedId}:denominator`);
            }
          } else if (focusedTarget === 'denominator') {
            const currentDenominator = typeof targetComponent.fraction.denominator === 'string'
              ? targetComponent.fraction.denominator
              : targetComponent.fraction.denominator.toString();
            if (currentDenominator.length > 0) {
              targetComponent.fraction.setDenominator(currentDenominator.slice(0, -1));
            } else {
              // Switch focus to numerator if denominator is empty
              setFocusedComponent(`${focusedId}:numerator`);
            }
          } else {
            // No specific target, remove entire fraction
            newExpression.removeComponentById(focusedId);
            setFocusedComponent(undefined);
            if (cursorPosition > 0) {
              setCursorPosition(cursorPosition - 1);
            }
          }
          onChangeExpression(newExpression);
        }
        return;
      }
    }

    // Smart backspace: remove character from text component if possible
    const newExpression = new MathExpressionImpl([...value.components]);
    const prevIndex = cursorPosition - 1;

    if (prevIndex >= 0 && prevIndex < newExpression.components.length) {
      const component = newExpression.components[prevIndex];

      if (component.type === 'text' && component.content.length > 1) {
        // Remove last character from text component
        component.content = component.content.slice(0, -1);
        onChangeExpression(newExpression);
      } else {
        // Remove entire component
        newExpression.components.splice(prevIndex, 1);
        onChangeExpression(newExpression);
        setCursorPosition(cursorPosition - 1);
      }
    }
  }, [value, cursorPosition, focusedComponentId, onChangeExpression]);

  return {
    insertComponentAtCursor,
    insertTextAtCursor,
    handleBackspace,
    cursorPosition,
    focusedComponentId,
    setCursorPosition,
    setFocusedComponent,
  };
};
