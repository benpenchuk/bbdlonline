# BBDL Deployment Guide

This guide covers how to deploy updates to your BBDL application with versioning and automatic deployment to Vercel.

## Quick Deployment Commands

### 1. Deploy with Version Tag
```bash
# For patch updates (1.1.2 -> 1.1.3)
npm run deploy:patch

# For minor updates (1.1.x -> 1.2.0)
npm run deploy:minor

# For major updates (1.x.x -> 2.0.0)
npm run deploy:major

# For custom version
npm run deploy:custom -- v2.1.0 "Added game creation and stats system"
```

### 2. Manual Deployment Steps
```bash
# 1. Build the application
npm run build

# 2. Add and commit all changes
git add .
git commit -m "feat: your update description"

# 3. Create version tag with notes
git tag -a v1.1.3 -m "Version 1.1.3 - Added automated stats system and game creation"

# 4. Push to GitHub (triggers Vercel deployment)
git push origin main
git push origin v1.1.3
```

## Version Numbering System

Follow [Semantic Versioning (SemVer)](https://semver.org/):

- **MAJOR** (2.0.0): Breaking changes, complete redesigns
- **MINOR** (1.2.0): New features, backwards compatible
- **PATCH** (1.1.3): Bug fixes, small improvements

### Examples:
- `v1.1.2` → `v1.1.3`: Bug fixes, small improvements
- `v1.1.3` → `v1.2.0`: New features (game creation, stats system)
- `v1.9.0` → `v2.0.0`: Major overhaul, breaking changes

## Vercel Integration

### Automatic Deployment
If your GitHub repository is connected to Vercel:

1. **Every push to `main`** triggers a production deployment
2. **Pull requests** create preview deployments
3. **Git tags** are preserved and can be viewed in Vercel dashboard

### Setting Up Vercel (if not already connected)
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod
```

### Environment Variables
Make sure these are set in your Vercel dashboard:
- `NODE_VERSION`: `18.x` (or your preferred version)
- `BUILD_COMMAND`: `npm run build`
- `OUTPUT_DIRECTORY`: `build`

## Release Notes Template

When creating tags, use this format for consistent release notes:

```bash
git tag -a v1.2.0 -m "Version 1.2.0 - Feature Name

🚀 New Features:
- Added game creation and editing functionality
- Implemented automated stats system
- Added input validation for game scores

🐛 Bug Fixes:
- Fixed loading state issues
- Resolved stats calculation errors

🔧 Improvements:
- Enhanced UI for admin panel
- Improved error handling
- Updated documentation

📊 Stats:
- +500 lines of code
- +2 new components
- +5 new functions"
```

## Git Workflow Best Practices

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/game-creation

# Make changes and commit frequently
git add .
git commit -m "feat: add game creation modal"

# Push feature branch
git push origin feature/game-creation

# Create pull request on GitHub
# After approval, merge to main
```

### 2. Hotfix Deployment
```bash
# Create hotfix branch from main
git checkout -b hotfix/stats-calculation

# Fix the issue
git add .
git commit -m "fix: correct stats calculation logic"

# Deploy immediately
git checkout main
git merge hotfix/stats-calculation
npm run deploy:patch
```

## Deployment Checklist

Before each deployment:

- [ ] **Test locally**: `npm start` and verify all features work
- [ ] **Build successfully**: `npm run build` completes without errors
- [ ] **Check for linting issues**: Fix any ESLint warnings
- [ ] **Update version**: Choose appropriate version number
- [ ] **Write clear commit message**: Follow conventional commits
- [ ] **Create descriptive tag**: Include what changed
- [ ] **Test production build**: `serve -s build` and verify
- [ ] **Push to GitHub**: Both main branch and tags
- [ ] **Verify Vercel deployment**: Check the live site

## Common Deployment Commands

### View Current Version
```bash
git describe --tags --abbrev=0
```

### View All Versions
```bash
git tag -l
```

### View Version History with Notes
```bash
git tag -l -n5
```

### Delete a Tag (if mistake)
```bash
# Local
git tag -d v1.1.3

# Remote
git push origin :refs/tags/v1.1.3
```

### View Changes Between Versions
```bash
git log v1.1.2..v1.1.3 --oneline
```

## Rollback Procedures

### If Production Has Issues
```bash
# 1. Find last working version
git tag -l

# 2. Create rollback branch
git checkout -b rollback/to-v1.1.2 v1.1.2

# 3. Deploy rollback
git checkout main
git merge rollback/to-v1.1.2
npm run deploy:patch

# 4. Fix issues on separate branch, then redeploy
```

## Monitoring & Alerts

### After Each Deployment:
1. **Check Vercel dashboard** for successful deployment
2. **Test critical paths** on live site
3. **Monitor for errors** in browser console
4. **Check stats system** works correctly
5. **Verify admin functions** are accessible

### Set Up Alerts (Recommended):
- **Vercel build failures** → Email notifications
- **Error tracking** → Sentry or LogRocket
- **Performance monitoring** → Vercel Analytics

## Troubleshooting

### Build Fails on Vercel
```bash
# Check build locally first
npm run build

# If it works locally, check:
# 1. Node.js version in Vercel settings
# 2. Environment variables
# 3. Dependencies in package.json
```

### Deployment Successful but Site Broken
```bash
# Check for:
# 1. Missing environment variables
# 2. API endpoint issues
# 3. Asset loading problems (check Network tab)
# 4. JavaScript errors (check Console)
```

### Stats System Not Working After Deployment
```bash
# Likely causes:
# 1. localStorage cleared (normal on first visit)
# 2. Data format changes (run recalculateAllStats)
# 3. Missing game data (check mockData)
```

---

## Quick Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `npm run deploy:patch` | Bug fixes | 1.1.2 → 1.1.3 |
| `npm run deploy:minor` | New features | 1.1.3 → 1.2.0 |
| `npm run deploy:major` | Breaking changes | 1.9.0 → 2.0.0 |
| `git tag -a v1.2.0 -m "notes"` | Manual tagging | Custom version |
| `git push origin main && git push --tags` | Deploy everything | Push code + tags |

Happy deploying! 🚀
