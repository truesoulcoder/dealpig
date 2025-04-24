#!/usr/bin/env node

/**
 * DealPig deployment script
 * This script automates the deployment process to Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const ENVIRONMENTS = {
  production: 'production',
  staging: 'staging',
  development: 'development'
};

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args[0] || ENVIRONMENTS.production;

if (!Object.values(ENVIRONMENTS).includes(environment)) {
  console.error(`Invalid environment: ${environment}`);
  console.error(`Valid environments are: ${Object.values(ENVIRONMENTS).join(', ')}`);
  process.exit(1);
}

console.log(`Starting deployment to ${environment} environment...`);

// Check if git is clean
try {
  const status = execSync('git status --porcelain').toString().trim();
  if (status) {
    console.warn('\nWarning: You have uncommitted changes:');
    console.warn(status);
    console.warn('\nThese changes will not be included in the deployment.\n');
  }
} catch (error) {
  console.error('Error checking git status:', error.message);
  process.exit(1);
}

// Run tests
console.log('\n📋 Running tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
} catch (error) {
  console.error('\n❌ Tests failed. Fix the tests before deploying.');
  process.exit(1);
}

// Build the application
console.log('\n🔨 Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}

// Deploy to Vercel
console.log('\n🚀 Deploying to Vercel...');
try {
  const deployCommand = environment === ENVIRONMENTS.production
    ? 'vercel --prod'
    : `vercel --env NEXT_PUBLIC_ENVIRONMENT=${environment}`;
  
  execSync(deployCommand, { stdio: 'inherit' });
  console.log('\n✅ Deployment completed successfully!');
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}

// Create a new directory for the scripts if it doesn't exist
function ensureScriptsDirExists() {
  const scriptsDir = path.join(process.cwd(), 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
    console.log('Created scripts directory');
  }
}

// Main execution
ensureScriptsDirExists();