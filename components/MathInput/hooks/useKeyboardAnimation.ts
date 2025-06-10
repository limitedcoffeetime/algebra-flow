import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

interface UseKeyboardAnimationReturn {
  keyboardVisible: boolean;
  keyboardHeight: Animated.Value;
  toggleKeyboard: () => void;
}

export const useKeyboardAnimation = (): UseKeyboardAnimationReturn => {
  const [keyboardVisible, setKeyboardVisible] = useState(true);
  const keyboardHeight = useRef(new Animated.Value(1)).current;

  const toggleKeyboard = () => {
    const toValue = keyboardVisible ? 0 : 1;
    setKeyboardVisible(!keyboardVisible);

    Animated.timing(keyboardHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Initialize keyboard as expanded
  useEffect(() => {
    keyboardHeight.setValue(1);
  }, [keyboardHeight]);

  return {
    keyboardVisible,
    keyboardHeight,
    toggleKeyboard,
  };
};
