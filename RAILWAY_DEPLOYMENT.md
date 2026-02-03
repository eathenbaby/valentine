# Railway Deployment Guide

## ✅ Pre-Deployment Verification

The local smoke test has passed successfully! The server is ready for Railway deployment.

## 🚀 Railway Deployment Steps

### 1. Environment Variables

Set these environment variables in your Railway project:

```bash
DATABASE_URL=postgresql://postgres:XTvBLuaTlvcaGSYMOApDQbkyDcsuSWkC@valentine-db.railway.internal:5432/railway
V4ULT_ADMIN_TOKEN=v4ult_admin_secret_token_2024
NODE_ENV=production
```

### 2. Optional Environment Variables

For full functionality, also set:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
WEBHOOK_URL=your_discord_or_telegram_webhook_url
ADMIN_URL=https://your-railway-app.railway.app/admin/v4ult
```

### 3. Deployment Process

1. **Connect Repository**: Link this repository to your Railway project
2. **Set Environment Variables**: Add all the variables listed above
3. **Deploy**: Railway will automatically build and deploy using the `railway.json` configuration
4. **Verify**: Once deployed, run the full smoke test against the live URL

### 4. Post-Deployment Verification

Run the smoke test against your deployed Railway app:

```bash
# Set your Railway app URL
export BASE_URL=https://your-app-name.railway.app
export V4ULT_ADMIN_TOKEN=v4ult_admin_secret_token_2024

# Run the full smoke test
node tests/smokeTest.cjs
```

## 🔧 Build Configuration

The project uses the following build configuration (already configured in `railway.json`):

- **Builder**: NIXPACKS (automatic detection)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Restart Policy**: ON_FAILURE with 10 max retries

## 📊 Expected Test Results

After deployment, the full smoke test should show:

✅ Profile creation: SUCCESS  
✅ Confession saving: SUCCESS  
✅ Admin authentication: SUCCESS  
✅ Payment protection: SUCCESS  
✅ Mark Paid logic: SUCCESS  
✅ Identity reveal: SUCCESS  

## 🎯 Key Features Verified

- **Health Check**: `/health` endpoint responds correctly
- **Admin Authentication**: V4ULT_ADMIN_TOKEN properly protects admin routes
- **Database Integration**: Profile and confession creation works
- **Payment Flow**: Mark paid functionality unlocks identity reveal
- **API Security**: Proper 402 responses for unpaid reveals
- **Stats Tracking**: Analytics and view counting functional

## 🚨 Troubleshooting

If deployment fails:

1. **Check Environment Variables**: Ensure all required variables are set
2. **Database Connection**: Verify DATABASE_URL is correct for Railway internal network
3. **Build Logs**: Check Railway build logs for any missing dependencies
4. **Health Check**: Test `/health` endpoint first after deployment

## 📝 Notes

- The V4ULT_ADMIN_TOKEN can be any secure string - the current value is just for testing
- Database migrations will run automatically on first startup
- The app includes comprehensive error handling and logging
- All API endpoints are properly secured and validated