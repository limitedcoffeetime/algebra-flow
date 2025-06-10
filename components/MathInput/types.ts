export interface MathInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  variables?: string[];
  isValidating?: boolean;
  showPreview?: boolean;
}

export interface InputDisplayProps {
  value: string;
  placeholder: string;
  showPreview: boolean;
  keyboardVisible: boolean;
  onToggleKeyboard: () => void;
}

export interface CustomKeyboardProps {
  visible: boolean;
  keyboardHeight: any; // Animated.Value type
  variables: string[];
  onInsertText: (text: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  isValidating: boolean;
}

export interface KeyPressHandler {
  (text: string): void;
}

export interface KeyboardKeyProps {
  onPress: () => void;
  disabled?: boolean;
}

export interface NumberKeyProps extends KeyboardKeyProps {
  number: string;
}

export interface OperatorKeyProps extends KeyboardKeyProps {
  operator: string;
}

export interface SpecialKeyProps extends KeyboardKeyProps {
  children: React.ReactNode;
}

export interface SubmitKeyProps extends KeyboardKeyProps {
  isValidating: boolean;
  text: string;
}

export interface VariableKeyProps extends KeyboardKeyProps {
  variable: string;
}

export interface CursorPosition {
  position: number;
  setValue: (pos: number) => void;
}

export interface TextInsertionHandlers {
  insertAtCursor: (text: string) => void;
  handleBackspace: () => void;
  cursorPosition: number;
}
