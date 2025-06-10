#!/usr/bin/env node

require('ts-node/register');
const { isAnswerCorrect } = require('../utils/enhancedAnswerUtils');

/**
 * Test the improved answer validation
 */
async function testValidation() {
  console.log('🧪 Testing improved answer validation...\n');

  const testCases = [
    // Basic numerical comparisons
    { userAnswer: '5', correctAnswer: 5, expected: true },
    { userAnswer: '5.0', correctAnswer: 5, expected: true },
    { userAnswer: '10/2', correctAnswer: 5, expected: true },
    { userAnswer: '3+2', correctAnswer: 5, expected: true },
    { userAnswer: '6', correctAnswer: 5, expected: false },

    // Array answers (quadratic solutions)
    { userAnswer: '3', correctAnswer: [3, -2], expected: true },
    { userAnswer: '-2', correctAnswer: [3, -2], expected: true },
    { userAnswer: '4', correctAnswer: [3, -2], expected: false },

    // Basic algebraic expressions
    { userAnswer: '2*x', correctAnswer: '2x', expected: true },
    { userAnswer: 'x*2', correctAnswer: '2x', expected: true },
    { userAnswer: '2x', correctAnswer: '2*x', expected: true },

    // Fractions
    { userAnswer: '1/2', correctAnswer: 0.5, expected: true },
    { userAnswer: '0.5', correctAnswer: '1/2', expected: true },

        // Error cases that should fail gracefully
    { userAnswer: '', correctAnswer: 5, expected: false },
    { userAnswer: 'invalid', correctAnswer: 5, expected: false },

    // Fractional string answers (new format to fix the bug)
    { userAnswer: '-7/2', correctAnswer: ['-7/2', '5/3'], expected: true },
    { userAnswer: '5/3', correctAnswer: ['-7/2', '5/3'], expected: true },
    { userAnswer: '-3.5', correctAnswer: ['-7/2', '5/3'], expected: true },

    // Integer string answers (ensuring consistency)
    { userAnswer: '3', correctAnswer: ['3', '-2'], expected: true },
    { userAnswer: '-2', correctAnswer: ['3', '-2'], expected: true },
    { userAnswer: '4', correctAnswer: ['3', '-2'], expected: false },

    // Linear answers as strings (new consistent format)
    { userAnswer: '5', correctAnswer: '5', expected: true },
    { userAnswer: '1/2', correctAnswer: '1/2', expected: true },
    { userAnswer: '0.5', correctAnswer: '1/2', expected: true }, // Should work with string fractions
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const result = await isAnswerCorrect(testCase.userAnswer, testCase.correctAnswer);
      const success = result === testCase.expected;

      if (success) {
        console.log(`✅ "${testCase.userAnswer}" vs ${JSON.stringify(testCase.correctAnswer)} = ${result}`);
        passed++;
      } else {
        console.log(`❌ "${testCase.userAnswer}" vs ${JSON.stringify(testCase.correctAnswer)} = ${result} (expected ${testCase.expected})`);
        failed++;
      }
    } catch (error) {
      console.log(`💥 "${testCase.userAnswer}" vs ${JSON.stringify(testCase.correctAnswer)} threw error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('🎉 All validation tests passed!');
  } else {
    console.log('⚠️ Some validation tests failed - review the logic');
  }
}

// Run if called directly
if (require.main === module) {
  testValidation().catch(console.error);
}

module.exports = { testValidation };
