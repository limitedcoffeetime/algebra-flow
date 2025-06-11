/**
 * Mathematical Object System
 * Handles fractions and expressions with both visual representation and mathematical values
 */

export interface TextComponent {
  type: 'text';
  content: string;
  id: string;
}

export interface NumberComponent {
  type: 'number';
  value: string;
  id: string;
}

export interface FractionComponent {
  type: 'fraction';
  fraction: FractionObject;
  id: string;
}

// Forward declaration for FractionObject
export class FractionObject {
  public numerator: MathExpression | string;
  public denominator: MathExpression | string;
  public id: string;

  constructor(numerator: MathExpression | string = "", denominator: MathExpression | string = "") {
    this.numerator = numerator;
    this.denominator = denominator;
    this.id = Math.random().toString(36).substr(2, 9);
  }

  // Visual representation for rendering
  get representation(): string {
    return `\\frac{${this.numerator}}{${this.denominator}}`;
  }

  // Mathematical value for validation (no LaTeX)
  get val(): string {
    return `(${this.numerator})/(${this.denominator})`;
  }

  // Check if fraction is empty
  get isEmpty(): boolean {
    return !this.numerator && !this.denominator;
  }

  // Check if numerator is empty
  get numeratorEmpty(): boolean {
    return !this.numerator || this.numerator === "";
  }

  // Check if denominator is empty
  get denominatorEmpty(): boolean {
    return !this.denominator || this.denominator === "";
  }

  // Set numerator
  setNumerator(value: MathExpression | string): void {
    this.numerator = value;
  }

  // Set denominator
  setDenominator(value: MathExpression | string): void {
    this.denominator = value;
  }

  // Clear the fraction
  clear(): void {
    this.numerator = "";
    this.denominator = "";
  }

  // Convert to simple fraction string (for simple cases)
  toSimpleString(): string {
    if (typeof this.numerator === 'string' && typeof this.denominator === 'string') {
      return `${this.numerator}/${this.denominator}`;
    }
    return this.val;
  }

  // Clone the fraction
  clone(): FractionObject {
    return new FractionObject(this.numerator, this.denominator);
  }
}

export type MathComponent = FractionComponent | TextComponent | NumberComponent;

export interface MathExpression {
  components: MathComponent[];
  toString(): string;
  toLatex(): string;
  toValue(): string; // For validation
}

export class MathExpressionImpl implements MathExpression {
  public components: MathComponent[] = [];

  constructor(components: MathComponent[] = []) {
    this.components = components;
  }

  toString(): string {
    return this.components.map(component => {
      switch (component.type) {
        case 'fraction':
          return component.fraction.toSimpleString();
        case 'text':
          return component.content;
        case 'number':
          return component.value;
        default:
          return '';
      }
    }).join('');
  }

  toLatex(): string {
    return this.components.map(component => {
      switch (component.type) {
        case 'fraction':
          return component.fraction.representation;
        case 'text':
          return component.content;
        case 'number':
          return component.value;
        default:
          return '';
      }
    }).join('');
  }

  toValue(): string {
    return this.components.map(component => {
      switch (component.type) {
        case 'fraction':
          return component.fraction.val;
        case 'text':
          return component.content;
        case 'number':
          return component.value;
        default:
          return '';
      }
    }).join('');
  }

  // Add component
  addComponent(component: MathComponent): void {
    this.components.push(component);
  }

  // Add fraction
  addFraction(fraction: FractionObject): void {
    this.addComponent({
      type: 'fraction',
      fraction,
      id: fraction.id
    });
  }

  // Add text
  addText(text: string): void {
    this.addComponent({
      type: 'text',
      content: text,
      id: Math.random().toString(36).substr(2, 9)
    });
  }

  // Add number
  addNumber(value: string): void {
    this.addComponent({
      type: 'number',
      value,
      id: Math.random().toString(36).substr(2, 9)
    });
  }

  // Clear all components
  clear(): void {
    this.components = [];
  }

  // Get component by ID
  getComponentById(id: string): MathComponent | undefined {
    return this.components.find(comp => comp.id === id);
  }

  // Remove component by ID
  removeComponentById(id: string): void {
    this.components = this.components.filter(comp => comp.id !== id);
  }
}

// Helper functions for parsing and converting

/**
 * Parse LaTeX string into MathExpression with objects
 */
export function parseLatexToMathExpression(latex: string): MathExpressionImpl {
  const expression = new MathExpressionImpl();
  let currentIndex = 0;

  // Find all fractions
  const fractionRegex = /\\frac\{([^}]+)\}\{([^}]+)\}/g;
  let match;

  while ((match = fractionRegex.exec(latex)) !== null) {
    // Add text before fraction
    if (match.index > currentIndex) {
      const beforeText = latex.substring(currentIndex, match.index);
      if (beforeText.trim()) {
        expression.addText(beforeText.trim());
      }
    }

    // Add fraction
    const fraction = new FractionObject(match[1], match[2]);
    expression.addFraction(fraction);

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < latex.length) {
    const remainingText = latex.substring(currentIndex);
    if (remainingText.trim()) {
      expression.addText(remainingText.trim());
    }
  }

  // If no fractions found, treat as text
  if (expression.components.length === 0) {
    expression.addText(latex);
  }

  return expression;
}

/**
 * Convert simple fraction string to FractionObject
 */
export function parseFractionString(fractionStr: string): FractionObject | null {
  const fractionMatch = fractionStr.match(/^(.+)\/(.+)$/);
  if (fractionMatch) {
    return new FractionObject(fractionMatch[1].trim(), fractionMatch[2].trim());
  }
  return null;
}

/**
 * Create a new empty fraction
 */
export function createEmptyFraction(): FractionObject {
  return new FractionObject("", "");
}
