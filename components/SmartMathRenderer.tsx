import React from 'react';
import { ViewStyle } from 'react-native';
import NativeMathRenderer from './NativeMathRenderer';

interface SmartMathRendererProps {
  text: string;
  style?: ViewStyle;
  fontSize?: number;
  color?: string;
}

const SmartMathRenderer: React.FC<SmartMathRendererProps> = ({
  text,
  style,
  fontSize = 24,
  color = '#333'
}) => {
  // Simply use NativeMathRenderer which we've proven works reliably
  return (
    <NativeMathRenderer
      text={text}
      style={style}
      fontSize={fontSize}
      color={color}
    />
  );
};

export default SmartMathRenderer;
