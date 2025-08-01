/**
 * Testing script for answer validation system
 * This script simulates the validation process to test for false positives and false negatives
 */

interface SolutionStep {
  explanation: string;
  mathExpression: string;
  isEquation: boolean;
}

interface Problem {
  id: string;
  equations: string[];
  direction: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answer: string | number | number[];
  answerLHS?: string;
  answerRHS?: string | number | number[];
  solutionSteps: SolutionStep[];
  problemType: string;
}

interface VerificationResult {
  isCorrect: boolean;
  userAnswerSimplified: string;
  correctAnswerSimplified: string;
  errorMessage?: string;
}

// Test cases covering various scenarios
const testCases = [
  // Basic integer answers
  {
    name: "Integer answer - exact match",
    problem: {
      id: "test1",
      equations: ["2x + 5 = 13"],
      direction: "Solve for x",
      difficulty: "easy" as const,
      answer: 4,
      answerRHS: 4,
      solutionSteps: [],
      problemType: "linear-one-variable"
    },
    userInputs: ["4", " 4 ", "4.0"],
    expectedResults: [true, true, false] // 4.0 should be false for exact integer
  },

  // Fraction answers - the problematic case
  {
    name: "Fraction answer - MathLive formatting issue",
    problem: {
      id: "test2",
      equations: ["-3/4x^2 + 4x - 2"],
      direction: "Simplify the expression",
      difficulty: "medium" as const,
      answer: "-3/4x^2+4x-2",
      answerRHS: "-3/4x^2+4x-2",
      solutionSteps: [],
      problemType: "polynomial-simplification"
    },
    userInputs: ["-\\frac34x^2+4x-2", "-\\frac{3}{4}x^{2}+4x-2", "-3/4x^2+4x-2"],
    expectedResults: [true, true, true] // All should be equivalent
  },

  // Quadratic with two distinct roots
  {
    name: "Quadratic - distinct roots",
    problem: {
      id: "test3",
      equations: ["x^2 - 5x + 6 = 0"],
      direction: "Solve using completing the square",
      difficulty: "medium" as const,
      answer: [2, 3],
      answerRHS: [2, 3],
      solutionSteps: [],
      problemType: "quadratic-completing-square"
    },
    userInputs: ["2, 3", "3, 2", "2,3", " 2 , 3 ", "2"],
    expectedResults: [true, true, true, true, false] // Order shouldn't matter, but need both answers
  },

  // Quadratic with double root
  {
    name: "Quadratic - double root",
    problem: {
      id: "test4",
      equations: ["x^2 - 6x + 9 = 0"],
      direction: "Solve using completing the square",
      difficulty: "medium" as const,
      answer: 3,
      answerRHS: 3,
      solutionSteps: [],
      problemType: "quadratic-completing-square"
    },
    userInputs: ["3", "3, 3", " 3 ", "3.0"],
    expectedResults: [true, true, true, false] // Single or double entry OK, but not 3.0
  },

  // Systems of equations
  {
    name: "Systems - ordered pair",
    problem: {
      id: "test5",
      equations: ["2x + y = 7", "x - y = 2"],
      direction: "Solve the system of equations",
      difficulty: "medium" as const,
      answer: [3, 1],
      answerRHS: [3, 1],
      solutionSteps: [],
      problemType: "systems-of-equations"
    },
    userInputs: ["3, 1", "(3, 1)", "1, 3", " 3 , 1 "],
    expectedResults: [true, true, false, true] // Order matters for systems
  },

  // Variable expressions with fractions
  {
    name: "Expression with fractions and variables",
    problem: {
      id: "test6",
      equations: ["Simplify: (2x + 1)/3 + x/2"],
      direction: "Simplify the expression",
      difficulty: "hard" as const,
      answer: "(7x + 2)/6",
      answerRHS: "(7x + 2)/6",
      solutionSteps: [],
      problemType: "polynomial-simplification"
    },
    userInputs: ["(7x + 2)/6", "\\frac{7x + 2}{6}", "(7x+2)/6", "(2 + 7x)/6"],
    expectedResults: [true, true, true, false] // Last one has wrong order
  }
];

// Helper function to normalize LaTeX expressions for comparison (same as in component)
function normalizeLatexExpression(expression: string): string {
  return expression
    .toLowerCase()
    .replace(/\s+/g, '') // Remove all whitespace
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2') // Convert \frac{a}{b} to a/b
    .replace(/\\frac(\d+)(\d+)/g, '$1/$2') // Convert \frac34 to 3/4
    .replace(/\\frac\{([^}]+)\}/g, (match, content) => {
      // Handle cases like \frac{7x + 2}{6} where only numerator has braces
      const parts = content.split('}{');
      if (parts.length === 2) {
        return `${parts[0]}/${parts[1]}`;
      }
      return content;
    })
    .replace(/\{([^}]*)\}/g, '$1') // Remove braces around single terms
    .replace(/\^{(\d+)}/g, '^$1') // Simplify exponents
    .replace(/\\\\/g, '') // Remove escape characters
    .replace(/\\([a-z]+)/g, '') // Remove other LaTeX commands
    .trim();
}

// Simplified validation functions (extracted from the component)
function validateQuadraticAnswer(userAnswer: string, problem: Problem, ce: any): VerificationResult {
  console.log('🔍 validateQuadraticAnswer called with:', userAnswer);

  const userAnswers = userAnswer.split(',').map(ans => ans.trim()).filter(ans => ans.length > 0);
  console.log('🔍 userAnswers:', userAnswers);

  let correctAnswers: string[] = [];
  let isDoubleRoot = false;
  
  if (problem.answerRHS !== undefined && problem.answerRHS !== null) {
    if (Array.isArray(problem.answerRHS)) {
      correctAnswers = problem.answerRHS.map(ans => String(ans));
    } else {
      correctAnswers = [String(problem.answerRHS)];
      isDoubleRoot = true;
    }
  } else if (problem.answer !== undefined && problem.answer !== null) {
    if (Array.isArray(problem.answer)) {
      correctAnswers = problem.answer.map(ans => String(ans));
    } else {
      correctAnswers = [String(problem.answer)];
      isDoubleRoot = true;
    }
  } else {
    return {
      isCorrect: false,
      userAnswerSimplified: userAnswer.trim(),
      correctAnswerSimplified: 'Invalid answer format',
      errorMessage: 'Problem does not have valid solutions'
    };
  }

  // Check if it's a double root (two identical solutions)
  if (!isDoubleRoot && correctAnswers.length === 2) {
    const normalizedCorrect = correctAnswers.map(ans => String(ans).toLowerCase().replace(/\s+/g, ''));
    isDoubleRoot = normalizedCorrect[0] === normalizedCorrect[1];
  }

  // Validate user input based on whether it's a double root or not
  if (isDoubleRoot) {
    if (userAnswers.length === 1) {
      // Single answer is fine for double roots
    } else if (userAnswers.length === 2) {
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
    if (userAnswers.length !== 2) {
      return {
        isCorrect: false,
        userAnswerSimplified: userAnswer.trim(),
        correctAnswerSimplified: 'Both solutions required (e.g., "3, -2")',
        errorMessage: 'Please provide both solutions separated by a comma'
      };
    }
  }

  // Validation logic
  if (isDoubleRoot) {
    const correctAnswer = correctAnswers[0];
    const userAnswerToCheck = userAnswers[0];
    
    // Direct comparison
    if (userAnswerToCheck.trim() === correctAnswer.trim()) {
      return {
        isCorrect: true,
        userAnswerSimplified: userAnswerToCheck.trim(),
        correctAnswerSimplified: correctAnswer
      };
    }

    // Normalized comparison
    const normalizedUser = userAnswerToCheck.toLowerCase().replace(/\s+/g, '');
    const normalizedCorrect = correctAnswer.toLowerCase().replace(/\s+/g, '');
    const isCorrect = normalizedUser === normalizedCorrect;
    
    return {
      isCorrect,
      userAnswerSimplified: userAnswerToCheck.trim(),
      correctAnswerSimplified: correctAnswer,
      errorMessage: isCorrect ? undefined : 'Double root answer is incorrect'
    };
  } else {
    // For distinct roots
    const userSet = new Set(userAnswers.map(ans => ans.trim()));
    const correctSet = new Set(correctAnswers.map(ans => String(ans).trim()));
    
    if (userSet.size === correctSet.size && [...userSet].every(ans => correctSet.has(ans))) {
      return {
        isCorrect: true,
        userAnswerSimplified: userAnswers.join(', '),
        correctAnswerSimplified: correctAnswers.join(', ')
      };
    }

    // Normalized comparison
    const userNormalizedSet = new Set(userAnswers.map(ans => ans.toLowerCase().replace(/\s+/g, '')));
    const correctNormalizedSet = new Set(correctAnswers.map(ans => String(ans).toLowerCase().replace(/\s+/g, '')));

    const isCorrect = userNormalizedSet.size === correctNormalizedSet.size &&
                     [...userNormalizedSet].every(ans => correctNormalizedSet.has(ans));

    return {
      isCorrect,
      userAnswerSimplified: userAnswers.join(', '),
      correctAnswerSimplified: correctAnswers.join(', '),
      errorMessage: isCorrect ? undefined : 'Both solutions must be correct (order doesn\'t matter)'
    };
  }
}

function validateSystemsAnswer(userAnswer: string, problem: Problem, ce: any): VerificationResult {
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

  // Direct comparison
  if (userAnswers[0].trim() === correctAnswers[0].trim() && 
      userAnswers[1].trim() === correctAnswers[1].trim()) {
    return {
      isCorrect: true,
      userAnswerSimplified: `(${userAnswers[0]}, ${userAnswers[1]})`,
      correctAnswerSimplified: `(${correctAnswers[0]}, ${correctAnswers[1]})`
    };
  }

  // Normalized comparison
  const userNormalized = userAnswers.map(ans => ans.toLowerCase().replace(/\s+/g, ''));
  const correctNormalized = correctAnswers.map(ans => String(ans).toLowerCase().replace(/\s+/g, ''));

  const isCorrect = userNormalized[0] === correctNormalized[0] &&
                   userNormalized[1] === correctNormalized[1];

  return {
    isCorrect,
    userAnswerSimplified: `(${userAnswers[0]}, ${userAnswers[1]})`,
    correctAnswerSimplified: `(${correctAnswers[0]}, ${correctAnswers[1]})`,
    errorMessage: isCorrect ? undefined : 'Order matters: first value is x, second is y'
  };
}

function verifyAnswer(userAnswer: string, problem: Problem): VerificationResult {
  // No compute engine in testing - we'll test the normalization logic directly
  const ce = null;

  if (problem.problemType === 'quadratic-completing-square') {
    return validateQuadraticAnswer(userAnswer, problem, ce);
  }

  if (problem.problemType === 'systems-of-equations') {
    return validateSystemsAnswer(userAnswer, problem, ce);
  }

  // Standard validation strategy
  let expectedAnswer: string;
  if (problem.answerRHS !== undefined && problem.answerRHS !== null) {
    expectedAnswer = Array.isArray(problem.answerRHS) ? String(problem.answerRHS[0]) : String(problem.answerRHS);
  } else if (problem.answerLHS && problem.answer) {
    expectedAnswer = Array.isArray(problem.answer) ? String(problem.answer[0]) : String(problem.answer);
  } else {
    expectedAnswer = Array.isArray(problem.answer) ? String(problem.answer[0]) : String(problem.answer);
  }

  // Direct comparison
  const userTrimmed = userAnswer.trim();
  const expectedTrimmed = expectedAnswer.trim();
  
  if (userTrimmed === expectedTrimmed) {
    return {
      isCorrect: true,
      userAnswerSimplified: userTrimmed,
      correctAnswerSimplified: expectedTrimmed
    };
  }

  // Advanced normalization for LaTeX expressions
  const userNormalized = normalizeLatexExpression(userAnswer);
  const expectedNormalized = normalizeLatexExpression(expectedAnswer);

  const isCorrect = userNormalized === expectedNormalized;

  return {
    isCorrect,
    userAnswerSimplified: userTrimmed,
    correctAnswerSimplified: expectedTrimmed
  };
}

// Run tests
function runTests() {
  console.log('🧪 Running Answer Validation Tests\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests: string[] = [];

  testCases.forEach(testCase => {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`Problem: ${testCase.problem.equations[0]}`);
    console.log(`Expected answer: ${JSON.stringify(testCase.problem.answerRHS || testCase.problem.answer)}`);
    
    testCase.userInputs.forEach((userInput, index) => {
      totalTests++;
      const result = verifyAnswer(userInput, testCase.problem);
      const expected = testCase.expectedResults[index];
      
      const passed = result.isCorrect === expected;
      if (passed) {
        passedTests++;
        console.log(`  ✅ "${userInput}" -> ${result.isCorrect} (expected ${expected})`);
      } else {
        const failureDescription = `${testCase.name}: "${userInput}" -> ${result.isCorrect} (expected ${expected})`;
        failedTests.push(failureDescription);
        console.log(`  ❌ "${userInput}" -> ${result.isCorrect} (expected ${expected})`);
        if (result.errorMessage) {
          console.log(`     Error: ${result.errorMessage}`);
        }
      }
    });
  });

  console.log('\n📊 Test Results Summary:');
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(failure => console.log(`  - ${failure}`));
  }

  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    successRate: (passedTests / totalTests) * 100
  };
}

// Export for use in other modules
export { runTests, verifyAnswer, testCases };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}