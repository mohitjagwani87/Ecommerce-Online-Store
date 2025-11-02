# Quick Deployment Steps for Vercel Fix

## Option 1: If Vercel is Already Connected to GitHub (Automatic Deployment) ✅

**This is the easiest - just push to GitHub!**

1. **Commit your changes:**
   ```bash
   git add backend/index.js
   git commit -m "fix: resolve Vercel FUNCTION_INVOCATION_FAILED error"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   # or
   git push origin master
   ```

3. **Vercel automatically deploys** when you push to the connected branch (usually `main` or `master`)

4. **Check deployment status:**
   - Go to https://vercel.com/dashboard
   - Find your project
   - Watch the deployment logs

**That's it!** No need to create a new project.

---

## Option 2: If Vercel is NOT Connected to GitHub (Manual Deployment)

### Step 1: Push to GitHub
```bash
git add backend/index.js
git commit -m "fix: resolve Vercel FUNCTION_INVOCATION_FAILED error"
git push origin main
```

### Step 2: Redeploy on Vercel (Same Project)

**Don't create a new project** - just redeploy the existing one:

1. Go to https://vercel.com/dashboard
2. Click on your existing project
3. Click the **"Redeploy"** button (or go to the "Deployments" tab)
4. Click **"Redeploy"** next to the latest deployment
   - Or click **"Create Deployment"** → Enter your GitHub repo → Select branch → Deploy

**Note**: If you create a "new project", you'll lose your environment variables and settings!

---

## Option 3: If You Need to Connect Vercel to GitHub First

1. **Push your code to GitHub** (if not already there)
   ```bash
   git add backend/index.js
   git commit -m "fix: resolve Vercel FUNCTION_INVOCATION_FAILED error"
   git push origin main
   ```

2. **Connect Vercel to GitHub:**
   - Go to https://vercel.com/dashboard
   - Click "Add New Project"
   - Import your GitHub repository
   - **Important**: If you already have a project, click "Settings" → "Git" → Connect to GitHub
   - Select the repository and branch

3. **Configure Project Settings:**
   - **Root Directory**: Set to `backend` (if deploying backend only) or root (if deploying both)
   - **Build Command**: Leave empty or set to `cd backend && npm install`
   - **Output Directory**: Not needed for serverless functions
   - **Install Command**: `cd backend && npm install` (if root directory is root)

4. **Set Environment Variables:**
   - Go to "Settings" → "Environment Variables"
   - Add all required variables:
     - `MONGO_URI`
     - `JWT_SECRET`
     - `PINECONE_API_KEY`
     - `PINECONE_HOST`
     - `GOOGLE_AI_API_KEY`
     - `PINECONE_INDEX` (optional)
     - `SKIP_SEED_ON_START=true` (important for serverless!)
   - **Select environments**: Production, Preview, Development
   - Click "Save"

5. **Deploy:**
   - Vercel will automatically detect the push and deploy
   - Or click "Deploy" manually

---

## Important: Environment Variables Checklist

Make sure these are set in Vercel (Settings → Environment Variables):

### Required:
- ✅ `MONGO_URI` - Your MongoDB connection string
- ✅ `JWT_SECRET` - Secret key for JWT tokens
- ✅ `SKIP_SEED_ON_START=true` - **Critical!** Prevents seeding on serverless startup

### For AI Recommendations (Optional but Recommended):
- ✅ `PINECONE_API_KEY`
- ✅ `PINECONE_HOST`
- ✅ `GOOGLE_AI_API_KEY`
- ✅ `PINECONE_INDEX` (defaults to 'ecommerce-products' if not set)

### Optional:
- `PORT` (Vercel sets this automatically)
- `PINECONE_NAMESPACE`
- `PINECONE_PURGE_ON_SYNC`

---

## Verify Deployment

After deployment, check:

1. **Function logs** in Vercel dashboard:
   - Go to your project → Deployments → Click latest deployment → Functions tab
   - Look for successful initialization (should be <1 second)

2. **Test an API endpoint:**
   ```bash
   curl https://your-project.vercel.app/api/products
   ```
   Should return product data (or empty array if no products)

3. **Check for errors:**
   - Vercel dashboard → Deployments → Latest → Logs
   - Should NOT see "FUNCTION_INVOCATION_FAILED"
   - Should see MongoDB connection on first request

---

## Troubleshooting

### If deployment still fails:

1. **Check Vercel logs:**
   - Dashboard → Project → Deployments → Latest → Logs
   - Look for error messages

2. **Verify environment variables:**
   - Settings → Environment Variables
   - Make sure `SKIP_SEED_ON_START=true` is set

3. **Check build logs:**
   - The build should complete quickly (<30 seconds)
   - No errors during `npm install`

4. **Verify vercel.json:**
   - Should be in `backend/vercel.json`
   - Points to `index.js`

---

## Summary

**Shortest path (if already connected to GitHub):**
```bash
git add backend/index.js
git commit -m "fix: Vercel serverless timeout"
git push origin main
# Vercel auto-deploys ✅
```

**If not connected:**
1. Push to GitHub
2. Go to Vercel dashboard
3. Redeploy existing project (don't create new!)
4. Verify environment variables are set

**Key Point**: You don't need to create a "new project" - just push to GitHub and redeploy the existing one. Creating a new project means re-configuring everything!

