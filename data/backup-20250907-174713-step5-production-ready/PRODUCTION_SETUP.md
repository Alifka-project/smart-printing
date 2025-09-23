# Production Database Setup Guide

## 🚨 CRITICAL: Set Environment Variables in Vercel

Your production database is not connecting because the environment variables are not properly configured in Vercel.

### Step 1: Go to Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Sign in to your account
3. Select your `smart-printing` project

### Step 2: Add Environment Variables
Go to **Settings** → **Environment Variables** and add these:

#### Required Variables:
```
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18xc0dkeFdBOTFuNW1jNWZTNkpUczAiLCJhcGlfa2V5IjoiMDFLMzRRTVFYTVhDR0VaMkFBS1lTMFo3RUMiLCJ0ZW5hbnRfaWQiOiJjOTFjODU2MWZlOGI2YjM0YTU5ODVmMTdhYzU2NGNhMzY3OTY5ZmU5Mjg1NTdjNGM0ZjZiNWJjNzgwNzMzMjgxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNGY4OWUzMTItMDE4OC00ZjE4LWFhMGQtYTc1OWVhN2EzNGE5In0.lPVxsK7w4PqWlM7f5ErZ-LE7ixz4nL1rVMJIRttzRqs"

DIRECT_URL="postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"

NODE_ENV="production"

PRISMA_GENERATE_DATAPROXY="true"
```

#### Environment Selection:
- **Production**: ✅ Check this
- **Preview**: ✅ Check this  
- **Development**: ❌ Leave unchecked

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on your latest deployment
3. Or push a new commit to trigger auto-deploy

### Step 4: Verify Connection
After redeployment, test the database connection:
```
https://smart-printing.vercel.app/api/database-health
```

## 🔧 What Was Fixed

1. ✅ **Prisma Schema**: Updated to use PostgreSQL with Prisma Accelerate
2. ✅ **Database Configuration**: Created unified database setup
3. ✅ **API Routes**: Updated to use correct database configuration
4. ✅ **Build Process**: Fixed Prisma validation errors

## 🚀 Current Status

- **Local Build**: ✅ Working
- **Production Build**: ⏳ Waiting for environment variables
- **Database Connection**: ⏳ Waiting for Vercel configuration

## 📝 Next Steps

1. Set the environment variables in Vercel (above)
2. Redeploy the application
3. Test the production database connection
4. Verify that quotes and data are loading

## 🆘 If Still Not Working

Check the Vercel deployment logs for any errors and ensure:
- All environment variables are set correctly
- The DATABASE_URL uses the Prisma Accelerate format
- NODE_ENV is set to "production"
