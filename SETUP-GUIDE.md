# 🚀 STEP-BY-STEP SETUP GUIDE

## 📋 What You Need to Do (in order)

### **Step 1: Get Razorpay Account (5 minutes)**
1. Go to https://razorpay.com/signup
2. Create account (use your email/phone)
3. Complete email verification
4. Go to Dashboard → Settings → API Keys
5. Generate Test Keys (copy Key ID and Key Secret)

### **Step 2: Set Up Environment Variables in Railway (2 minutes)**
1. Go to https://railway.app
2. Click your project → Variables tab
3. Add these variables:

```bash
# Essential
NODE_ENV=production
SESSION_SECRET=your-random-secret-here-12345

# Razorpay (from Step 1)
RAZORPAY_KEY_ID=rzp_test_your-key-id-here
RAZORPAY_KEY_SECRET=your-key-secret-here
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret-here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your-key-id-here

# OAuth (we'll set these in Step 3)
INSTAGRAM_CLIENT_ID=coming-next-step
INSTAGRAM_CLIENT_SECRET=coming-next-step
GOOGLE_CLIENT_ID=coming-next-step
GOOGLE_CLIENT_SECRET=coming-next-step
```

### **Step 3: Get Instagram OAuth (10 minutes)**
1. Go to https://developers.facebook.com/
2. Click "Create App" → Choose "Consumer"
3. Add "Instagram Basic Display" product
4. In Instagram Basic Display settings:
   - Add redirect URI: `https://valentine-app-production-99ad.up.railway.app/api/auth/instagram/callback`
   - Add your email for deactivation
5. Save and copy:
   - App ID → INSTAGRAM_CLIENT_ID
   - App Secret → INSTAGRAM_CLIENT_SECRET
6. Update these in Railway Variables

### **Step 4: Get Google OAuth (10 minutes)**
1. Go to https://console.cloud.google.com/
2. Create new project (any name)
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure:
   - Application type: "Web application"
   - Name: "Confession Platform"
   - Add redirect URI: `https://valentine-app-production-99ad.up.railway.app/api/auth/google/callback`
6. Click "Create"
7. Copy:
   - Client ID → GOOGLE_CLIENT_ID
   - Client Secret → GOOGLE_CLIENT_SECRET
8. Update these in Railway Variables

### **Step 5: Deploy and Test (2 minutes)**
1. Railway will auto-deploy when you update variables
2. Wait 2-3 minutes for deployment
3. Test your app: https://valentine-app-production-99ad.up.railway.app/

### **Step 6: Test the Platform (5 minutes)**
1. Open your app URL
2. Click "Login with Instagram" or "Login with Google"
3. Submit a test confession
4. Check if it appears in admin dashboard

---

## 🔧 If Something Goes Wrong

### **Problem: "Database error"**
**Solution:** The migration will fix this automatically when the server starts.

### **Problem: "OAuth redirect error"**
**Solution:** Make sure redirect URIs match exactly:
- Instagram: `https://valentine-app-production-99ad.up.railway.app/api/auth/instagram/callback`
- Google: `https://valentine-app-production-99ad.up.railway.app/api/auth/google/callback`

### **Problem: "Payment not working"**
**Solution:** Check Razorpay keys are correct and in test mode.

---

## 🎯 Quick Test Checklist

- [ ] App loads at your Railway URL
- [ ] Login buttons work (Instagram/Google)
- [ ] Can submit a confession
- [ ] Admin dashboard shows your confession
- [ ] Payment system creates orders

---

## 📞 Need Help?

If you get stuck on any step:
1. Check Railway logs for errors
2. Make sure all environment variables are set
3. Verify redirect URIs match exactly
4. Test with incognito browser window

---

## 🎉 Once Everything Works

Your platform is ready! You can:
1. Start accepting confessions
2. Post them to Instagram
3. Charge ₹30 for name reveals
4. Track revenue in admin dashboard

**Potential Revenue:** ₹30 × 10 reveals/day = ₹300/day = ₹9,000/month!
