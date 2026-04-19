# 🚀 Render Backend Deployment Guide

## Create Render Account
1. Go to https://render.com
2. Sign up (free)
3. Click "New +" → Select "Web Service"

## Connect GitHub
1. Click "Connect Repository"
2. Select: `Pk23191/Ram-ji-bakery23`
3. Click "Connect"

## Configure Web Service

**Basic Settings:**
- Name: `ramji-bakery-api`
- Environment: `Node`
- Build Command: `npm install && npm --prefix server install`
- Start Command: `node server/server.js`
- Instance Type: Free (or Paid if you want)

## Add Environment Variables

Click "Environment" tab and add these:

```
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/ramji-bakery?retryWrites=true&w=majority

CLOUDINARY_CLOUD_NAME=dxjhtsb2s
CLOUDINARY_API_KEY=956249967932616
CLOUDINARY_API_SECRET=gZx0FQ2vHts9c1UxkMYFuHUEHmc

JWT_SECRET=ramji-bakery-secure-secret-2024

FRONTEND_URL=https://ram-ji-bakery23.vercel.app

ADMIN_EMAIL=admin@ramjibakery.in
ADMIN_PASSWORD=yourSecurePassword123

ADMIN_ROLE=superadmin

PORT=10000
```

**Note:** Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your MongoDB credentials

## Deploy

1. Click "Create Web Service"
2. Wait for deployment (3-5 minutes)
3. You'll get a URL like: `https://ramji-bakery-api.onrender.com`

## Update Vercel with Backend URL

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add: `NEXT_PUBLIC_API_URL=https://ramji-bakery-api.onrender.com/api`
5. Redeploy (Settings → Deployments → Redeploy)

## Test Backend

Visit: `https://ramji-bakery-api.onrender.com/api/health`

You should see:
```json
{
  "ok": true,
  "service": "Ramji Bakery API",
  "dbConnected": true
}
```

## If Initial Deployment Fails:
1. Check "Logs" tab in Render
2. Look for error messages
3. Current common issue: MongoDB connection
   - Verify connection string is correct
   - Check MongoDB whitelist includes Render IP

