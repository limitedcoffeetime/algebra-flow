/**
 * Responsive text utilities with dynamic font sizing
 */

export interface ResponsiveTextSettings {
  equationFontSize: number;
  directionFontSize: number;
}

/**
 * Calculate responsive font sizes based on content and container
 * @param equation - Equation text to analyze
 * @param _direction - Direction text (unused but kept for API compatibility)
 * @param containerWidth - Available container width
 * @param platform - Platform type for different base sizes
 * @returns Responsive font settings
 */
export function calculateResponsiveFontSize(
  equation: string,
  _direction: string,
  containerWidth: number = 350,
  platform: 'web' | 'native' = 'web'
): ResponsiveTextSettings {
  // Base font sizes
  const baseEquationFontSize = platform === 'web' ? 24 : 28;
  const directionFontSize = 16;

  // Rough estimation of content width - LaTeX content tends to be wider
  const roughCharWidth = baseEquationFontSize * 0.6; // Approximate character width
  const estimatedWidth = equation.length * roughCharWidth;
  
  // If estimated width exceeds container, scale down the font (be less aggressive)
  let equationFontSize = baseEquationFontSize;
  if (estimatedWidth > containerWidth * 0.95) { // Leave only 5% margin
    const scaleFactor = (containerWidth * 0.95) / estimatedWidth;
    equationFontSize = Math.max(baseEquationFontSize * scaleFactor, 16); // Higher minimum 16px
  }

  return {
    equationFontSize: Math.round(equationFontSize),
    directionFontSize
  };
}

/**
 * Set up responsive font sizing for a math field element
 * @param mathField - The math field element to make responsive
 * @param baseFontSize - Starting font size
 */
export function setupResponsiveMathField(mathField: HTMLElement, baseFontSize: number = 24) {
  if (!mathField || !window.ResizeObserver) return;

  let resizeObserver: ResizeObserver | null = null;
  
  const adjustFontSize = () => {
    const container = mathField.closest('div') as HTMLElement;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const contentWidth = mathField.scrollWidth;
    
    // If content is wider than container, reduce font size
    if (contentWidth > containerWidth * 0.98) { // Only 2% tolerance - be less aggressive
      const scaleFactor = (containerWidth * 0.95) / contentWidth; // Use more space
      const newFontSize = Math.max(baseFontSize * scaleFactor, 14); // Higher minimum
      mathField.style.fontSize = `${Math.round(newFontSize)}px`;
    } else if (contentWidth < containerWidth * 0.85) {
      // If content is smaller, we can increase font size up to base
      const scaleFactor = Math.min((containerWidth * 0.92) / contentWidth, 1);
      const newFontSize = Math.min(baseFontSize * scaleFactor, baseFontSize);
      mathField.style.fontSize = `${Math.round(newFontSize)}px`;
    }
  };

  // Initial adjustment
  setTimeout(adjustFontSize, 100);

  // Set up mutation observer to watch for content changes
  const mutationObserver = new MutationObserver(() => {
    setTimeout(adjustFontSize, 50);
  });

  mutationObserver.observe(mathField, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Set up resize observer for container size changes
  resizeObserver = new ResizeObserver(() => {
    setTimeout(adjustFontSize, 50);
  });

  const container = mathField.closest('div');
  if (container) {
    resizeObserver.observe(container);
  }

  // Return cleanup function
  return () => {
    mutationObserver.disconnect();
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  };
}