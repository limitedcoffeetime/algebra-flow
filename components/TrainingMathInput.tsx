'use dom';

import { useEffect, useRef } from 'react';

interface Problem {
  id: string;
  equation: string;
  direction: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answer: string | number | number[];
  answerLHS?: string;
  answerRHS?: string | number | number[];
}

interface UserProgress {
  problemsCorrect: number;
  problemsAttempted: number;
}

interface VerificationResult {
  isCorrect: boolean;
  userAnswerSimplified: string;
  correctAnswerSimplified: string;
  errorMessage?: string;
}

interface TrainingMathInputProps {
  value?: string;
  placeholder?: string;
  onInput?: (latex: string) => void;
  onSubmit?: () => void;
  onVerifyAnswer?: (result: VerificationResult) => void;
  readonly?: boolean;
  problem?: Problem;
  userProgress?: UserProgress;
}

export default function TrainingMathInput({
  value = '',
  placeholder = 'Enter your mathematical answer...',
  onInput,
  onSubmit,
  onVerifyAnswer,
  readonly = false,
  problem,
  userProgress,
}: TrainingMathInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mathFieldRef = useRef<any>(null);

  // Function to verify answer using MathLive's simplify
  const verifyAnswer = (userAnswer: string): VerificationResult => {
    if (!problem) {
      return {
        isCorrect: false,
        userAnswerSimplified: userAnswer,
        correctAnswerSimplified: '',
        errorMessage: 'No problem available for verification'
      };
    }

    // Debug logging
    console.log('=== Answer Verification Debug ===');
    console.log('User answer:', userAnswer);
    console.log('Problem data:', {
      answer: problem.answer,
      answerLHS: problem.answerLHS,
      answerRHS: problem.answerRHS
    });

    // Check compute engine availability
    const ce = (window as any)?.MathfieldElement?.computeEngine;
    console.log('Compute engine available:', !!ce);
    if (ce) {
      console.log('Compute engine type:', typeof ce);
    }

    try {
      // Use the already declared compute engine variable
      if (!ce) {
        console.warn('MathLive compute engine not available, falling back to string comparison');
        // Fallback to simple string comparison
        const userTrimmed = userAnswer.trim().toLowerCase();

        // Determine correct answer for comparison
        let correctAnswer: string;
        let isCorrect = false;

        if (problem.answerRHS !== undefined && problem.answerRHS !== null) {
          correctAnswer = String(problem.answerRHS);
          isCorrect = userTrimmed === correctAnswer.toLowerCase();
        } else if (problem.answerLHS && problem.answer) {
          const fullAnswer = `${problem.answerLHS}${problem.answer}`;
          const answerOnly = String(problem.answer);

          isCorrect = userTrimmed === fullAnswer.toLowerCase() || userTrimmed === answerOnly.toLowerCase();
          correctAnswer = userTrimmed === fullAnswer.toLowerCase() ? fullAnswer : answerOnly;
        } else {
          correctAnswer = String(problem.answer);
          isCorrect = userTrimmed === correctAnswer.toLowerCase();
        }

        return {
          isCorrect,
          userAnswerSimplified: userAnswer.trim(),
          correctAnswerSimplified: correctAnswer,
          errorMessage: isCorrect ? undefined : 'Using fallback comparison method'
        };
      }

      // Determine the correct answer to compare against
      let correctAnswerStr: string;

      // If answerRHS exists, use it (user typically enters just the RHS part)
      if (problem.answerRHS !== undefined && problem.answerRHS !== null) {
        if (Array.isArray(problem.answerRHS)) {
          // For arrays (like multiple solutions), check if user answer matches any
          const userSimplified = ce.parse(userAnswer).simplify().latex;

          for (const ans of problem.answerRHS) {
            try {
              const correctSimplified = ce.parse(String(ans)).simplify().latex;
              if (userSimplified === correctSimplified) {
                return {
                  isCorrect: true,
                  userAnswerSimplified: userSimplified,
                  correctAnswerSimplified: correctSimplified
                };
              }
            } catch (error) {
              console.warn(`Error processing answerRHS option ${ans}:`, error);
            }
          }

          // If no match found, return false with first answer as reference
          correctAnswerStr = String(problem.answerRHS[0]);
        } else {
          correctAnswerStr = String(problem.answerRHS);
        }
      }
      // If answerRHS doesn't exist, check if user entered the full answer (answerLHS + answer)
      else if (problem.answerLHS && problem.answer) {
        const fullAnswer = `${problem.answerLHS}${problem.answer}`;
        const userSimplified = ce.parse(userAnswer).simplify().latex;
        const correctSimplified = ce.parse(fullAnswer).simplify().latex;

        if (userSimplified === correctSimplified) {
          return {
            isCorrect: true,
            userAnswerSimplified: userSimplified,
            correctAnswerSimplified: correctSimplified
          };
        }

        // Also check if they just entered the answer part (without LHS)
        if (Array.isArray(problem.answer)) {
          for (const ans of problem.answer) {
            try {
              const correctSimplified = ce.parse(String(ans)).simplify().latex;
              if (userSimplified === correctSimplified) {
                return {
                  isCorrect: true,
                  userAnswerSimplified: userSimplified,
                  correctAnswerSimplified: correctSimplified
                };
              }
            } catch (error) {
              console.warn(`Error processing answer option ${ans}:`, error);
            }
          }
          correctAnswerStr = String(problem.answer[0]);
        } else {
          const answerOnlySimplified = ce.parse(String(problem.answer)).simplify().latex;
          if (userSimplified === answerOnlySimplified) {
            return {
              isCorrect: true,
              userAnswerSimplified: userSimplified,
              correctAnswerSimplified: answerOnlySimplified
            };
          }
          correctAnswerStr = String(problem.answer);
        }
      }
      // Fallback to original answer field
      else if (Array.isArray(problem.answer)) {
        // For arrays (like multiple solutions), check if user answer matches any
        const userSimplified = ce.parse(userAnswer).simplify().latex;

        for (const ans of problem.answer) {
          try {
            const correctSimplified = ce.parse(String(ans)).simplify().latex;
            if (userSimplified === correctSimplified) {
              return {
                isCorrect: true,
                userAnswerSimplified: userSimplified,
                correctAnswerSimplified: correctSimplified
              };
            }
          } catch (error) {
            console.warn(`Error processing answer option ${ans}:`, error);
          }
        }

        // If no match found, return false with first answer as reference
        correctAnswerStr = String(problem.answer[0]);
      } else {
        correctAnswerStr = String(problem.answer);
      }

      // Simplify both answers using MathLive's compute engine
      const userSimplified = ce.parse(userAnswer).simplify().latex;
      const correctSimplified = ce.parse(correctAnswerStr).simplify().latex;

      const isCorrect = userSimplified === correctSimplified;

      return {
        isCorrect,
        userAnswerSimplified: userSimplified,
        correctAnswerSimplified: correctSimplified
      };

    } catch (error) {
      console.error('Error during answer verification:', error);

      // Fallback to string comparison if MathLive fails
      const userTrimmed = userAnswer.trim().toLowerCase();

      // Determine correct answer for fallback comparison
      let correctStr: string;
      if (problem.answerRHS !== undefined && problem.answerRHS !== null) {
        correctStr = Array.isArray(problem.answerRHS)
          ? String(problem.answerRHS[0]).toLowerCase()
          : String(problem.answerRHS).toLowerCase();
      } else if (problem.answerLHS && problem.answer) {
        // Try both full answer and just the answer part
        const fullAnswer = `${problem.answerLHS}${problem.answer}`.toLowerCase();
        const answerOnly = Array.isArray(problem.answer)
          ? String(problem.answer[0]).toLowerCase()
          : String(problem.answer).toLowerCase();

        const isCorrect = userTrimmed === fullAnswer || userTrimmed === answerOnly;
        correctStr = userTrimmed === fullAnswer ? fullAnswer : answerOnly;

        return {
          isCorrect,
          userAnswerSimplified: userAnswer.trim(),
          correctAnswerSimplified: isCorrect ? correctStr : fullAnswer,
          errorMessage: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      } else {
        correctStr = Array.isArray(problem.answer)
          ? String(problem.answer[0]).toLowerCase()
          : String(problem.answer).toLowerCase();
      }

      const isCorrect = userTrimmed === correctStr;

      return {
        isCorrect,
        userAnswerSimplified: userAnswer.trim(),
        correctAnswerSimplified: String(problem.answer),
        errorMessage: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  useEffect(() => {
    const initializeMathLive = async () => {
      try {
                // Import MathLive - the errors you see are just Metro bundler noise, not actual failures
        await import('mathlive');

        // Import the Compute Engine for mathematical operations
        await import('@cortex-js/compute-engine');

        // Wait for custom elements to be defined first
        await customElements.whenDefined('math-field');

        // Configure global MathLive settings after elements are defined
        // Disable custom fonts - use system fonts (simpler, always works)
        if (typeof window !== 'undefined' && (window as any).MathfieldElement) {
          (window as any).MathfieldElement.fontsDirectory = null;
        }

        // Give the compute engine a moment to initialize
        await new Promise(resolve => setTimeout(resolve, 100));

        if (containerRef.current && !mathFieldRef.current) {
          // Generate problem section HTML
          const problemSectionHTML = problem ? `
            <div style="
              margin-bottom: 20px;
              padding: 16px;
              background: rgba(34, 197, 94, 0.1);
              border-radius: 8px;
              border: 1px solid rgba(34, 197, 94, 0.2);
            ">
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
              ">
                <div style="
                  font-size: 16px;
                  color: #22c55e;
                  font-weight: bold;
                ">📚 Problem:</div>
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div style="
                    background: #10b981;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                  ">${problem.difficulty}</div>
                  ${userProgress ? `
                    <div style="
                      color: #9ca3af;
                      font-size: 12px;
                    ">${userProgress.problemsCorrect}/${userProgress.problemsAttempted}</div>
                  ` : ''}
                </div>
              </div>
              <div style="
                font-size: 14px;
                color: #d1d5db;
                margin-bottom: 8px;
              ">${problem.direction}</div>
              <div style="
                background: #374151;
                border-radius: 6px;
                padding: 12px;
                border: 1px solid #4b5563;
              ">
                <math-field
                  readonly
                  style="
                    width: 100%;
                    background: transparent;
                    border: none;
                    color: #ffffff;
                    font-size: 20px;
                    min-height: auto;
                    padding: 0;
                  "
                >${problem.equation}</math-field>
              </div>
            </div>
          ` : '';

          containerRef.current.innerHTML = `
            <div style="
              height: 100%;
              padding: 20px;
              border-radius: 12px;
              background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
              border: 2px solid #374151;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            ">
              ${problemSectionHTML}

              <div style="
                font-size: 16px;
                color: #3b82f6;
                font-weight: bold;
                margin-bottom: 8px;
              ">✏️ Your Answer:</div>

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

              ${onVerifyAnswer ? `
                <div style="
                  display: flex;
                  gap: 12px;
                  margin-bottom: 16px;
                ">
                  <button
                    id="verify-answer-btn"
                    style="
                      flex: 1;
                      background: #059669;
                      color: white;
                      border: none;
                      border-radius: 8px;
                      padding: 12px 20px;
                      font-size: 16px;
                      font-weight: bold;
                      cursor: pointer;
                      transition: all 0.2s ease;
                    "
                  >
                    ✓ Verify Answer
                  </button>
                  <button
                    id="submit-answer-btn"
                    style="
                      flex: 1;
                      background: #3b82f6;
                      color: white;
                      border: none;
                      border-radius: 8px;
                      padding: 12px 20px;
                      font-size: 16px;
                      font-weight: bold;
                      cursor: pointer;
                      transition: all 0.2s ease;
                    "
                  >
                    📤 Submit & Next
                  </button>
                </div>
              ` : ''}
            </div>
          `;

          // Get the math field element
          const mathField = containerRef.current.querySelector('#training-math-field') as any;
          if (mathField) {
            mathFieldRef.current = mathField;

            // Set initial properties
            mathField.value = value;
            mathField.readOnly = readonly;

            // Configure MathLive options using new syntax (no more setOptions deprecation warnings)
            mathField.mathVirtualKeyboardPolicy = 'auto';
            mathField.smartFence = true;
            mathField.smartSuperscript = true;
            mathField.removeExtraneousParentheses = true;

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

            // Add verify answer button functionality
            const verifyBtn = containerRef.current.querySelector('#verify-answer-btn');
            const submitBtn = containerRef.current.querySelector('#submit-answer-btn');

            if (verifyBtn && onVerifyAnswer) {
              const handleVerify = () => {
                const currentValue = mathField.value;
                if (currentValue.trim()) {
                  const result = verifyAnswer(currentValue);
                  onVerifyAnswer(result);

                  // Visual feedback
                  if (result.isCorrect) {
                    mathField.style.borderColor = '#10b981';
                    mathField.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  } else {
                    mathField.style.borderColor = '#ef4444';
                    mathField.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                  }
                }
              };

              verifyBtn.addEventListener('click', handleVerify);
            }

            if (submitBtn && onSubmit) {
              submitBtn.addEventListener('click', () => onSubmit());
            }

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
  }, [onInput, onSubmit, onVerifyAnswer, problem, userProgress]);

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
