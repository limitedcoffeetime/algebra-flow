/**
 * Simple text utilities - no responsive sizing
 */

export interface ResponsiveTextSettings {
  equationFontSize: number;
  directionFontSize: number;
}

/**
 * Get basic font sizes - no adaptive scaling
 * @param platform - Platform type for different base sizes
 * @returns Basic font settings
 */
export function calculateResponsiveFontSize(
  equation: string,
  direction: string,
  containerWidth: number = 350,
  platform: 'web' | 'native' = 'web'
): ResponsiveTextSettings {
  // Simple fixed font sizes
  const equationFontSize = platform === 'web' ? 24 : 28;
  const directionFontSize = 16;

  return {
    equationFontSize,
    directionFontSize
  };
}