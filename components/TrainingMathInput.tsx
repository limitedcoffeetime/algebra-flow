'use dom';

import { addIntelligentLineBreaks, calculateResponsiveFontSize } from '@/utils/responsiveText';
import { useEffect, useRef } from 'react';

// Global MathLive initialization cache
let mathLiveInitPromise: Promise<void> | null = null;

const initMathLive = async () => {
  if (mathLiveInitPromise) return mathLiveInitPromise;

  mathLiveInitPromise = (async () => {
    try {
      console.log('Initializing MathLive...');

      // Import MathLive and compute engine in parallel
      await Promise.all([
        import('mathlive'),
        import('@cortex-js/compute-engine')
      ]);

      // Wait for custom elements to be defined
      await customElements.whenDefined('math-field');

      // Configure global MathLive settings
      if ((window as any).MathfieldElement) {
        (window as any).MathfieldElement.fontsDirectory = null;
      }

      // Give compute engine time to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('MathLive initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MathLive:', error);
      mathLiveInitPromise = null; // Reset on error so it can be retried
      throw error;
    }
  })();

  return mathLiveInitPromise;
};


interface SolutionStep {
  explanation: string;
  mathExpression: string;
  isEquation: boolean;
}

interface Problem {
  id: string;
  equation: string;
  equations?: string[]; // Optional array of equations for systems
  direction: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answer: string | number | number[];
  answerLHS?: string;
  answerRHS?: string | number | number[];
  solutionSteps: SolutionStep[];
  problemType: string;
}

interface UserProgress {
  id: string;
  currentBatchId?: string | null;
  problemsAttempted: number;
  problemsCorrect: number;
  lastSyncTimestamp?: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
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
  isLoading = false,
  error = null,
  onRetry,
}: TrainingMathInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mathFieldRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);
  const retryButtonRef = useRef<HTMLButtonElement | null>(null);

  // Constants for better maintainability
  const ELEMENT_IDS = {
    PROBLEM_SECTION: 'problem-section',
    MATH_FIELD: 'training-math-field',
    MAIN_BUTTON: 'main-action-btn',
    RETRY_BUTTON: 'retry-btn',
  } as const;

  const STYLES = {
    CONTAINER_BASE: `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    `,
    FONT_FAMILY: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    RETRY_BUTTON: `
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;
    `,
    LOADING_SPINNER: `
      width: 40px;
      height: 40px;
      border: 3px solid #374151;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    `,
  } as const;

  // Clean up retry button event listener
  const cleanupRetryButton = () => {
    if (retryButtonRef.current) {
      retryButtonRef.current.removeEventListener('click', handleRetry);
      retryButtonRef.current = null;
    }
  };

  // Retry button handler
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  // Helper function to create centered message with optional retry button
  const createCenteredMessage = (message: string, messageColor: string, showRetryButton: boolean = false) => {
    const retryButtonHtml = showRetryButton ? `
      <button
        id="${ELEMENT_IDS.RETRY_BUTTON}"
        style="${STYLES.RETRY_BUTTON} font-family: ${STYLES.FONT_FAMILY};"
        aria-label="Retry loading problems"
      >Retry</button>
    ` : '';

    return `
      <div style="${STYLES.CONTAINER_BASE}">
        <div style="
          font-size: 18px;
          color: ${messageColor};
          margin-bottom: ${showRetryButton ? '16px' : '0'};
          font-family: ${STYLES.FONT_FAMILY};
        " role="alert" aria-live="polite">${message}</div>
        ${retryButtonHtml}
      </div>
    `;
  };

  // Helper function to setup retry button event listener
  const setupRetryButton = (problemSection: Element) => {
    cleanupRetryButton(); // Clean up any existing listener

    const retryBtn = problemSection.querySelector(`#${ELEMENT_IDS.RETRY_BUTTON}`) as HTMLButtonElement;
    if (retryBtn && onRetry) {
      retryBtn.addEventListener('click', handleRetry);
      retryButtonRef.current = retryBtn;

      // Add hover effect
      retryBtn.addEventListener('mouseenter', () => {
        retryBtn.style.background = '#2563eb';
      });
      retryBtn.addEventListener('mouseleave', () => {
        retryBtn.style.background = '#3b82f6';
      });
    }
  };

  // Helper function to get answer format instructions
  const getAnswerFormatInstructions = (problemType: string): string => {
    switch (problemType) {
      case 'quadratic-factoring':
      case 'quadratic-formula':
        return 'Submit both answers separated by a comma (e.g., "3, -2"). Order does not matter.';
      case 'systems-of-equations':
        return 'Submit your answer as an ordered pair (x, y), for example: (3, -2) or 3, -2';
      case 'polynomial-simplification':
        return 'Submit your answer in standard form and fully simplified.';
      case 'linear-one-variable':
      case 'linear-two-variables':
        return 'Submit your answer in fully simplified form.';
      default:
        return 'Submit your answer in fully simplified form.';
    }
  };

  // Helper function to validate quadratic answers (requires both solutions)
  const validateQuadraticAnswer = (userAnswer: string, problem: Problem, ce: any): VerificationResult => {
    console.log('🔍 validateQuadraticAnswer called with:', userAnswer);
    console.log('🔍 problem.answerRHS:', problem.answerRHS);
    console.log('🔍 problem.answer:', problem.answer);

    // Parse user input - expect comma-separated values
    const userAnswers = userAnswer.split(',').map(ans => ans.trim());
    console.log('🔍 userAnswers:', userAnswers);

    if (userAnswers.length !== 2) {
      console.log('❌ Not exactly 2 answers provided');
      return {
        isCorrect: false,
        userAnswerSimplified: userAnswer.trim(),
        correctAnswerSimplified: 'Both solutions required (e.g., "3, -2")',
        errorMessage: 'Please provide both solutions separated by a comma'
      };
    }

    // Get correct answers
    let correctAnswers: string[] = [];
    if (problem.answerRHS && Array.isArray(problem.answerRHS)) {
      correctAnswers = problem.answerRHS.map(ans => String(ans));
    } else if (Array.isArray(problem.answer)) {
      correctAnswers = problem.answer.map(ans => String(ans));
    } else {
      console.log('❌ Problem does not have array answers');
      return {
        isCorrect: false,
        userAnswerSimplified: userAnswer.trim(),
        correctAnswerSimplified: 'Invalid answer format',
        errorMessage: 'Problem does not have multiple solutions'
      };
    }

    console.log('🔍 correctAnswers:', correctAnswers);

    if (correctAnswers.length !== 2) {
      console.log('❌ Problem should have exactly 2 solutions');
      return {
        isCorrect: false,
        userAnswerSimplified: userAnswer.trim(),
        correctAnswerSimplified: correctAnswers.join(', '),
        errorMessage: 'Problem should have exactly 2 solutions'
      };
    }

    // Check if user answers match correct answers (order doesn't matter)
    const userSet = new Set(userAnswers.map(ans => ans.toLowerCase().replace(/\s+/g, '')));
    const correctSet = new Set(correctAnswers.map(ans => String(ans).toLowerCase().replace(/\s+/g, '')));

    console.log('🔍 userSet:', userSet);
    console.log('🔍 correctSet:', correctSet);

    // For more sophisticated comparison with MathLive if available
    if (ce) {
      try {
        const userSimplified = userAnswers.map(ans => ce.parse(ans).simplify().latex);
        const correctSimplified = correctAnswers.map(ans => ce.parse(String(ans)).simplify().latex);

        const userSimplifiedSet = new Set(userSimplified);
        const correctSimplifiedSet = new Set(correctSimplified);

        console.log('🔍 userSimplified:', userSimplified);
        console.log('🔍 correctSimplified:', correctSimplified);

        const isCorrect = userSimplifiedSet.size === correctSimplifiedSet.size &&
                         [...userSimplifiedSet].every(ans => correctSimplifiedSet.has(ans));

        console.log('🔍 isCorrect (MathLive):', isCorrect);

        return {
          isCorrect,
          userAnswerSimplified: userSimplified.join(', '),
          correctAnswerSimplified: correctSimplified.join(', '),
          errorMessage: isCorrect ? undefined : 'Both solutions must be correct'
        };
      } catch (error) {
        console.warn('Error using MathLive for quadratic validation, falling back to string comparison', error);
      }
    }

    // Fallback to string comparison
    const isCorrect = userSet.size === correctSet.size &&
                     [...userSet].every(ans => correctSet.has(ans));

    console.log('🔍 isCorrect (fallback):', isCorrect);

    return {
      isCorrect,
      userAnswerSimplified: userAnswers.join(', '),
      correctAnswerSimplified: correctAnswers.join(', '),
      errorMessage: isCorrect ? undefined : 'Both solutions must be correct (order doesn\'t matter)'
    };
  };

  // Helper function to validate systems of equations answers (requires ordered pair)
  const validateSystemsAnswer = (userAnswer: string, problem: Problem, ce: any): VerificationResult => {
    // Parse user input - expect (x, y) format or x, y format
    let userAnswers: string[] = [];

    // Handle (x, y) format
    const parenMatch = userAnswer.match(/\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
    if (parenMatch) {
      userAnswers = [parenMatch[1].trim(), parenMatch[2].trim()];
    } else {
      // Handle x, y format
      const parts = userAnswer.split(',').map(ans => ans.trim());
      if (parts.length === 2) {
        userAnswers = parts;
      }
    }

    if (userAnswers.length !== 2) {
      return {
        isCorrect: false,
        userAnswerSimplified: userAnswer.trim(),
        correctAnswerSimplified: 'Ordered pair required (e.g., "(3, -2)" or "3, -2")',
        errorMessage: 'Please provide your answer as an ordered pair (x, y)'
      };
    }

    // Get correct answers (should be an ordered pair)
    let correctAnswers: string[] = [];
    if (Array.isArray(problem.answer) && problem.answer.length === 2) {
      correctAnswers = problem.answer.map(ans => String(ans));
    } else {
      return {
        isCorrect: false,
        userAnswerSimplified: userAnswer.trim(),
        correctAnswerSimplified: 'Invalid answer format',
        errorMessage: 'Problem does not have a valid ordered pair solution'
      };
    }

    // For systems, order matters (x-value, y-value)
    let isCorrect = false;

    if (ce) {
      try {
        const userSimplified = userAnswers.map(ans => ce.parse(ans).simplify().latex);
        const correctSimplified = correctAnswers.map(ans => ce.parse(String(ans)).simplify().latex);

        isCorrect = userSimplified[0] === correctSimplified[0] &&
                   userSimplified[1] === correctSimplified[1];

        return {
          isCorrect,
          userAnswerSimplified: `(${userSimplified[0]}, ${userSimplified[1]})`,
          correctAnswerSimplified: `(${correctSimplified[0]}, ${correctSimplified[1]})`,
          errorMessage: isCorrect ? undefined : 'Order matters: first value is x, second is y'
        };
      } catch (error) {
        console.warn('Error using MathLive for systems validation, falling back to string comparison');
      }
    }

    // Fallback to string comparison
    const userNormalized = userAnswers.map(ans => ans.toLowerCase().replace(/\s+/g, ''));
    const correctNormalized = correctAnswers.map(ans => String(ans).toLowerCase().replace(/\s+/g, ''));

    isCorrect = userNormalized[0] === correctNormalized[0] &&
               userNormalized[1] === correctNormalized[1];

    return {
      isCorrect,
      userAnswerSimplified: `(${userAnswers[0]}, ${userAnswers[1]})`,
      correctAnswerSimplified: `(${correctAnswers[0]}, ${correctAnswers[1]})`,
      errorMessage: isCorrect ? undefined : 'Order matters: first value is x, second is y'
    };
  };

  // Function to verify answer using MathLive's simplify
  const verifyAnswer = (userAnswer: string): VerificationResult => {
    console.log('🔍 verifyAnswer called with:', userAnswer);
    console.log('🔍 problem:', problem);

    if (!problem) {
      console.log('❌ No problem available');
      return {
        isCorrect: false,
        userAnswerSimplified: userAnswer,
        correctAnswerSimplified: '',
        errorMessage: 'No problem available for verification'
      };
    }

    console.log('🔍 problem.problemType:', problem.problemType);

    // Check compute engine availability
    const ce = (window as any)?.MathfieldElement?.computeEngine;
    console.log('🔍 compute engine available:', !!ce);

    try {
      // Special handling for quadratics - require both answers
      if (problem.problemType === 'quadratic-factoring' || problem.problemType === 'quadratic-formula') {
        console.log('🔍 Using quadratic validation');
        return validateQuadraticAnswer(userAnswer, problem, ce);
      }

      // Special handling for systems of equations - require ordered pair
      if (problem.problemType === 'systems-of-equations') {
        console.log('🔍 Using systems validation');
        return validateSystemsAnswer(userAnswer, problem, ce);
      }

      console.log('🔍 Using standard validation');
      // Determine the correct answer to compare against
      let correctAnswerStr: string;

      // If answerRHS exists, use it (user typically enters just the RHS part)
      if (problem.answerRHS !== undefined && problem.answerRHS !== null) {
        if (Array.isArray(problem.answerRHS)) {
          // For arrays (like multiple solutions), check if user answer matches any
          if (problem.problemType === 'polynomial-simplification') {
            // For polynomial simplification, use exact string matching
            const userNormalized = userAnswer.replace(/\s+/g, '');

            for (const ans of problem.answerRHS) {
              const correctNormalized = String(ans).replace(/\s+/g, '');
              if (userNormalized === correctNormalized) {
                return {
                  isCorrect: true,
                  userAnswerSimplified: userAnswer.trim(),
                  correctAnswerSimplified: String(ans).trim()
                };
              }
            }
          } else {
            // For other problem types, use MathLive's simplification
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

        if (problem.problemType === 'polynomial-simplification') {
          // For polynomial simplification, use exact string matching
          const userNormalized = userAnswer.replace(/\s+/g, '');
          const fullAnswerNormalized = fullAnswer.replace(/\s+/g, '');

          if (userNormalized === fullAnswerNormalized) {
            return {
              isCorrect: true,
              userAnswerSimplified: userAnswer.trim(),
              correctAnswerSimplified: fullAnswer.trim()
            };
          }

          // Also check if they just entered the answer part (without LHS)
          if (Array.isArray(problem.answer)) {
            for (const ans of problem.answer) {
              const correctNormalized = String(ans).replace(/\s+/g, '');
              if (userNormalized === correctNormalized) {
                return {
                  isCorrect: true,
                  userAnswerSimplified: userAnswer.trim(),
                  correctAnswerSimplified: String(ans).trim()
                };
              }
            }
            correctAnswerStr = String(problem.answer[0]);
          } else {
            const answerOnlyNormalized = String(problem.answer).replace(/\s+/g, '');
            if (userNormalized === answerOnlyNormalized) {
              return {
                isCorrect: true,
                userAnswerSimplified: userAnswer.trim(),
                correctAnswerSimplified: String(problem.answer).trim()
              };
            }
            correctAnswerStr = String(problem.answer);
          }
        } else {
          // For other problem types, use MathLive's simplification
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
      }
      // Fallback to original answer field
      else if (Array.isArray(problem.answer)) {
        // For arrays (like multiple solutions), check if user answer matches any
        if (problem.problemType === 'polynomial-simplification') {
          // For polynomial simplification, use exact string matching
          const userNormalized = userAnswer.replace(/\s+/g, '');

          for (const ans of problem.answer) {
            const correctNormalized = String(ans).replace(/\s+/g, '');
            if (userNormalized === correctNormalized) {
              return {
                isCorrect: true,
                userAnswerSimplified: userAnswer.trim(),
                correctAnswerSimplified: String(ans).trim()
              };
            }
          }
        } else {
          // For other problem types, use MathLive's simplification
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
        }

        // If no match found, return false with first answer as reference
        correctAnswerStr = String(problem.answer[0]);
      } else {
        correctAnswerStr = String(problem.answer);
      }

      // For polynomial simplification, use exact string matching (excluding whitespace)
      // For other problems, use MathLive's simplification for semantic comparison
      if (problem.problemType === 'polynomial-simplification') {
        // Normalize both answers by removing whitespace and comparing exactly
        const userNormalized = userAnswer.replace(/\s+/g, '');
        const correctNormalized = correctAnswerStr.replace(/\s+/g, '');

        const isCorrect = userNormalized === correctNormalized;

        return {
          isCorrect,
          userAnswerSimplified: userAnswer.trim(),
          correctAnswerSimplified: correctAnswerStr.trim()
        };
      } else {
        // For non-polynomial problems, use MathLive's compute engine for semantic comparison
        const userSimplified = ce.parse(userAnswer).simplify().latex;
        const correctSimplified = ce.parse(correctAnswerStr).simplify().latex;

        const isCorrect = userSimplified === correctSimplified;

        return {
          isCorrect,
          userAnswerSimplified: userSimplified,
          correctAnswerSimplified: correctSimplified
        };
      }

    } catch (error) {
      console.error('Error during answer verification:', error);

      // Fallback validation logic
      if (problem.problemType === 'polynomial-simplification') {
        // For polynomial simplification, use exact string matching even in fallback
        const userNormalized = userAnswer.replace(/\s+/g, '');

        // Determine correct answer for fallback comparison
        let correctAnswer: string;
        let isCorrect = false;

        if (problem.answerRHS !== undefined && problem.answerRHS !== null) {
          const correctNormalized = Array.isArray(problem.answerRHS)
            ? String(problem.answerRHS[0]).replace(/\s+/g, '')
            : String(problem.answerRHS).replace(/\s+/g, '');
          correctAnswer = Array.isArray(problem.answerRHS) ? String(problem.answerRHS[0]) : String(problem.answerRHS);
          isCorrect = userNormalized === correctNormalized;
        } else if (problem.answerLHS && problem.answer) {
          const fullAnswer = `${problem.answerLHS}${problem.answer}`;
          const fullAnswerNormalized = fullAnswer.replace(/\s+/g, '');
          const answerOnly = Array.isArray(problem.answer) ? String(problem.answer[0]) : String(problem.answer);
          const answerOnlyNormalized = answerOnly.replace(/\s+/g, '');

          isCorrect = userNormalized === fullAnswerNormalized || userNormalized === answerOnlyNormalized;
          correctAnswer = userNormalized === fullAnswerNormalized ? fullAnswer : answerOnly;
        } else {
          correctAnswer = Array.isArray(problem.answer) ? String(problem.answer[0]) : String(problem.answer);
          const correctNormalized = correctAnswer.replace(/\s+/g, '');
          isCorrect = userNormalized === correctNormalized;
        }

        return {
          isCorrect,
          userAnswerSimplified: userAnswer.trim(),
          correctAnswerSimplified: correctAnswer.trim(),
          errorMessage: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      } else {
        // For other problem types, use case-insensitive string comparison as fallback
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
          correctAnswerSimplified: correctStr,
          errorMessage: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  };

  // Function to update only the problem content without rebuilding everything
  const updateProblemContent = () => {
    if (!containerRef.current || !isInitializedRef.current) return;

    const problemSection = containerRef.current.querySelector(`#${ELEMENT_IDS.PROBLEM_SECTION}`);
    if (!problemSection) return;

    // Clean up any existing retry button listeners
    cleanupRetryButton();

    // Handle loading state
    if (isLoading) {
      problemSection.innerHTML = `
        <div style="${STYLES.CONTAINER_BASE}">
          <div style="${STYLES.LOADING_SPINNER}"></div>
          <div style="
            font-size: 16px;
            color: #94a3b8;
            font-family: ${STYLES.FONT_FAMILY};
          " role="status" aria-live="polite">Loading problems...</div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      return;
    }

    // Handle error state
    if (error && !problem) {
      problemSection.innerHTML = createCenteredMessage(error, '#ef4444', true);
      setupRetryButton(problemSection);
      return;
    }

    // Handle no problem state
    if (!problem) {
      problemSection.innerHTML = createCenteredMessage('No problems available', '#ef4444', true);
      setupRetryButton(problemSection);
      return;
    }

    // Normal problem state
    const responsiveSettings = calculateResponsiveFontSize(problem.equation, problem.direction, 350, 'web');
    const equationWithBreaks = addIntelligentLineBreaks(problem.equation);

    problemSection.innerHTML = `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      ">
        <div style="
          font-size: 18px;
          color: #ffffff;
          font-weight: 600;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
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
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          ">${problem.difficulty}</div>
          ${userProgress ? `
            <div style="
              color: #10b981;
              font-size: 14px;
              font-weight: 600;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            " aria-label="Progress: ${userProgress.problemsCorrect} correct out of ${userProgress.problemsAttempted} attempted">${userProgress.problemsCorrect}/${userProgress.problemsAttempted}</div>
          ` : ''}
        </div>
      </div>
      <div style="
        font-size: ${responsiveSettings.directionFontSize}px;
        color: #e5e7eb;
        margin-bottom: 16px;
        font-weight: 600;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        word-wrap: break-word;
        overflow-wrap: break-word;
        line-height: 1.4;
      ">${problem.direction}</div>
      <div style="
        background: #111827;
        border-radius: 12px;
        padding: 9px;
        border: 2px solid #3b82f6;
        overflow-x: auto;
        overflow-y: hidden;
      " role="math" aria-label="Problem equation">
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
      <div style="
        font-size: 16px;
        color: #9ca3af;
        margin-top: 16px;
        margin-bottom: 16px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      ">Answer Format: ${getAnswerFormatInstructions(problem.problemType)}</div>
    `;
  };

  // Set up global button handler that persists across re-renders with debounce
  useEffect(() => {
    let isProcessing = false;
    let lastClickTime = 0;

    (window as any).handleVerifyButtonClick = () => {
      const now = Date.now();

      // Debounce: prevent multiple clicks within 500ms
      if (isProcessing || (now - lastClickTime < 500)) {
        console.log('🔍 Button click ignored (debounced)');
        return;
      }

      lastClickTime = now;
      isProcessing = true;

      console.log('🌍 GLOBAL HANDLER CALLED! (debounced)');
      console.log('🔍 Current buttonState:', buttonState);
      console.log('🔍 mathFieldRef.current:', !!mathFieldRef.current);
      console.log('🔍 onVerifyAnswer:', !!onVerifyAnswer);
      console.log('🔍 onButtonPress:', !!onButtonPress);

      try {
        if (buttonState === 'verify') {
          const currentValue = mathFieldRef.current?.value;
          console.log('🔍 Current value from math field:', currentValue);

          if (currentValue?.trim()) {
            if (onVerifyAnswer) {
              console.log('🔍 Calling verifyAnswer with:', currentValue);
              const result = verifyAnswer(currentValue);
              console.log('🔍 Verification result:', result);
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
            } else {
              console.error('❌ onVerifyAnswer callback is not provided');
            }
          } else {
            console.log('❌ No value to verify - currentValue:', currentValue);
          }
        } else if (onButtonPress) {
          console.log('🔍 Calling onButtonPress for next problem');
          onButtonPress();
        }
      } finally {
        // Reset processing flag after a short delay to allow UI updates
        setTimeout(() => {
          isProcessing = false;
        }, 100);
      }
    };

    return () => {
      delete (window as any).handleVerifyButtonClick;
    };
  }, [buttonState, onVerifyAnswer, onButtonPress, mathFieldRef.current]);

  // Initialize MathLive once (no problem dependencies)
  useEffect(() => {
    const setupMathLive = async () => {
      try {
        // Use the global initialization function
        await initMathLive();

        if (containerRef.current && !mathFieldRef.current) {
          // Build HTML structure once
          containerRef.current.innerHTML = `
            <style>
              * {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
              }
            </style>
            <div style="
              height: 100%;
              padding: 12px;
              background: #0f172a;
              overflow-x: hidden;
              max-width: 100%;
              box-sizing: border-box;
            ">
              <div id="${ELEMENT_IDS.PROBLEM_SECTION}" style="
                margin-bottom: 12px;
                padding: 16px;
                background: #1f2937;
                border-radius: 16px;
                border: 1px solid #374151;
              ">
                <!-- Problem content will be dynamically updated here -->
              </div>

              <div style="
                font-size: 18px;
                color: #ffffff;
                font-weight: 600;
                margin-bottom: 12px;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              ">Your Answer</div>

              <math-field
                id="${ELEMENT_IDS.MATH_FIELD}"
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
                aria-label="Math input field"
              >
                ${value}
              </math-field>

              <div style="
                display: flex;
                gap: 16px;
                margin-top: 8px;
              ">
                <button
                  id="${ELEMENT_IDS.MAIN_BUTTON}"
                  onclick="window.handleVerifyButtonClick && window.handleVerifyButtonClick()"
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
                    font-family: ${STYLES.FONT_FAMILY};
                  "
                >
                  ${buttonState === 'verify' ? 'Verify Answer' : 'Next Problem'}
                </button>
              </div>
            </div>
          `;

          // Get the math field element
          const mathField = containerRef.current.querySelector(`#${ELEMENT_IDS.MATH_FIELD}`) as any;
          if (mathField) {
            mathFieldRef.current = mathField;

            // Set initial properties
            mathField.value = value;
            mathField.readOnly = readonly;

            // Configure MathLive options using new syntax (no more setOptions deprecation warnings)
            mathField.mathVirtualKeyboardPolicy = 'auto';
            mathField.smartFence = true;
            mathField.smartSuperscript = false;
            mathField.removeExtraneousParentheses = true;


            // Initial button setup will be handled by the button state effect

            // Focus the field for better UX
            setTimeout(() => {
              if (!readonly) {
                mathField.focus();
              }
            }, 100);

            // Mark as initialized
            isInitializedRef.current = true;

            // Update problem content after initialization
            updateProblemContent();
          }
        }
      } catch (error) {
        console.error('Failed to setup MathLive:', error);
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

    setupMathLive();

    // Cleanup function
    return () => {
      cleanupRetryButton();
    };
  }, [onInput, onVerifyAnswer, onButtonPress]); // Removed problem and userProgress from deps

    // Update problem content when problem, userProgress, loading, or error states change
  useEffect(() => {
    updateProblemContent();

    // Clear the input field when problem changes (but not on first initialization or loading states)
    if (mathFieldRef.current && isInitializedRef.current && problem && !isLoading) {
      mathFieldRef.current.value = '';
      // Reset border color to default
      mathFieldRef.current.style.borderColor = '#374151';
      mathFieldRef.current.style.boxShadow = 'none';
    }
  }, [problem, userProgress, isLoading, error]);

  // Button event handlers stored in refs to avoid stale closures
  const buttonClickHandlerRef = useRef<(() => void) | null>(null);
  const buttonMouseEnterHandlerRef = useRef<(() => void) | null>(null);
  const buttonMouseLeaveHandlerRef = useRef<(() => void) | null>(null);

    // Update button styling when buttonState changes
  useEffect(() => {
    if (!containerRef.current || !isInitializedRef.current) return;

    const mainBtn = containerRef.current.querySelector(`#${ELEMENT_IDS.MAIN_BUTTON}`) as HTMLElement;
    if (!mainBtn) {
      console.log('❌ Button element not found for styling!');
      return;
    }

    console.log('🔍 Updating button styling for buttonState:', buttonState);

    // Set button text and styling
    if (buttonState === 'verify') {
      mainBtn.textContent = 'Verify Answer';
      mainBtn.style.background = '#10b981';
      mainBtn.style.color = '#ffffff';
    } else {
      mainBtn.textContent = 'Continue';
      mainBtn.style.background = '#6b7280';
      mainBtn.style.color = '#ffffff';
    }

    console.log('🔍 Button styling updated successfully');
  }, [buttonState]);

  // Separate effect to handle solution display
  useEffect(() => {
    if (!containerRef.current || !mathFieldRef.current || !isInitializedRef.current) return;

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
            border-left: 1px solid #f59e0b;
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

        const inputField = containerRef.current.querySelector(`#${ELEMENT_IDS.MATH_FIELD}`);
        if (inputField) {
          inputField.insertAdjacentHTML('afterend', solutionHTML);
        }
      }
    } else if (existingSolution) {
      // Remove solution section
      existingSolution.remove();
    }
  }, [showSolution, problem?.solutionSteps]);

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
