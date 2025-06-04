#!/usr/bin/env node

const { OpenAI } = require('openai');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const fs = require('fs');

// Configuration
const PROBLEMS_PER_BATCH = 20;
const TARGET_DIFFICULTY_MIX = {
  easy: 40,    // 40% of total batch
  medium: 40,  // 40% of total batch
  hard: 20     // 20% of total batch
};

const PROBLEM_TYPES = [
  'linear-one-variable',
  'linear-two-variables',
  'quadratic-factoring',
  'quadratic-formula',
  'polynomial-simplification'
];

// Initialize services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Calculate exact problem counts for each difficulty level
 */
function calculateProblemCounts() {
  const totalPercentage = Object.values(TARGET_DIFFICULTY_MIX).reduce((sum, val) => sum + val, 0);

  const counts = {};
  let remaining = PROBLEMS_PER_BATCH;

  // Calculate exact counts, ensuring we hit the target total
  Object.entries(TARGET_DIFFICULTY_MIX).forEach(([difficulty, percentage], index, entries) => {
    if (index === entries.length - 1) {
      // Last difficulty gets whatever remains to ensure exact total
      counts[difficulty] = remaining;
    } else {
      const count = Math.round((percentage / totalPercentage) * PROBLEMS_PER_BATCH);
      counts[difficulty] = count;
      remaining -= count;
    }
  });

  return counts;
}

/**
 * Generate problems using OpenAI
 */
async function generateProblemsWithAI(problemType, difficulty, count) {
  console.log(`Generating ${count} ${difficulty} ${problemType} problems...`);

  const prompt = `Generate exactly ${count} ${difficulty} algebra problems of type "${problemType}".

For each problem, provide:
1. equation: The problem to solve (e.g., "3x + 5 = 14")
2. answer: The numerical answer
3. solutionSteps: Array of step-by-step solution strings

Format as JSON array:
[
  {
    "equation": "3x + 5 = 14",
    "answer": 3,
    "solutionSteps": [
      "Start with: 3x + 5 = 14",
      "Subtract 5 from both sides: 3x = 9",
      "Divide both sides by 3: x = 3"
    ]
  }
]

Constraints:
- ${difficulty} difficulty means: ${getDifficultyDescription(difficulty)}
- Answers should be integers or simple fractions when possible
- Solution steps should be clear and educational
- Each problem should be unique`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model
      messages: [
        {
          role: 'system',
          content: 'You are a math teacher creating algebra problems. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8 // Some variety in problems
    });

    const content = response.choices[0].message.content.trim();
    const problems = JSON.parse(content);

    // Validate the problems
    return problems.map((problem, index) => {
      if (!problem.equation || !problem.answer || !problem.solutionSteps) {
        throw new Error(`Problem ${index} missing required fields`);
      }

      return {
        equation: problem.equation,
        answer: problem.answer,
        solutionSteps: Array.isArray(problem.solutionSteps) ? problem.solutionSteps : [problem.solutionSteps],
        difficulty,
        problemType,
        isCompleted: false
      };
    });

  } catch (error) {
    console.error(`Error generating ${problemType} problems:`, error);
    throw error;
  }
}

/**
 * Get difficulty description for prompts
 */
function getDifficultyDescription(difficulty) {
  switch (difficulty) {
    case 'easy': return 'simple equations with single operations, small numbers';
    case 'medium': return 'multi-step equations, some fractions or decimals';
    case 'hard': return 'complex equations, multiple variables, or advanced concepts';
    default: return 'moderate complexity';
  }
}

/**
 * Generate a complete batch of problems
 */
async function generateProblemBatch() {
  console.log('Starting problem generation...');

  const allProblems = [];
  const batchId = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Calculate exact problem counts for each difficulty
  const difficultyCounts = calculateProblemCounts();
  console.log('Target difficulty distribution:', difficultyCounts);

  // Generate problems for each difficulty level
  for (const [difficulty, totalCount] of Object.entries(difficultyCounts)) {
    if (totalCount === 0) continue;

    // Distribute problems across types, ensuring we get exactly the right total
    const problemsPerType = Math.floor(totalCount / PROBLEM_TYPES.length);
    const extraProblems = totalCount % PROBLEM_TYPES.length;

    for (let i = 0; i < PROBLEM_TYPES.length; i++) {
      const problemType = PROBLEM_TYPES[i];
      // Give extra problems to the first few types if needed
      const count = problemsPerType + (i < extraProblems ? 1 : 0);

      if (count > 0) {
        try {
          const problems = await generateProblemsWithAI(problemType, difficulty, count);
          allProblems.push(...problems);

          // Small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to generate ${problemType} ${difficulty} problems:`, error);
          // Continue with other types rather than failing completely
        }
      }
    }
  }

  // Shuffle the problems to mix types and difficulties
  const shuffledProblems = allProblems
    .sort(() => Math.random() - 0.5)
    .map((problem, index) => ({
      ...problem,
      id: crypto.randomUUID(),
      batchId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

  const batch = {
    id: batchId,
    generationDate: new Date().toISOString(),
    problemCount: shuffledProblems.length,
    problems: shuffledProblems
  };

  console.log(`Generated ${shuffledProblems.length} problems for batch ${batchId}`);

  // Log the actual difficulty distribution
  const actualDistribution = {};
  shuffledProblems.forEach(problem => {
    actualDistribution[problem.difficulty] = (actualDistribution[problem.difficulty] || 0) + 1;
  });
  console.log('Actual difficulty distribution:', actualDistribution);

  return batch;
}

/**
 * Upload batch to S3
 */
async function uploadToS3(batch) {
  const bucketName = process.env.S3_BUCKET_NAME;

  // Upload the full batch
  const batchKey = `problems/${batch.id}.json`;
  const batchContent = JSON.stringify(batch, null, 2);

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: batchKey,
    Body: batchContent,
    ContentType: 'application/json'
  }));

  console.log(`Uploaded batch to s3://${bucketName}/${batchKey}`);

  // Update the latest.json pointer
  const latestContent = JSON.stringify({
    batchId: batch.id,
    url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${batchKey}`,
    hash: crypto.createHash('sha256').update(batchContent).digest('hex'),
    generatedAt: batch.generationDate,
    problemCount: batch.problemCount
  }, null, 2);

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: 'latest.json',
    Body: latestContent,
    ContentType: 'application/json'
  }));

  console.log(`Updated latest.json pointer`);
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/latest.json`;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔥 Starting daily problem generation...');

    // Generate problems
    const batch = await generateProblemBatch();

    // Upload to S3
    const latestUrl = await uploadToS3(batch);

    console.log('✅ Problem generation complete!');
    console.log(`📦 Batch ID: ${batch.id}`);
    console.log(`📄 Problems generated: ${batch.problemCount}`);
    console.log(`🌐 Latest URL: ${latestUrl}`);

  } catch (error) {
    console.error('❌ Problem generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateProblemBatch, uploadToS3 };
