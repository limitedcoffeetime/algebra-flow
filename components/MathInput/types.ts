import { MathComponent, MathExpression } from '../../utils/mathObjects';

export interface MathInputProps {
  value: MathExpression;
  onChangeExpression: (expression: MathExpression) => void;
  onSubmit: () => void;
  placeholder?: string;
  variables?: string[];
  isValidating?: boolean;
  showPreview?: boolean;
  answerPrefix?: string;
}

export interface InputDisplayProps {
  value: MathExpression;
  placeholder: string;
  showPreview: boolean;
  keyboardVisible: boolean;
  answerPrefix?: string;
  onToggleKeyboard: () => void;
  onFocusComponent: (componentId?: string) => void;
  focusedComponentId?: string;
  onPositionCursor?: (position: number) => void;
}

export interface CustomKeyboardProps {
  visible: boolean;
  keyboardHeight: any; // Animated.Value type
  variables: string[];
  onInsertComponent: (component: MathComponent) => void;
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
  insertComponentAtCursor: (component: MathComponent) => void;
  insertTextAtCursor: (text: string) => void;
  handleBackspace: () => void;
  cursorPosition: number; // Index of the component we're at
  focusedComponentId?: string; // ID of component with focus (for editing)
}
