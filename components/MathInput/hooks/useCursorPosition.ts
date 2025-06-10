import { useCallback, useState } from 'react';
import type { TextInsertionHandlers } from '../types';

export interface UseCursorPositionReturn extends TextInsertionHandlers {
  setCursorPosition: (position: number) => void;
}

export const useCursorPosition = (
  value: string,
  onChangeText: (text: string) => void
): UseCursorPositionReturn => {
  const [cursorPosition, setCursorPosition] = useState(0);

  const insertAtCursor = useCallback((text: string) => {
    const newValue = value.slice(0, cursorPosition) + text + value.slice(cursorPosition);
    onChangeText(newValue);
    setCursorPosition(cursorPosition + text.length);
  }, [value, cursorPosition, onChangeText]);

  const handleBackspace = useCallback(() => {
    if (cursorPosition > 0) {
      const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
      onChangeText(newValue);
      setCursorPosition(cursorPosition - 1);
    }
  }, [value, cursorPosition, onChangeText]);

  return {
    insertAtCursor,
    handleBackspace,
    cursorPosition,
    setCursorPosition,
  };
};
