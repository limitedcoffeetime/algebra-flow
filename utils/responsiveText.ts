/**
 * Utility functions for responsive text sizing and line breaking in mathematical content
 */

export interface ResponsiveTextSettings {
  equationFontSize: number;
  directionFontSize: number;
  shouldWrap: boolean;
}

/**
 * Calculate responsive font size based on equation length and direction length
 * @param equation - The mathematical equation string
 * @param direction - The problem direction/instruction text
 * @param containerWidth - Available container width in pixels
 * @param platform - Platform type for different base sizes
 * @returns ResponsiveTextSettings object
 */
export function calculateResponsiveFontSize(
  equation: string,
  direction: string,
  containerWidth: number = 350,
  platform: 'web' | 'native' = 'web'
): ResponsiveTextSettings {
  // Base font sizes (different for web vs native)
  const baseEquationSize = platform === 'web' ? 27 : 31;
  const baseDirectionSize = 18;

  // Calculate estimated width for equation (rough approximation)
  // LaTeX equations with fractions, exponents, etc. can be quite wide
  const equationComplexity = (equation.match(/\\frac|\\sqrt|\\pm|\^|\{|\}/g) || []).length;
  const estimatedEquationWidth = equation.length * (platform === 'web' ? 12 : 14) + equationComplexity * (platform === 'web' ? 20 : 25);

  // Calculate estimated width for direction
  const estimatedDirectionWidth = direction.length * 8;

  // Determine if we need to scale down the equation
  let equationFontSize = baseEquationSize;
  let shouldWrap = false;

  const widthThreshold = platform === 'web' ? 0.85 : 0.8;

  if (estimatedEquationWidth > containerWidth * widthThreshold) {
    // Scale down equation font if it's too wide
    const scaleFactor = (containerWidth * widthThreshold) / estimatedEquationWidth;
    const minSize = platform === 'web' ? 19 : 21;
    equationFontSize = Math.max(minSize, Math.floor(baseEquationSize * scaleFactor));

    // If equation is still too large even after scaling, enable wrapping
    const wrapThreshold = platform === 'web' ? 21 : 23;
    if (equationFontSize <= wrapThreshold) {
      shouldWrap = true;
    }
  }

  // Direction font size scaling (less aggressive)
  let directionFontSize = baseDirectionSize;
  if (estimatedDirectionWidth > containerWidth * 0.9) {
    const scaleFactor = (containerWidth * 0.9) / estimatedDirectionWidth;
    directionFontSize = Math.max(16, Math.floor(baseDirectionSize * scaleFactor));
  }

  return {
    equationFontSize,
    directionFontSize,
    shouldWrap
  };
}

/**
 * Add intelligent line breaks to equations for better wrapping
 * @param equation - The mathematical equation string
 * @returns Equation with intelligent line break opportunities
 */
export function addIntelligentLineBreaks(equation: string): string {
  if (equation.length < 40) return equation; // Short equations don't need breaks

  let result = equation;

  // Only add breaks if the equation is really long
  if (equation.length > 60) {
    // Add potential line break opportunities around key operators
    // Using HTML word break opportunities for web platform
    result = result.replace(/(\s*=\s*)/g, '<span style="white-space: normal;">$1</span>');
    result = result.replace(/(\s*\+\s*(?![^{]*}))/g, '$1<wbr>'); // Word break opportunity after plus
    result = result.replace(/(\s*-\s*(?![^{]*}))/g, '$1<wbr>'); // Word break opportunity after minus
  }

  return result;
}

/**
 * Estimate text width for responsive calculations
 * @param text - Text to measure
 * @param fontSize - Font size in pixels
 * @param isMonospace - Whether the font is monospace
 * @returns Estimated width in pixels
 */
export function estimateTextWidth(text: string, fontSize: number, isMonospace: boolean = true): number {
  // Rough approximation - actual measurement would require DOM
  const charWidth = isMonospace ? fontSize * 0.6 : fontSize * 0.5;
  return text.length * charWidth;
}

/**
 * Check if text needs responsive treatment
 * @param text - Text to check
 * @param maxWidth - Maximum available width
 * @param fontSize - Current font size
 * @returns Whether responsive treatment is needed
 */
export function needsResponsiveTreatment(text: string, maxWidth: number, fontSize: number): boolean {
  const estimatedWidth = estimateTextWidth(text, fontSize);
  return estimatedWidth > maxWidth * 0.9;
}
