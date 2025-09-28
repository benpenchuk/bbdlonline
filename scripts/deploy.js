#!/usr/bin/env node
const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function execCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function getCurrentVersion() {
  try {
    const version = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    return version.replace('v', '');
  } catch (error) {
    return '0.0.0';
  }
}

function incrementVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return currentVersion;
  }
}

async function deploy() {
  const deployType = process.argv[2];
  const customVersion = process.argv[3];
  const customMessage = process.argv[4];
  
  if (!deployType || !['patch', 'minor', 'major', 'custom'].includes(deployType)) {
    console.log('❌ Usage: npm run deploy:<patch|minor|major> or npm run deploy:custom -- v1.2.0 "Release notes"');
    process.exit(1);
  }

  console.log('🚀 BBDL Deployment Tool\n');

  // Get current version
  const currentVersion = getCurrentVersion();
  console.log(`📋 Current version: v${currentVersion}`);

  // Calculate new version
  let newVersion;
  if (deployType === 'custom') {
    if (!customVersion) {
      const input = await question('Enter new version (e.g., v1.2.0): ');
      newVersion = input.replace('v', '');
    } else {
      newVersion = customVersion.replace('v', '');
    }
  } else {
    newVersion = incrementVersion(currentVersion, deployType);
  }

  console.log(`🆕 New version: v${newVersion}`);

  // Get release notes
  let releaseNotes;
  if (customMessage) {
    releaseNotes = customMessage;
  } else {
    releaseNotes = await question('\n📝 Enter release notes (what changed?): ');
  }

  // Confirm deployment
  console.log('\n📋 Deployment Summary:');
  console.log(`   Version: v${currentVersion} → v${newVersion}`);
  console.log(`   Type: ${deployType.toUpperCase()}`);
  console.log(`   Notes: ${releaseNotes}`);
  
  const confirm = await question('\n❓ Continue with deployment? (y/N): ');
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('❌ Deployment cancelled');
    process.exit(0);
  }

  console.log('\n🏗️  Starting deployment process...');

  // Step 1: Check for uncommitted changes
  try {
    execSync('git diff --quiet && git diff --cached --quiet');
  } catch (error) {
    const commitChanges = await question('\n⚠️  You have uncommitted changes. Commit them now? (y/N): ');
    if (commitChanges.toLowerCase() === 'y' || commitChanges.toLowerCase() === 'yes') {
      const commitMessage = await question('Enter commit message: ');
      if (!execCommand('git add .', 'Adding changes')) process.exit(1);
      if (!execCommand(`git commit -m "${commitMessage}"`, 'Committing changes')) process.exit(1);
    } else {
      console.log('❌ Please commit or stash your changes first');
      process.exit(1);
    }
  }

  // Step 2: Build the application
  if (!execCommand('npm run build', 'Building application')) process.exit(1);

  // Step 3: Update package.json version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json version');

  // Step 4: Commit version update
  if (!execCommand('git add package.json', 'Adding package.json')) process.exit(1);
  if (!execCommand(`git commit -m "chore: bump version to v${newVersion}"`, 'Committing version update')) process.exit(1);

  // Step 5: Create git tag with release notes
  const tagMessage = `Version v${newVersion} - ${releaseNotes}`;
  if (!execCommand(`git tag -a v${newVersion} -m "${tagMessage}"`, 'Creating git tag')) process.exit(1);

  // Step 6: Push to GitHub
  if (!execCommand('git push origin main', 'Pushing to main branch')) process.exit(1);
  if (!execCommand(`git push origin v${newVersion}`, 'Pushing version tag')) process.exit(1);

  // Success message
  console.log('\n🎉 Deployment successful!');
  console.log(`   ✅ Version v${newVersion} deployed`);
  console.log('   ✅ Code pushed to GitHub');
  console.log('   ✅ Vercel will automatically deploy');
  console.log('\n🔗 Next steps:');
  console.log('   1. Check Vercel dashboard for deployment status');
  console.log('   2. Test the live site');
  console.log('   3. Monitor for any issues');
  console.log(`\n🏷️  Tag created: v${newVersion}`);
  console.log(`📝 Release notes: ${releaseNotes}`);

  rl.close();
}

// Run deployment
deploy().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
