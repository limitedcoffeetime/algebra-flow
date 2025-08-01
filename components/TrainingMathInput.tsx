'use dom';

import { calculateResponsiveFontSize, setupResponsiveMathField } from '@/utils/responsiveText';
import { configureVirtualKeyboard, initializeCustomKeyboard } from '@/utils/customKeyboard';
import { useEffect, useRef } from 'react';
import { validateAnswer } from '@/utils/strictValidation';

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

      // Initialize custom virtual keyboard
      initializeCustomKeyboard();

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
  equations: string[]; // Array of equations (always used)
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
  const responsiveCleanupFuncsRef = useRef<(() => void)[]>([]);

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

  // Clean up responsive font sizing listeners
  const cleanupResponsiveFontSizing = () => {
    responsiveCleanupFuncsRef.current.forEach(cleanup => cleanup());
    responsiveCleanupFuncsRef.current = [];
  };

  // Set up smooth drag scrolling for equation containers
  const setupSmoothScrolling = (container: HTMLElement) => {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let animationId: number | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      container.style.cursor = 'grabbing';
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      // Cancel any ongoing smooth scrolling
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const handleMouseLeave = () => {
      isDown = false;
      container.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
      isDown = false;
      container.style.cursor = 'grab';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5; // Scroll speed multiplier
      container.scrollLeft = scrollLeft - walk;
    };

    // Touch support for mobile
    const handleTouchStart = (e: TouchEvent) => {
      isDown = true;
      const touch = e.touches[0];
      startX = touch.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const touch = e.touches[0];
      const x = touch.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    };

    const handleTouchEnd = () => {
      isDown = false;
    };

    // Add event listeners
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    // Return cleanup function
    const cleanup = () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };

    responsiveCleanupFuncsRef.current.push(cleanup);
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

  // Helper function to normalize LaTeX expressions for comparison
  const normalizeLatexExpression = (expression: string): string => {
    return expression
      .toLowerCase()
      .replace(/\s+/g, '') // Remove all whitespace
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
        // Convert \frac{a}{b} to (a)/b if numerator has multiple terms, otherwise a/b
        const needsParens = num.includes('+') || num.includes('-');
        return needsParens ? `(${num})/${den}` : `${num}/${den}`;
      })
      .replace(/\\frac(\d+)(\d+)/g, '$1/$2') // Convert \frac34 to 3/4
      .replace(/\{([^}]*)\}/g, '$1') // Remove braces around single terms
      .replace(/\^{(\d+)}/g, '^$1') // Simplify exponents
      .replace(/\\\\/g, '') // Remove escape characters
      .replace(/\\([a-z]+)/g, '') // Remove other LaTeX commands
      .trim();
  };

  // Helper function to get answer format instructions
  const getAnswerFormatInstructions = (problemType: string): string => {
    switch (problemType) {
      case 'quadratic-completing-square':
        return 'For two distinct solutions, submit both answers separated by a comma (e.g., "3, -2"). For double roots, submit just one answer.';
      case 'systems-of-equations':
        return 'Submit your answer as x, y (no parentheses required), for example: 3, -2';
      case 'polynomial-simplification':
        return 'Submit your answer in standard form and fully simplified.';
      case 'linear-one-variable':
      case 'linear-two-variables':
        return 'Submit your answer in fully simplified form.';
      default:
        return 'Submit your answer in fully simplified form.';
    }
  };

  // Helper function to validate quadratic answers (handles both single and double roots)
  const validateQuadraticAnswer = (userAnswer: string, problem: Problem, ce: any): VerificationResult => {
    console.log('🔍 validateQuadraticAnswer called with:', userAnswer);

    // Parse user input - expect comma-separated values for distinct roots, single value for double roots
    const userAnswers = userAnswer.split(',').map(ans => ans.trim()).filter(ans => ans.length > 0);
    console.log('🔍 userAnswers:', userAnswers);

    // Get correct answers first to determine if we have single or double root
    let correctAnswers: string[] = [];
    let isDoubleRoot = false;
    
    if (problem.answerRHS !== undefined && problem.answerRHS !== null) {
      if (Array.isArray(problem.answerRHS)) {
        correctAnswers = problem.answerRHS.map(ans => String(ans));
      } else {
        const answerString = String(problem.answerRHS);
        // Handle backward compatibility: if answerRHS is a string with comma, split it
        if (answerString.includes(',')) {
          correctAnswers = answerString.split(',').map(ans => ans.trim()).filter(ans => ans.length > 0);
          console.log('🔧 Backward compatibility: split comma-separated answer string:', correctAnswers);
        } else {
          correctAnswers = [answerString];
          isDoubleRoot = true;
        }
      }
    } else if (problem.answer !== undefined && problem.answer !== null) {
      if (Array.isArray(problem.answer)) {
        correctAnswers = problem.answer.map(ans => String(ans));
      } else {
        const answerString = String(problem.answer);
        // Handle backward compatibility: if answer is a string with comma, split it
        if (answerString.includes(',')) {
          correctAnswers = answerString.split(',').map(ans => ans.trim()).filter(ans => ans.length > 0);
          console.log('🔧 Backward compatibility: split comma-separated answer string:', correctAnswers);
        } else {
          correctAnswers = [answerString];
          isDoubleRoot = true;
        }
      }
    } else {
      console.log('❌ Problem does not have valid answers');
      return {
        isCorrect: false,
        userAnswerSimplified: userAnswer.trim(),
        correctAnswerSimplified: 'Invalid answer format',
        errorMessage: 'Problem does not have valid solutions'
      };
    }

    console.log('🔍 correctAnswers:', correctAnswers);
    console.log('🔍 isDoubleRoot:', isDoubleRoot);

    // Check if it's a double root (two identical solutions)
    if (!isDoubleRoot && correctAnswers.length === 2) {
      const normalizedCorrect = correctAnswers.map(ans => String(ans).toLowerCase().replace(/\s+/g, ''));
      isDoubleRoot = normalizedCorrect[0] === normalizedCorrect[1];
    }

    console.log('🔍 final isDoubleRoot:', isDoubleRoot);

    // Validate user input based on whether it's a double root or not
    if (isDoubleRoot) {
      // For double roots, accept either single answer or two identical answers
      if (userAnswers.length === 1) {
        // Single answer is fine for double roots
      } else if (userAnswers.length === 2) {
        // Two identical answers are also fine for double roots
        const normalizedUser = userAnswers.map(ans => ans.toLowerCase().replace(/\s+/g, ''));
        if (normalizedUser[0] !== normalizedUser[1]) {
          return {
            isCorrect: false,
            userAnswerSimplified: userAnswer.trim(),
            correctAnswerSimplified: correctAnswers[0],
            errorMessage: 'This problem has a double root. You can submit just one answer or two identical answers.'
          };
        }
      } else {
        return {
          isCorrect: false,
          userAnswerSimplified: userAnswer.trim(),
          correctAnswerSimplified: correctAnswers[0],
          errorMessage: 'For double roots, provide either one answer or two identical answers separated by a comma'
        };
      }
    } else {
      // For distinct roots, require exactly 2 different answers
      if (userAnswers.length !== 2) {
        console.log('❌ Not exactly 2 answers provided for distinct roots');
        return {
          isCorrect: false,
          userAnswerSimplified: userAnswer.trim(),
          correctAnswerSimplified: 'Both solutions required (e.g., "3, -2")',
          errorMessage: 'Please provide both solutions separated by a comma'
        };
      }
    }

    // Now validate the answers using simplified strategy
    if (isDoubleRoot) {
      // For double roots, compare user's answer(s) against the single correct answer
      const correctAnswer = correctAnswers[0];
      const userAnswerToCheck = userAnswers[0]; // Use the first (and possibly only) user answer
      
      // Step 1: Direct comparison
      if (userAnswerToCheck.trim() === correctAnswer.trim()) {
        console.log('✅ Direct match for double root');
        return {
          isCorrect: true,
          userAnswerSimplified: userAnswerToCheck.trim(),
          correctAnswerSimplified: correctAnswer
        };
      }

      // Step 2: Strict validation for double root
      const validation = validateAnswer(userAnswerToCheck, correctAnswer);
      console.log(`🔍 Strict validation for double root "${userAnswerToCheck}" vs "${correctAnswer}":`, validation);
      
      if (validation.isCorrect) {
        console.log('✅ Double root is correct and simplified');
        return {
          isCorrect: true,
          userAnswerSimplified: userAnswerToCheck.trim(),
          correctAnswerSimplified: correctAnswer
        };
      } else if (validation.needsFeedback) {
        console.log('🟡 Double root needs simplification');
        return {
          isCorrect: false,
          userAnswerSimplified: userAnswerToCheck.trim(),
          correctAnswerSimplified: correctAnswer,
          errorMessage: validation.feedbackMessage || 'Please simplify your answer further.'
        };
      } else {
        console.log('❌ Double root is incorrect');
        return {
          isCorrect: false,
          userAnswerSimplified: userAnswerToCheck.trim(),
          correctAnswerSimplified: correctAnswer,
          errorMessage: 'Double root answer is incorrect'
        };
      }
    } else {
      // For distinct roots, each user answer must match one of the correct answers
      console.log('🔍 Validating distinct roots');
      
      // Step 1: Direct comparison
      const userSet = new Set(userAnswers.map(ans => ans.trim()));
      const correctSet = new Set(correctAnswers.map(ans => String(ans).trim()));
      
      if (userSet.size === correctSet.size && [...userSet].every(ans => correctSet.has(ans))) {
        console.log('✅ Direct match for distinct roots');
        return {
          isCorrect: true,
          userAnswerSimplified: userAnswers.join(', '),
          correctAnswerSimplified: correctAnswers.join(', ')
        };
      }

      // Step 2: Strict validation for each answer
      console.log('🔍 Applying strict validation to each answer');
      const validationResults = [];
      const userAnswerMatches = [];
      
      // Validate each user answer against each correct answer to find matches
      for (const userAns of userAnswers) {
        let bestMatch = null;
        let matchFound = false;
        
        for (const correctAns of correctAnswers) {
          const validation = validateAnswer(userAns, correctAns);
          console.log(`🔍 Validating "${userAns}" vs "${correctAns}":`, validation);
          
          if (validation.isCorrect) {
            bestMatch = { userAns, correctAns, validation };
            matchFound = true;
            break;
          } else if (validation.needsFeedback && !bestMatch) {
            bestMatch = { userAns, correctAns, validation };
          }
        }
        
        if (matchFound) {
          userAnswerMatches.push(bestMatch);
        } else if (bestMatch) {
          // Found algebraically equivalent but not simplified
          console.log('🟡 Answer needs simplification:', bestMatch);
          return {
            isCorrect: false,
            userAnswerSimplified: userAnswers.join(', '),
            correctAnswerSimplified: correctAnswers.join(', '),
            errorMessage: bestMatch.validation.feedbackMessage || 'Please simplify your answer further.'
          };
        } else {
          // No match found at all
          console.log('❌ No match found for:', userAns);
          validationResults.push({ userAns, match: false });
        }
      }
      
      // Check if we have the right number of matches
      if (userAnswerMatches.length === correctAnswers.length && userAnswers.length === correctAnswers.length) {
        console.log('✅ All answers correct and simplified');
        return {
          isCorrect: true,
          userAnswerSimplified: userAnswers.join(', '),
          correctAnswerSimplified: correctAnswers.join(', ')
        };
      }

      // Step 3: Fallback to normalized string comparison
      const userNormalizedSet = new Set(userAnswers.map(ans => ans.toLowerCase().replace(/\s+/g, '')));
      const correctNormalizedSet = new Set(correctAnswers.map(ans => String(ans).toLowerCase().replace(/\s+/g, '')));

      const isCorrect = userNormalizedSet.size === correctNormalizedSet.size &&
                       [...userNormalizedSet].every(ans => correctNormalizedSet.has(ans));

      console.log(isCorrect ? '✅ Normalized match for distinct roots' : '❌ No match for distinct roots');

      return {
        isCorrect,
        userAnswerSimplified: userAnswers.join(', '),
        correctAnswerSimplified: correctAnswers.join(', '),
        errorMessage: isCorrect ? undefined : 'Both solutions must be correct (order doesn\'t matter)'
      };
    }
  };

  // Helper function to validate systems of equations answers (requires ordered pair)
  const validateSystemsAnswer = (userAnswer: string, problem: Problem, ce: any): VerificationResult => {
    console.log('🔍 validateSystemsAnswer called with:', userAnswer);
    
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

    console.log('🔍 userAnswers:', userAnswers);
    console.log('🔍 correctAnswers:', correctAnswers);

    // For systems, order matters (x-value, y-value)
    // Step 1: Direct comparison
    if (userAnswers[0].trim() === correctAnswers[0].trim() && 
        userAnswers[1].trim() === correctAnswers[1].trim()) {
      console.log('✅ Direct match for systems');
      return {
        isCorrect: true,
        userAnswerSimplified: `(${userAnswers[0]}, ${userAnswers[1]})`,
        correctAnswerSimplified: `(${correctAnswers[0]}, ${correctAnswers[1]})`
      };
    }

    // Step 2: Strict validation for each coordinate (order matters)
    const xValidation = validateAnswer(userAnswers[0], correctAnswers[0]);
    const yValidation = validateAnswer(userAnswers[1], correctAnswers[1]);
    
    console.log(`🔍 X validation ("${userAnswers[0]}" vs "${correctAnswers[0]}"):`, xValidation);
    console.log(`🔍 Y validation ("${userAnswers[1]}" vs "${correctAnswers[1]}"):`, yValidation);

    // Check if both coordinates are correct and simplified
    if (xValidation.isCorrect && yValidation.isCorrect) {
      console.log('✅ Both coordinates correct and simplified');
      return {
        isCorrect: true,
        userAnswerSimplified: `(${userAnswers[0]}, ${userAnswers[1]})`,
        correctAnswerSimplified: `(${correctAnswers[0]}, ${correctAnswers[1]})`
      };
    }

    // Check if either coordinate needs simplification
    if (xValidation.needsFeedback || yValidation.needsFeedback) {
      console.log('🟡 One or both coordinates need simplification');
      const feedbackMessage = xValidation.needsFeedback ? 
        xValidation.feedbackMessage : yValidation.feedbackMessage;
      return {
        isCorrect: false,
        userAnswerSimplified: `(${userAnswers[0]}, ${userAnswers[1]})`,
        correctAnswerSimplified: `(${correctAnswers[0]}, ${correctAnswers[1]})`,
        errorMessage: feedbackMessage || 'Please simplify your answer further.'
      };
    }

    // Neither coordinate matches
    console.log('❌ Coordinates are incorrect');
    return {
      isCorrect: false,
      userAnswerSimplified: `(${userAnswers[0]}, ${userAnswers[1]})`,
      correctAnswerSimplified: `(${correctAnswers[0]}, ${correctAnswers[1]})`,
      errorMessage: 'Order matters: first value is x, second is y'
    };
  };

  // Strict validation strategy: check canonical form first, then equivalence
  const verifyAnswer = (userAnswer: string): VerificationResult => {
    console.log('🔍 verifyAnswer called with:', userAnswer);

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
      // Special handling for quadratics - handle both single and double roots
      if (problem.problemType === 'quadratic-completing-square') {
        console.log('🔍 Using quadratic validation');
        return validateQuadraticAnswer(userAnswer, problem, ce);
      }

      // Special handling for systems of equations - require ordered pair
      if (problem.problemType === 'systems-of-equations') {
        console.log('🔍 Using systems validation');
        return validateSystemsAnswer(userAnswer, problem, ce);
      }

      console.log('🔍 Using strict validation strategy');
      
      // Get the expected answer
      let expectedAnswer: string;
      if (problem.answerRHS !== undefined && problem.answerRHS !== null) {
        expectedAnswer = Array.isArray(problem.answerRHS) ? String(problem.answerRHS[0]) : String(problem.answerRHS);
      } else if (problem.answerLHS && problem.answer) {
        // For "solve for x" problems, use just the answer part, not the full equation
        expectedAnswer = Array.isArray(problem.answer) ? String(problem.answer[0]) : String(problem.answer);
      } else {
        expectedAnswer = Array.isArray(problem.answer) ? String(problem.answer[0]) : String(problem.answer);
      }

      console.log('🔍 Expected answer:', expectedAnswer);

      // Use the strict validation system
      const validationResult = validateAnswer(userAnswer, expectedAnswer);
      console.log('🔍 Strict validation result:', validationResult);

      const userTrimmed = userAnswer.trim();
      const expectedTrimmed = expectedAnswer.trim();

      if (validationResult.isCorrect) {
        console.log('✅ Answer is correct and in canonical form');
        return {
          isCorrect: true,
          userAnswerSimplified: userTrimmed,
          correctAnswerSimplified: expectedTrimmed
        };
      } else if (validationResult.needsFeedback) {
        console.log('🟡 Answer is mathematically correct but needs simplification');
        return {
          isCorrect: false,
          userAnswerSimplified: userTrimmed,
          correctAnswerSimplified: expectedTrimmed,
          errorMessage: validationResult.feedbackMessage || 'Please simplify your answer further.'
        };
      } else {
        console.log('❌ Answer is incorrect');
        return {
          isCorrect: false,
          userAnswerSimplified: userTrimmed,
          correctAnswerSimplified: expectedTrimmed
        };
      }

    } catch (error) {
      console.error('Error during answer verification:', error);
      
      // Ultimate fallback
      const userTrimmed = userAnswer.trim().toLowerCase();
      const expectedAnswer = problem.answerRHS !== undefined && problem.answerRHS !== null 
        ? (Array.isArray(problem.answerRHS) ? String(problem.answerRHS[0]) : String(problem.answerRHS))
        : (Array.isArray(problem.answer) ? String(problem.answer[0]) : String(problem.answer));
      const expectedTrimmed = expectedAnswer.trim().toLowerCase();

      const isCorrect = userTrimmed === expectedTrimmed;

      return {
        isCorrect,
        userAnswerSimplified: userAnswer.trim(),
        correctAnswerSimplified: expectedAnswer.trim(),
        errorMessage: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  };

  // Function to update only the problem content without rebuilding everything
  const updateProblemContent = () => {
    if (!containerRef.current || !isInitializedRef.current) return;

    const problemSection = containerRef.current.querySelector(`#${ELEMENT_IDS.PROBLEM_SECTION}`);
    if (!problemSection) return;

    // Clean up any existing listeners
    cleanupRetryButton();
    cleanupResponsiveFontSizing();

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

    // Always use equations array (clean and simple!)
    const equationsToDisplay = problem.equations;
    
    // Use first equation for responsive text calculation
    const responsiveSettings = calculateResponsiveFontSize(equationsToDisplay[0], problem.direction, 350, 'web');

    // Generate equation HTML for multiple equations
    const equationHTML = equationsToDisplay.map((equation, index) => {
      const equationWithBreaks = equation; // No line breaking
      return `
        <div class="equation-container-${index}" style="
          background: #111827;
          border-radius: 12px;
          padding: 9px;
          border: 2px solid #3b82f6;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          cursor: grab;
          user-select: none;
          ${index > 0 ? 'margin-top: 8px;' : ''}
        " role="math" aria-label="Problem equation ${index + 1}">
          <math-field
            readonly
            class="equation-mathfield-${index}"
            style="
              width: max-content;
              min-width: 100%;
              max-width: none;
              background: transparent;
              border: none;
              color: #ffffff;
              font-size: ${responsiveSettings.equationFontSize}px;
              min-height: auto;
              padding: 0;
              line-height: 1.3;
              word-wrap: normal;
              overflow-wrap: normal;
              white-space: nowrap;
              box-sizing: border-box;
              pointer-events: none;
            "
          >${equationWithBreaks}</math-field>
        </div>
      `;
    }).join('');

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
      ${equationHTML}
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

    // Set up smooth scrolling for equation containers
    cleanupResponsiveFontSizing();
    
    // Wait for DOM to update, then set up smooth scrolling
    setTimeout(() => {
      const equationContainers = problemSection.querySelectorAll('[class*="equation-container-"]');
      equationContainers.forEach((container) => {
        setupSmoothScrolling(container as HTMLElement);
      });
    }, 150); // Wait for MathLive to render
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
              /* Hide the virtual keyboard toggle button */
              math-field::part(virtual-keyboard-toggle) {
                display: none !important;
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
            mathField.removeExtraneousParentheses = false; // Keep braces in fractions

            // Configure custom virtual keyboard
            configureVirtualKeyboard(mathField);

            // Filter out unwanted menu items
            const filterMenuItem = (item: any): boolean => {
              // Filter out Compute Engine commands (items with IDs starting with 'ce-')
              if (item.id && item.id.startsWith('ce-')) {
                return false;
              }
              
              // Filter out other unwanted menu items by their IDs or labels
              if (item.id) {
                const unwantedIds = ['insert-matrix', 'insert', 'mode', 'font-style', 'evaluate', 'simplify', 'solve'];
                if (unwantedIds.includes(item.id.toLowerCase())) {
                  return false;
                }
              }
              
              if (item.label) {
                const unwantedLabels = ['insert matrix', 'insert', 'mode', 'font style', 'evaluate', 'simplify', 'solve'];
                const labelText = typeof item.label === 'string' ? item.label.toLowerCase() : '';
                if (unwantedLabels.some(unwanted => labelText.includes(unwanted))) {
                  return false;
                }
              }
              
              return true;
            };

            const filterMenuRecursively = (items: any[]): any[] => {
              return items.filter((item: any) => {
                // First check if this item should be filtered out
                if (!filterMenuItem(item)) {
                  return false;
                }
                
                // If it has a submenu, filter it recursively
                if (item.submenu && Array.isArray(item.submenu)) {
                  item.submenu = filterMenuRecursively(item.submenu);
                  // Keep the submenu item only if it still has content after filtering
                  return item.submenu.length > 0;
                }
                
                return true;
              });
            };

            mathField.menuItems = filterMenuRecursively(mathField.menuItems);


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
      cleanupResponsiveFontSizing();
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
                <div class="solution-container-${index}" style="
                  background: #0f172a;
                  border-radius: 8px;
                  padding: 16px;
                  border: 1px solid #374151;
                  width: 100%;
                  max-width: 100%;
                  box-sizing: border-box;
                  overflow-x: auto;
                  overflow-y: hidden;
                  scroll-behavior: smooth;
                  cursor: grab;
                  user-select: none;
                ">
                  <math-field
                    readonly
                    class="solution-step-${index}"
                    style="
                      width: max-content;
                      min-width: 100%;
                      max-width: none;
                      background: transparent;
                      border: none;
                      color: #ffffff;
                      font-size: 18px;
                      min-height: auto;
                      padding: 0;
                      box-sizing: border-box;
                      pointer-events: none;
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
          
          // Set up smooth scrolling for solution step containers
          setTimeout(() => {
            const solutionContainers = containerRef.current?.querySelectorAll('[class*="solution-container-"]');
            solutionContainers?.forEach((container) => {
              setupSmoothScrolling(container as HTMLElement);
            });
          }, 200); // Wait for MathLive to render the solution steps
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
