#!/usr/bin/env ts-node
import { generateProblemBatch } from '../services/problemGeneration/batchGenerator';
import { uploadToS3 } from '../services/problemGeneration/s3Uploader';
import { logger } from '../utils/logger';

async function main() {
  try {
    logger.info('🔥 Starting daily problem generation (modular version)...');
    const batch = await generateProblemBatch();
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
