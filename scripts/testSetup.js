#!/usr/bin/env node

/**
 * Test script to validate Week 4 setup
 * Run with: node scripts/testSetup.js
 */

const fs = require('fs');
const https = require('https');

console.log('🧪 Testing Week 4 Setup...\n');

// Test 1: Check if required files exist
console.log('📁 Checking files...');
const requiredFiles = [
  '.github/workflows/generate-problems.yml',
  'scripts/generateProblems.js',
  'services/problemSyncService.ts',
  'env.example'
];

let filesOk = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - Missing!`);
    filesOk = false;
  }
}

// Test 2: Check environment variables
console.log('\n🔧 Checking environment...');
const requiredEnvVars = [
  'EXPO_PUBLIC_PROBLEMS_LATEST_URL'
];

let envOk = true;
for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`  ✅ ${envVar} is set`);
  } else {
    console.log(`  ⚠️  ${envVar} - Not set (will use defaults)`);
  }
}

// Test 3: Check package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const requiredDeps = [
    '@react-native-async-storage/async-storage',
    '@aws-sdk/client-s3',
    'openai',
    'mathjs'
  ];

  let depsOk = true;
  for (const dep of requiredDeps) {
    if (deps[dep]) {
      console.log(`  ✅ ${dep} v${deps[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - Not installed!`);
      depsOk = false;
    }
  }

  if (!depsOk) {
    console.log('\n  💡 Run: npm install @react-native-async-storage/async-storage @aws-sdk/client-s3 openai mathjs');
  }
} catch (error) {
  console.log('  ❌ Could not read package.json');
}

// Test 4: Test S3 URL if provided
console.log('\n🌐 Testing S3 connection...');
const s3Url = process.env.EXPO_PUBLIC_PROBLEMS_LATEST_URL;
if (s3Url && s3Url !== '') {
  console.log(`  Testing: ${s3Url}`);

  const urlObj = new URL(s3Url);
  const options = {
    hostname: urlObj.hostname,
    port: 443,
    path: urlObj.pathname,
    method: 'HEAD',
    timeout: 5000
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 200 || res.statusCode === 404) {
      if (res.statusCode === 200) {
        console.log('  ✅ S3 URL is reachable (latest.json exists)');
      } else {
        console.log('  ⚠️  S3 URL is reachable but latest.json not found yet');
        console.log('      This is normal before first GitHub Action runs');
      }
    } else {
      console.log(`  ❌ S3 URL returned status: ${res.statusCode}`);
    }
  });

  req.on('error', (error) => {
    console.log(`  ❌ S3 URL connection failed: ${error.message}`);
  });

  req.on('timeout', () => {
    console.log('  ❌ S3 URL connection timed out');
    req.destroy();
  });

  req.end();
} else {
  console.log('  ⚠️  EXPO_PUBLIC_PROBLEMS_LATEST_URL not set');
  console.log('     Set this after creating your S3 bucket');
}

// Summary
console.log('\n📋 Setup Summary:');
console.log('  1. Install dependencies if any are missing');
console.log('  2. Copy env.example to .env and fill in your values');
console.log('  3. Set up GitHub repository secrets');
console.log('  4. Test by running the GitHub Action manually');
console.log('\n📖 See WEEK4_SETUP.md for detailed instructions');

console.log('\n✨ Setup test complete!');

// Exit with appropriate code
if (!filesOk) {
  console.log('\n❌ Some required files are missing. Re-run the setup.');
  process.exit(1);
}
