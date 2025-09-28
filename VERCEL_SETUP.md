# Vercel Setup Guide

Follow these steps to connect your GitHub repository to Vercel for automatic deployments.

## 🔗 Step 1: Connect GitHub Repository to Vercel

### Option A: Using Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New..." → "Project"
3. Import your GitHub repository (`New BBDL`)
4. Configure project settings:
   - **Framework Preset**: Create React App
   - **Root Directory**: `bbdl-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

### Option B: Using Vercel CLI
```bash
cd bbdl-frontend
npm i -g vercel
vercel login
vercel --prod
```

## ⚙️ Step 2: Configure Environment Variables (if needed)

In your Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add any required environment variables:
   ```
   NODE_VERSION=18.x
   CI=false  (if build warnings cause failures)
   ```

## 🚀 Step 3: Test Automatic Deployment

1. Make a small change to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "test: verify automatic deployment"
   git push origin main
   ```
3. Check Vercel dashboard - should show new deployment

## 📋 Step 4: Verify Deployment Settings

In Vercel dashboard, verify:
- ✅ **Git Integration**: Connected to your GitHub repo
- ✅ **Auto Deployments**: Enabled for main branch
- ✅ **Build Settings**: Correct commands and directories
- ✅ **Domain**: Custom domain configured (optional)

## 🏷️ Step 5: Test Version Deployment

Once connected, test the deployment system:

```bash
# Test patch deployment
npm run deploy:patch
```

This should:
1. Build your app
2. Create a git tag (e.g., v1.0.1)
3. Push to GitHub
4. Trigger Vercel deployment automatically

## 🔍 Monitoring Deployments

### Vercel Dashboard
- View deployment status and logs
- See preview deployments for branches
- Monitor performance metrics

### GitHub Integration
- Each push to `main` = production deployment
- Pull requests = preview deployments
- Git tags = versioned releases

## 🚨 Troubleshooting

### Build Fails on Vercel
```bash
# Test build locally first
npm run build

# Common fixes:
# 1. Check Node.js version (18.x recommended)
# 2. Set CI=false if warnings cause failures
# 3. Verify all dependencies are in package.json
```

### Deployment Successful but Site Doesn't Work
```bash
# Check for:
# 1. Console errors in browser
# 2. Missing assets (check Network tab)
# 3. Incorrect build paths
# 4. Environment variables
```

### Git Tag Not Triggering Deployment
```bash
# Ensure both code and tags are pushed:
git push origin main
git push origin --tags
```

## ✅ Success Checklist

After setup, verify:
- [ ] Repository connected to Vercel
- [ ] Build settings configured correctly
- [ ] Automatic deployments work
- [ ] Custom domain configured (if desired)
- [ ] Environment variables set (if needed)
- [ ] Deployment notifications enabled
- [ ] Team access configured (if needed)

---

## Quick Reference Commands

```bash
# Check current deployment status
npm run version:current
npm run version:list

# Deploy new version
npm run deploy:patch "Fixed game creation bug"
npm run deploy:minor "Added tournament system"
npm run deploy:major "Complete redesign"

# Custom version
npm run deploy:custom -- v2.1.0 "Special release notes"
```

Once set up, every time you run a deploy command, Vercel will automatically build and deploy your new version! 🚀
