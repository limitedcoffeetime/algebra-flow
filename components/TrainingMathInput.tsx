'use dom';

import { addIntelligentLineBreaks, calculateResponsiveFontSize } from '@/utils/responsiveText';
import { useEffect, useRef } from 'react';

interface SolutionStep {
  explanation: string;
  mathExpression: string;
  isEquation: boolean;
}

interface Problem {
  id: string;
  equation: string;
  direction: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answer: string | number | number[];
  answerLHS?: string;
  answerRHS?: string | number | number[];
  solutionSteps: SolutionStep[];
}

interface UserProgress {
  problemsCorrect: number;
  problemsAttempted: number;
  currentDifficulty: 'easy' | 'medium' | 'hard';
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
  onVerifyAnswer?: (result: VerificationResult) => void;
  onButtonPress?: () => void;
  buttonState?: 'verify' | 'next' | 'try-again';
  readonly?: boolean;
  problem?: Problem;
  userProgress?: UserProgress;
  showSolution?: boolean;
}


export default function TrainingMathInput({
  value = '',
  placeholder = 'Enter your mathematical answer...',
  onInput,
  onVerifyAnswer,
  onButtonPress,
  buttonState = 'verify',
  readonly = false,
  problem,
  userProgress,
  showSolution = false,
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

    // Check compute engine availability
    const ce = (window as any)?.MathfieldElement?.computeEngine;

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
          // Only build HTML when MathLive hasn't been initialized yet

          // Generate problem section HTML with responsive sizing
          const problemSectionHTML = problem ? (() => {
            // Calculate responsive font sizes for web platform
            const responsiveSettings = calculateResponsiveFontSize(problem.equation, problem.direction, 350, 'web');
            const equationWithBreaks = addIntelligentLineBreaks(problem.equation);

            return `
            <div style="
              margin-bottom: 24px;
              padding: 24px;
              background: #1f2937;
              border-radius: 16px;
              border: 1px solid #374151;
            ">
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
              ">
                <div style="
                  font-size: 18px;
                  color: #ffffff;
                  font-weight: 600;
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                ">Problem</div>
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div style="
                    background: #3b82f6;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  ">${problem.difficulty}</div>
                  ${userProgress ? `
                    <div style="
                      color: #10b981;
                      font-size: 14px;
                      font-weight: 600;
                      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    ">${userProgress.problemsCorrect}/${userProgress.problemsAttempted}</div>
                  ` : ''}
                </div>
              </div>
              <div style="
                font-size: ${responsiveSettings.directionFontSize}px;
                color: #e5e7eb;
                margin-bottom: 16px;
                font-weight: 500;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                word-wrap: break-word;
                overflow-wrap: break-word;
                line-height: 1.4;
              ">${problem.direction}</div>
              <div style="
                background: #111827;
                border-radius: 12px;
                padding: 10px;
                border: 2px solid #3b82f6;
                overflow-x: auto;
                overflow-y: hidden;
              ">
                <math-field
                  readonly
                  style="
                    width: 100%;
                    max-width: 100%;
                    background: transparent;
                    border: none;
                    color: #ffffff;
                    font-size: ${responsiveSettings.equationFontSize}px;
                    min-height: auto;
                    padding: 0;
                    line-height: 1.3;
                    word-wrap: ${responsiveSettings.shouldWrap ? 'break-word' : 'normal'};
                    overflow-wrap: ${responsiveSettings.shouldWrap ? 'break-word' : 'normal'};
                    white-space: ${responsiveSettings.shouldWrap ? 'normal' : 'nowrap'};
                    box-sizing: border-box;
                  "
                >${equationWithBreaks}</math-field>
              </div>
            </div>
            `;
          })() : '';

          containerRef.current.innerHTML = `
            <div style="
              height: 100%;
              padding: 20px;
              background: #0f172a;
              overflow-x: hidden;
              max-width: 100%;
              box-sizing: border-box;
            ">
              ${problemSectionHTML}

              <div style="
                font-size: 18px;
                color: #ffffff;
                font-weight: 600;
                margin-bottom: 12px;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              ">Your Answer</div>

              <math-field
                id="training-math-field"
                style="
                  width: 100%;
                  min-height: 120px;
                  padding: 20px;
                  font-size: 24px;
                  border: 2px solid #374151;
                  border-radius: 12px;
                  background: #1f2937;
                  color: white;
                  box-sizing: border-box;
                  display: block;
                  transition: all 0.2s ease;
                  margin-bottom: 20px;
                "
              >
                ${value}
              </math-field>



                            <div style="
                display: flex;
                gap: 16px;
                margin-top: 8px;
              ">
                <button
                  id="main-action-btn"
                  style="
                    flex: 1;
                    background: ${buttonState === 'verify' ? '#10b981' : '#6b7280'};
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 16px 20px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  "
                >
                  ${buttonState === 'verify' ? 'Verify Answer' : 'Next Problem'}
                </button>
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
                // Trigger the main button action
                if (buttonState === 'verify' && onVerifyAnswer) {
                  const currentValue = mathField.value;
                  if (currentValue.trim()) {
                    const result = verifyAnswer(currentValue);
                    onVerifyAnswer(result);
                  }
                } else if (buttonState === 'next' && onButtonPress) {
                  onButtonPress();
                }
              }
            };

            const handleFocus = () => {
              mathField.style.borderColor = '#3b82f6';
              mathField.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            };

            const handleBlur = () => {
              mathField.style.borderColor = '#374151';
              mathField.style.boxShadow = 'none';
            };

            mathField.addEventListener('input', handleInput);
            mathField.addEventListener('keydown', handleKeyDown);
            mathField.addEventListener('focus', handleFocus);
            mathField.addEventListener('blur', handleBlur);

            // Add button functionality
            const mainBtn = containerRef.current.querySelector('#main-action-btn');

            if (mainBtn) {
              const handleMainButton = () => {
                if (buttonState === 'verify') {
                  // Verify answer
                  const currentValue = mathField.value;
                  if (currentValue.trim() && onVerifyAnswer) {
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
                } else {
                  // Next problem
                  if (onButtonPress) {
                    onButtonPress();
                  }
                }
              };

              mainBtn.addEventListener('click', handleMainButton);

              // Add hover effects
              mainBtn.addEventListener('mouseenter', () => {
                if (buttonState === 'verify') {
                  (mainBtn as HTMLElement).style.background = '#059669';
                } else {
                  (mainBtn as HTMLElement).style.background = '#4b5563';
                }
                (mainBtn as HTMLElement).style.transform = 'translateY(-1px)';
              });
              mainBtn.addEventListener('mouseleave', () => {
                if (buttonState === 'verify') {
                  (mainBtn as HTMLElement).style.background = '#10b981';
                } else {
                  (mainBtn as HTMLElement).style.background = '#6b7280';
                }
                (mainBtn as HTMLElement).style.transform = 'translateY(0)';
              });
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
  }, [onInput, onVerifyAnswer, onButtonPress, problem, userProgress]); // Removed showSolution and buttonState from deps

  // Separate effect to update solution and button content without rebuilding HTML
  useEffect(() => {
    if (!containerRef.current || !mathFieldRef.current) return;

    // Update solution section
    const existingSolution = containerRef.current.querySelector('#solution-section');
    if (showSolution && problem?.solutionSteps) {
      if (!existingSolution) {
        // Add solution section
        const solutionHTML = `
          <div id="solution-section" style="
            margin-top: 24px;
            padding: 24px;
            background: #1f2937;
            border-radius: 16px;
            border: 1px solid #f59e0b;
            border-left: 4px solid #f59e0b;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
          ">
            <div style="
              display: flex;
              align-items: center;
              margin-bottom: 20px;
            ">
              <div style="
                font-size: 20px;
                color: #f59e0b;
                margin-right: 8px;
              ">📝</div>
              <div style="
                font-size: 18px;
                color: #ffffff;
                font-weight: 600;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              ">Step-by-Step Solution</div>
            </div>

            ${problem.solutionSteps.map((step, index) => `
              <div style="
                margin-bottom: ${index === problem.solutionSteps.length - 1 ? '0' : '20px'};
                padding: 16px;
                background: #111827;
                border-radius: 12px;
                border-left: 3px solid #6b7280;
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
                overflow-x: hidden;
              ">
                <div style="
                  display: flex;
                  align-items: center;
                  margin-bottom: 12px;
                ">
                  <div style="
                    background: #374151;
                    color: #ffffff;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 600;
                    margin-right: 12px;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  ">${index + 1}</div>
                  <div style="
                    font-size: 14px;
                    color: #e5e7eb;
                    font-weight: 500;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    max-width: 100%;
                  ">${step.explanation}</div>
                </div>
                <div style="
                  background: #0f172a;
                  border-radius: 8px;
                  padding: 16px;
                  border: 1px solid #374151;
                  width: 100%;
                  max-width: 100%;
                  box-sizing: border-box;
                  overflow-x: auto;
                  overflow-y: hidden;
                ">
                  <math-field
                    readonly
                    class="solution-step-${index}"
                    style="
                      width: 100%;
                      max-width: 100%;
                      background: transparent;
                      border: none;
                      color: #ffffff;
                      font-size: 18px;
                      min-height: auto;
                      padding: 0;
                      box-sizing: border-box;
                    "
                  >${step.mathExpression}</math-field>
                </div>
              </div>
            `).join('')}
          </div>
        `;

        const inputField = containerRef.current.querySelector('#training-math-field');
        if (inputField) {
          inputField.insertAdjacentHTML('afterend', solutionHTML);
        }
      }
    } else if (existingSolution) {
      // Remove solution section
      existingSolution.remove();
    }

    // Update button text, color, and event handler
    const mainBtn = containerRef.current.querySelector('#main-action-btn') as HTMLElement;
    if (mainBtn) {
      mainBtn.textContent = buttonState === 'verify' ? 'Verify Answer' : 'Next Problem';
      mainBtn.style.background = buttonState === 'verify' ? '#10b981' : '#6b7280';

      // Remove existing event listeners
      const newBtn = mainBtn.cloneNode(true) as HTMLElement;
      mainBtn.parentNode?.replaceChild(newBtn, mainBtn);

      // Add new event handler with current buttonState
      const handleMainButton = () => {
        if (buttonState === 'verify') {
          // Verify answer
          const currentValue = mathFieldRef.current?.value;
          if (currentValue?.trim() && onVerifyAnswer) {
            const result = verifyAnswer(currentValue);
            onVerifyAnswer(result);

            // Visual feedback
            if (mathFieldRef.current) {
              if (result.isCorrect) {
                mathFieldRef.current.style.borderColor = '#10b981';
                mathFieldRef.current.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              } else {
                mathFieldRef.current.style.borderColor = '#ef4444';
                mathFieldRef.current.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
              }
            }
          }
        } else {
          // Next problem
          if (onButtonPress) {
            onButtonPress();
          }
        }
      };

      newBtn.addEventListener('click', handleMainButton);

      // Add hover effects
      newBtn.addEventListener('mouseenter', () => {
        if (buttonState === 'verify') {
          newBtn.style.background = '#059669';
        } else {
          newBtn.style.background = '#4b5563';
        }
        newBtn.style.transform = 'translateY(-1px)';
      });
      newBtn.addEventListener('mouseleave', () => {
        if (buttonState === 'verify') {
          newBtn.style.background = '#10b981';
        } else {
          newBtn.style.background = '#6b7280';
        }
        newBtn.style.transform = 'translateY(0)';
      });
    }
  }, [showSolution, buttonState, problem?.solutionSteps, onVerifyAnswer, onButtonPress]);

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
