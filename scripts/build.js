#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Set environment variables
process.env.REACT_APP_VERSION = version;
// Prevent CI from treating warnings as errors (can be overridden by Vercel env vars)
if (!process.env.CI) {
  process.env.CI = 'false';
}

console.log(`Building with version: ${version}`);
console.log(`CI mode: ${process.env.CI}`);

try {
  execSync('react-scripts build', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: process.env
  });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

