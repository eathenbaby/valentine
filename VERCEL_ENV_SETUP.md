# 🔐 Vercel Environment Variables Setup

## Step-by-Step Guide

### 1. Open Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Log in with GitHub
3. Click on your **"valentine"** project

### 2. Navigate to Environment Variables
1. Click **"Settings"** tab at the top
2. Click **"Environment Variables"** in the left sidebar

### 3. Add Each Variable

For each variable below, click **"Add Another"** and fill in:

---

#### Variable 1: SUPABASE_URL
```
Key: SUPABASE_URL
Value: https://xkcrtryvjgpfoevxcfof.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```
Click **"Save"**

---

#### Variable 2: SUPABASE_ANON_KEY
```
Key: SUPABASE_ANON_KEY
Value: [Paste your anon key from Supabase Settings → API]
Environments: ✅ Production ✅ Preview ✅ Development
```
Click **"Save"**

**Where to find it:**
- Supabase Dashboard → Settings → API → "anon public" key

---

#### Variable 3: DATABASE_URL
```
Key: DATABASE_URL
Value: [Paste your connection string from Supabase]
Environments: ✅ Production ✅ Preview ✅ Development
```
Click **"Save"**

**Where to find it:**
- Supabase Dashboard → Settings → Database
- Scroll to "Connection string"
- Click "URI" tab
- Copy the string and replace `[YOUR-PASSWORD]` with your actual password

**Example format:**
```
postgresql://postgres.xkcrtryvjgpfoevxcfof:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

#### Variable 4: SESSION_SECRET
```
Key: SESSION_SECRET
Value: valentine-secret-key-2026-super-secure-random-string-12345
Environments: ✅ Production ✅ Preview ✅ Development
```
Click **"Save"**

(You can use any random string - at least 32 characters)

---

#### Variable 5: NODE_ENV
```
Key: NODE_ENV
Value: production
Environments: ✅ Production only (uncheck Preview and Development)
```
Click **"Save"**

---

### 4. Optional Variables (Add Later if Needed)

#### SUPABASE_SERVICE_ROLE_KEY
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: [From Supabase Settings → API → "service_role" key]
Environments: ✅ Production ✅ Preview ✅ Development
```
**Use for:** Admin operations, bypassing Row Level Security

---

#### V4ULT_ADMIN_TOKEN
```
Key: V4ULT_ADMIN_TOKEN
Value: [Create your own secure token]
Environments: ✅ Production ✅ Preview ✅ Development
```
**Use for:** Accessing admin panel at `/admin/v4ult`

---

### 5. Redeploy Your Site

After adding all variables:

1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click the **"..."** (three dots) menu
4. Click **"Redeploy"**
5. Confirm by clicking **"Redeploy"** again
6. Wait 2-3 minutes for deployment to complete

---

## Verification Checklist

After redeployment, verify everything works:

- [ ] Visit your site URL (should load without 404)
- [ ] Check `/health` endpoint (should return OK)
- [ ] Try creating a confession (tests database connection)
- [ ] Check Vercel logs for any errors

---

## Troubleshooting

### Issue: "Database connection failed"
**Solution:**
1. Verify `DATABASE_URL` is correct
2. Make sure you replaced `[YOUR-PASSWORD]` with actual password
3. Check Supabase project is active (not paused)

### Issue: "Still getting 404"
**Solution:**
1. Make sure you clicked "Redeploy" after adding variables
2. Check build logs in Vercel for errors
3. Verify all 5 required variables are added

### Issue: "Session errors"
**Solution:**
1. Make sure `SESSION_SECRET` is at least 32 characters
2. Verify it's added to all environments

---

## Quick Reference - Required Variables

| Variable | Where to Get It | Required? |
|----------|----------------|-----------|
| `SUPABASE_URL` | Supabase Settings → API | ✅ Yes |
| `SUPABASE_ANON_KEY` | Supabase Settings → API | ✅ Yes |
| `DATABASE_URL` | Supabase Settings → Database | ✅ Yes |
| `SESSION_SECRET` | Create your own (32+ chars) | ✅ Yes |
| `NODE_ENV` | Set to `production` | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings → API | ⚠️ Optional |
| `V4ULT_ADMIN_TOKEN` | Create your own | ⚠️ Optional |

---

## Next Steps

1. ✅ Add all 5 required variables in Vercel
2. ✅ Redeploy your site
3. ✅ Test your site
4. 🎉 Share with the world!

Your site should be live at: `https://your-project.vercel.app`
