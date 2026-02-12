# 🚗 Car Dealership Reservation Platform - Setup Guide

This guide will help you configure the project for both Development and Production environments.

---

## 1. 🍃 MongoDB Atlas Configuration

1. **Create an account:** Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Create a Cluster:** Use the free tier (Shared Cluster).
3. **Database Access:**
   - Create a user with a username and password.
   - Save these credentials!
4. **Network Access:**
   - Go to "Network Access" -> "Add IP Address".
   - For **Development**, add your current IP.
   - For **Production (Render)**, either add `0.0.0.0/0` (not recommended for production but easiest) or find Render's static outbound IPs.
5. **Get Connection String:**
   - Go to "Database" -> "Connect" -> "Drivers" -> "Node.js".
   - Copy the URI and replace `<password>` with your database user password.
   - Paste this in your `.env` as `MONGODB_URI`.

---

## 2. 📧 Email Configuration

### Development (Gmail)
1. Go to your Google Account settings -> Security.
2. Enable **Two-Step Verification**.
3. Search for **"App Passwords"**.
4. Create a new App Password called "Auto Reserve" and copy the 16-character code.
5. Paste it in `.env.local` as `GMAIL_APP_PASSWORD`.
6. Set `GMAIL_USER` to your email.

### Production (Resend)
1. Go to [Resend](https://resend.com/).
2. Create an API Key.
3. Paste it in `.env` as `RESEND_API_KEY`.
4. (Optional) Verify your domain to use a custom email address. Otherwise, use the default from Resend.

---

## 3. 🚀 Deploy to Render (Backend)

1. Connect your GitHub repository to Render.
2. Create a new **Web Service**.
3. **Settings:**
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install && npm run build` (if using TS build) or just `cd backend && npm install`.
   - **Start Command:** `cd backend && npm start`.
4. **Environment Variables:**
   - Go to the "Environment" tab and add all the variables from your `.env` file.
   - Ensure `NODE_ENV` is set to `production`.

---

## 4. 🌐 Deploy to Netlify (Frontend)

1. Connect your repository to Netlify.
2. **Build Settings:**
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
3. **Environment Variables:**
   - Add `VITE_API_URL` pointing to your Render backend URL (e.g., `https://your-backend.onrender.com/api`).
