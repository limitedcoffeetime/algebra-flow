'use dom';

import { useEffect, useRef } from 'react';

interface TrainingMathInputProps {
  value?: string;
  placeholder?: string;
  onInput?: (latex: string) => void;
  onSubmit?: () => void;
  readonly?: boolean;
}

export default function TrainingMathInput({
  value = '',
  placeholder = 'Enter your mathematical answer...',
  onInput,
  onSubmit,
  readonly = false,
}: TrainingMathInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mathFieldRef = useRef<any>(null);

  useEffect(() => {
    const initializeMathLive = async () => {
      try {
        // Import MathLive
        await import('mathlive');

        // Wait for custom elements to be defined
        await customElements.whenDefined('math-field');

        if (containerRef.current && !mathFieldRef.current) {
          containerRef.current.innerHTML = `
            <div style="
              height: 100%;
              padding: 20px;
              border-radius: 12px;
              background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
              border: 2px solid #374151;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            ">
              <math-field
                id="training-math-field"
                style="
                  width: 100%;
                  min-height: 120px;
                  padding: 20px;
                  font-size: 24px;
                  border: 2px solid #4b5563;
                  border-radius: 8px;
                  background: #374151;
                  color: white;
                  box-sizing: border-box;
                  display: block;
                  transition: all 0.2s ease;
                  margin-bottom: 16px;
                "
              >
                ${value}
              </math-field>
              <div style="
                margin-top: 12px;
                padding: 8px 12px;
                background: rgba(59, 130, 246, 0.1);
                border-radius: 6px;
                border: 1px solid rgba(59, 130, 246, 0.2);
              ">
                <div style="
                  font-size: 14px;
                  color: #9ca3af;
                  margin-bottom: 4px;
                // ">💡 Tips:</div>
                // <div style="
                //   font-size: 13px;
                //   color: #d1d5db;
                //   line-height: 1.4;
                // ">
                  • Use \\frac{a}{b} for fractions
                  • Use x^2 for exponents
                  • Use \\sqrt{x} for square roots
                  • Press Enter to submit
                </div>
              </div>
            </div>
          `;

          // Get the math field element
          const mathField = containerRef.current.querySelector('#training-math-field') as any;
          if (mathField) {
            mathFieldRef.current = mathField;

            // Set initial properties
            mathField.value = value;
            mathField.readOnly = readonly;

            // Configure MathLive options
            mathField.setOptions({
              virtualKeyboardMode: 'auto',
              smartFence: true,
              smartSuperscript: true,
              removeExtraneousParentheses: true,
            });

            // Add event listeners
            const handleInput = (event: any) => {
              const latex = event.target.value;
              onInput?.(latex);
            };

            const handleKeyDown = (event: KeyboardEvent) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSubmit?.();
              }
            };

            const handleFocus = () => {
              mathField.style.borderColor = '#3b82f6';
              mathField.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            };

            const handleBlur = () => {
              mathField.style.borderColor = '#4b5563';
              mathField.style.boxShadow = 'none';
            };

            mathField.addEventListener('input', handleInput);
            mathField.addEventListener('keydown', handleKeyDown);
            mathField.addEventListener('focus', handleFocus);
            mathField.addEventListener('blur', handleBlur);

            // Focus the field for better UX
            setTimeout(() => {
              if (!readonly) {
                mathField.focus();
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('Failed to load MathLive:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="
              padding: 20px;
              background: #7f1d1d;
              border: 2px solid #ef4444;
              border-radius: 12px;
              text-align: center;
              color: white;
            ">
              <div style="font-size: 18px; margin-bottom: 8px;">⚠️ Math Editor Error</div>
              <div style="font-size: 14px; opacity: 0.8;">Failed to load math input component</div>
            </div>
          `;
        }
      }
    };

    initializeMathLive();
  }, [onInput, onSubmit]);

  // Update value when prop changes
  useEffect(() => {
    if (mathFieldRef.current && mathFieldRef.current.value !== value) {
      mathFieldRef.current.value = value;
    }
  }, [value]);

  // Update readonly state
  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.readOnly = readonly;
      if (readonly) {
        mathFieldRef.current.style.opacity = '0.6';
        mathFieldRef.current.style.cursor = 'not-allowed';
      } else {
        mathFieldRef.current.style.opacity = '1';
        mathFieldRef.current.style.cursor = 'text';
      }
    }
  }, [readonly]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: '200px',
        backgroundColor: 'transparent',
      }}
    >
      <div style={{
        padding: '20px',
        color: '#9ca3af',
        textAlign: 'center',
        fontSize: '16px'
      }}>
        Loading math editor...
      </div>
    </div>
  );
}
