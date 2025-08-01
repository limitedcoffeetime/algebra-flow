#!/usr/bin/env ts-node
import { logger } from '../utils/logger';
import { uploadToS3 } from '../services/problemGeneration/s3Uploader';
import { PROBLEM_TYPES } from '../services/problemGeneration/constants';
import { generateProblemsWithAI, GeneratedProblem } from '../services/problemGeneration/openaiGenerator';
import crypto from 'crypto';

interface TestProblemBatch {
  id: string;
  generationDate: Date;
  problemCount: number;
  problems: GeneratedProblem[];
  targetCount: number;
  generationStats: {
    attempted: number;
    successful: number;
    failed: number;
    failedTypes: string[];
  };
}

async function generateTestBatch(): Promise<TestProblemBatch> {
  const allProblems: GeneratedProblem[] = [];
  const difficulty = 'medium'; // All problems at medium difficulty
  
  const now = new Date();
  const batchId = `test-${now.toISOString().split('T')[0]}-${now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '')}-${Math.random().toString(36).substring(2, 6)}`;

  const generationStats = { attempted: 0, successful: 0, failed: 0, failedTypes: [] as string[] };

  logger.info('🧪 Generating test batch: 1 problem of each type at medium difficulty');
  logger.info(`📋 Problem types: ${PROBLEM_TYPES.join(', ')}`);

  // Generate exactly 1 problem of each type
  for (const problemType of PROBLEM_TYPES) {
    generationStats.attempted += 1;
    try {
      logger.info(`🚀 Generating 1 ${difficulty} ${problemType} problem...`);
      const problems = await generateProblemsWithAI(problemType, difficulty, 1);
      logger.info(`✅ Successfully generated ${problems.length} ${difficulty} ${problemType} problem`);
      allProblems.push(...problems);
      generationStats.successful += problems.length;
    } catch (e) {
      logger.error(`❌ Failed to generate ${problemType} ${difficulty} problem:`, e);
      generationStats.failed += 1;
      generationStats.failedTypes.push(`${problemType}-${difficulty}`);
    }
  }

  // Add metadata to each problem
  const finalProblems = allProblems.map((p) => ({
    ...p,
    id: crypto.randomUUID(),
    batchId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  logger.info(`📊 Test Generation Statistics:`);
  logger.info(`  Attempted: ${generationStats.attempted} problems`);
  logger.info(`  Successful: ${generationStats.successful} problems`);
  logger.info(`  Failed: ${generationStats.failed} problems`);
  if (generationStats.failedTypes.length > 0) {
    logger.info(`  Failed types: ${generationStats.failedTypes.join(', ')}`);
  }
  logger.info(`🎯 Test batch: ${finalProblems.length} problems ready for testing`);

  return {
    id: batchId,
    generationDate: now,
    problemCount: finalProblems.length,
    targetCount: PROBLEM_TYPES.length,
    problems: finalProblems,
    generationStats,
  };
}

async function main() {
  try {
    logger.info('🧪 Starting test problem generation...');
    logger.info('🛠️ Environment check:');
    logger.info(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    logger.info(`  TARGET: 1 problem of each type (${PROBLEM_TYPES.length} total)`);
    logger.info(`  DIFFICULTY: medium`);

    logger.info('📦 Generating test problem batch...');
    const batch = await generateTestBatch();

    logger.info(`🎯 Test batch generation completed:`);
    logger.info(`  Batch ID: ${batch.id}`);
    logger.info(`  Target: ${batch.targetCount} problems (1 of each type)`);
    logger.info(`  Generated: ${batch.problemCount} problems`);

    if (batch.problemCount === 0) {
      logger.error('❌ No problems were generated! Check the logs above for errors.');
      process.exit(1);
    }

    logger.info('☁️ Uploading test batch to S3...');
    const latestUrl = await uploadToS3(batch);

    logger.info('✅ Test problem generation complete!');
    logger.info(`📦 Batch ID: ${batch.id}`);
    logger.info(`📄 Problems generated: ${batch.problemCount}`);
    logger.info(`🌐 Latest URL: ${latestUrl}`);
    logger.info('🧪 Ready for testing each problem type!');
  } catch (e) {
    logger.error('❌ Test problem generation failed', e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}