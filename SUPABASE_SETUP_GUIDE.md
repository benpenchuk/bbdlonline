# 🚀 Supabase Setup Guide for BBDL

This guide will walk you through setting up Supabase as your backend database and deploying your app with real, shared data.

---

## ✅ Prerequisites Checklist

- [x] Supabase account created
- [x] API key obtained
- [ ] Database tables created
- [ ] Environment variables configured
- [ ] Initial data seeded
- [ ] Local testing complete
- [ ] Deployed to Vercel

---

## Step 1: Create Database Tables in Supabase

### 1.1 Navigate to SQL Editor
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**

### 1.2 Run the Schema Script
1. Open the file `supabase-schema.sql` in your project root
2. Copy **ALL** the contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Wait for success message: "✅ BBDL Database schema created successfully!"

This creates:
- ✅ 6 tables (teams, players, games, tournaments, tournament_matches, announcements)
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Auto-update timestamps

### 1.3 Seed Initial Data
1. Create a **New query** in SQL Editor
2. Open `supabase-seed-data.sql`
3. Copy ALL contents and paste into SQL Editor
4. Click **Run**
5. Verify success: "✅ Initial data seeded successfully!"

This populates:
- 8 Teams
- 16 Players  
- 3 Announcements

---

## Step 2: Configure Environment Variables

### 2.1 Get Your Supabase Credentials
1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### 2.2 Create `.env.local` File
1. In your project root (`bbdl-frontend/`), create a file named `.env.local`
2. Add this content (replace with YOUR actual values):

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

3. Save the file

⚠️ **Important:** 
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Keep your keys secure

---

## Step 3: Test Locally

### 3.1 Start Development Server
```bash
cd bbdl-frontend
npm start
```

### 3.2 Verify Data Loading
1. Open browser to `http://localhost:3000`
2. Check browser console (F12) for:
   - ✅ "✅ Supabase connection successful!"
   - ❌ No error messages about missing env vars

3. Navigate through your app:
   - **Home page** → Should show teams and announcements
   - **Players page** → Should show all 16 players
   - **Games page** → Should load (empty if no games yet)
   - **Stats page** → Should show team stats

### 3.3 Test Admin Panel
1. Navigate to `/admin`
2. Log in (use your existing admin credentials)
3. Try creating a test game:
   - Select two teams
   - Add scores
   - Save
4. Verify the game appears on Games page
5. Check that stats update correctly

---

## Step 4: Configure Vercel Environment Variables

### 4.1 Add Environment Variables to Vercel
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your BBDL project
3. Go to **Settings** → **Environment Variables**
4. Add BOTH variables:

| Name | Value |
|------|-------|
| `REACT_APP_SUPABASE_URL` | Your Supabase Project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon key |

5. Set environment to: **Production, Preview, and Development**
6. Click **Save**

---

## Step 5: Deploy to Vercel

### 5.1 Commit Your Changes
```bash
cd bbdl-frontend

# Add all new files
git add .

# Commit with descriptive message
git commit -m "feat: Migrate from localStorage to Supabase database"

# Push to GitHub
git push origin main
```

### 5.2 Vercel Auto-Deploy
- Vercel will automatically detect the push and start deploying
- Monitor deployment in Vercel Dashboard
- Should complete in 1-2 minutes

### 5.3 Verify Production Deployment
1. Once deployed, visit your live site
2. Open browser console (F12)
3. Check for Supabase connection success
4. Navigate through all pages
5. Verify data loads correctly

---

## Step 6: Create Your First Real Game (Optional)

Now that everything is live, create a real game:

1. Go to your live site `/admin`
2. Log in as admin
3. Go to **Games** tab
4. Click **Create Game**
5. Fill in:
   - Team 1 & Team 2
   - Scheduled date
   - Scores (if completed)
6. Save

**Everyone visiting your site will now see this game!** 🎉

---

## 🎯 Success Checklist

After completing all steps, verify:

- [ ] Local site loads without errors
- [ ] Teams appear on homepage
- [ ] Players page shows all players
- [ ] Can create/edit games in admin panel
- [ ] Stats calculate correctly
- [ ] Production site is live and working
- [ ] Multiple devices can see the same data
- [ ] Environment variables set in Vercel

---

## 🔧 Troubleshooting

### Problem: "Missing Supabase environment variables"
**Solution:** 
- Check `.env.local` file exists in `bbdl-frontend/`
- Verify variable names are EXACTLY: `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
- Restart dev server after creating `.env.local`

### Problem: "Error fetching teams/players/games"
**Solution:**
- Verify SQL schema ran successfully (check Supabase Dashboard → Database → Tables)
- Check Supabase API keys are correct
- Look at browser console for specific error messages

### Problem: "RLS policy error" or "Row level security" errors
**Solution:**
- Re-run the schema SQL script (it includes RLS policies)
- Verify policies exist: Supabase Dashboard → Authentication → Policies

### Problem: Data shows locally but not in production
**Solution:**
- Check Vercel environment variables are set
- Redeploy from Vercel dashboard
- Check Vercel deployment logs for errors

### Problem: Stats not calculating
**Solution:**
- Stats are calculated from games
- Create at least one completed game with scores
- Stats update automatically when games are created/updated

---

## 📊 What Changed?

### Before (localStorage)
- ❌ Data stored in each user's browser
- ❌ Data not shared between users
- ❌ Data lost if browser cache cleared

### After (Supabase)
- ✅ Data stored in PostgreSQL database
- ✅ Shared across all users globally
- ✅ Persistent and backed up
- ✅ Real-time updates possible
- ✅ Admin can manage data

---

## 🎉 Next Steps

Now that your database is live:

1. **Add more games** through the admin panel
2. **Invite others** to view the site (they'll see the same data!)
3. **Set up authentication** for admin-only access (future enhancement)
4. **Add more features** like:
   - Real-time score updates
   - Player profiles
   - Season management
   - Advanced statistics

---

## 📝 Files Modified

| File | Purpose |
|------|---------|
| `src/core/services/api.ts` | Migrated from localStorage to Supabase |
| `src/core/config/supabaseClient.ts` | Supabase connection configuration |
| `supabase-schema.sql` | Database schema creation script |
| `supabase-seed-data.sql` | Initial data population script |
| `.env.local` | Local environment variables (you create this) |
| `package.json` | Added `@supabase/supabase-js` dependency |

---

## 🆘 Need Help?

If you encounter issues:
1. Check browser console for error messages
2. Check Vercel deployment logs
3. Verify Supabase table structure matches schema
4. Ensure environment variables are set correctly

---

**Happy deploying! 🚀**


