#!/usr/bin/env ts-node
import { generateProblemBatch } from '../services/problemGeneration/batchGenerator';
import { uploadToS3 } from '../services/problemGeneration/s3Uploader';
import { logger } from '../utils/logger';

async function main() {
  try {
    logger.info('🔥 Starting daily problem generation (modular version)...');
    console.log('🛠️ Environment check:');
    console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`  PROBLEMS_PER_BATCH: ${process.env.PROBLEMS_PER_BATCH || '5 (default)'}`);

    console.log('📦 Generating problem batch...');
    const batch = await generateProblemBatch();

    console.log(`🎯 Batch generation completed:`);
    console.log(`  Batch ID: ${batch.id}`);
    console.log(`  Target: ${batch.targetCount} problems`);
    console.log(`  Generated: ${batch.problemCount} problems`);

    if (batch.problemCount === 0) {
      logger.error('❌ No problems were generated! Check the logs above for errors.');
      process.exit(1);
    }

    console.log('☁️ Uploading to S3...');
    const latestUrl = await uploadToS3(batch);

    logger.info('✅ Problem generation complete!');
    logger.info(`📦 Batch ID: ${batch.id}`);
    logger.info(`📄 Problems generated: ${batch.problemCount}`);
    logger.info(`🌐 Latest URL: ${latestUrl}`);
  } catch (e) {
    logger.error('❌ Problem generation failed', e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

if (require.main === module) {
  // ts-node CLI entry
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
