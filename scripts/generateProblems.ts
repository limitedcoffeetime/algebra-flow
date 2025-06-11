#!/usr/bin/env ts-node
import { generateProblemBatch } from '../services/problemGeneration/batchGenerator';
import { uploadToS3 } from '../services/problemGeneration/s3Uploader';
import { logger } from '../utils/logger';

async function main() {
  try {
    logger.info('🔥 Starting daily problem generation (modular version)...');
    logger.info('🛠️ Environment check:');
    logger.info(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    logger.info(`  PROBLEMS_PER_BATCH: ${process.env.PROBLEMS_PER_BATCH || '5 (default)'}`);

    logger.info('📦 Generating problem batch...');
    const batch = await generateProblemBatch();

    logger.info(`🎯 Batch generation completed:`);
    logger.info(`  Batch ID: ${batch.id}`);
    logger.info(`  Target: ${batch.targetCount} problems`);
    logger.info(`  Generated: ${batch.problemCount} problems`);

    if (batch.problemCount === 0) {
      logger.error('❌ No problems were generated! Check the logs above for errors.');
      process.exit(1);
    }

    logger.info('☁️ Uploading to S3...');
    const latestUrl = await uploadToS3(batch);

    logger.info('✅ Problem generation complete!');
    logger.info(`📦 Batch ID: ${batch.id}`);
    logger.info(`📄 Problems generated: ${batch.problemCount}`);
    logger.info(`🌐 Latest URL: ${latestUrl}`);
  } catch (e) {
    logger.error('❌ Problem generation failed', e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
