# Vercel Environment Variables Setup

## 🚀 Quick Setup Guide

### 1. Go to your Vercel Dashboard
- Visit [vercel.com](https://vercel.com)
- Navigate to your project
- Go to **Settings** → **Environment Variables**

### 2. Add these Environment Variables

Copy and paste each variable one by one:

```
Variable Name: NEXT_PUBLIC_FIREBASE_API_KEY
Value: AIzaSyALQ31UIPqI_cyOd7v9XvCtRu6yu5-pBzg
Environment: Production, Preview, Development
```

```
Variable Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: vividsmilesin.firebaseapp.com
Environment: Production, Preview, Development
```

```
Variable Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: vividsmilesin
Environment: Production, Preview, Development
```

```
Variable Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: vividsmilesin.firebasestorage.app
Environment: Production, Preview, Development
```

```
Variable Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: 71111684368
Environment: Production, Preview, Development
```

```
Variable Name: NEXT_PUBLIC_FIREBASE_APP_ID
Value: 1:71111684368:web:40d810a1627bda1dbbf595
Environment: Production, Preview, Development
```

### 3. Redeploy Your Project

After adding all environment variables:
1. Go to the **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy** button

## ✅ Verification

Your deployment should work after setting up these environment variables. The Firebase error should be resolved.

## 🔐 Security Note

These Firebase configuration values are safe to expose publicly as they're client-side configuration. However, make sure your Firebase Security Rules are properly configured to protect your data.

## 📋 Checklist

- [ ] Added NEXT_PUBLIC_FIREBASE_API_KEY
- [ ] Added NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN  
- [ ] Added NEXT_PUBLIC_FIREBASE_PROJECT_ID
- [ ] Added NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- [ ] Added NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- [ ] Added NEXT_PUBLIC_FIREBASE_APP_ID
- [ ] Redeployed the project
- [ ] Verified deployment works without Firebase errors
