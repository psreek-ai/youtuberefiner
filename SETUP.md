# ⚙️ YouTube Refiner: Complete Setup Guide

Because this application takes programmatic actions on your behalf (Liking videos) and synthesizes text using Google's LLMs, you must configure your own API keys. 

Follow this step-by-step guide to get your local `.env.local` fully operational in about 5 minutes.

---

## Part 1: Google Cloud & YouTube Data API

### 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the **Project Dropdown** at the top left and select **New Project**.
3. Name it `YouTube Refiner` and click **Create**.

### 2. Enable the YouTube Data API v3
1. In your new project, use the top search bar to search for **"YouTube Data API v3"**.
2. Click on it and press the blue **Enable** button.

### 3. Configure the OAuth Consent Screen
Before you can generate login credentials, Google needs to know what your app is.
1. On the left sidebar, navigate to **APIs & Services > OAuth consent screen**.
2. Choose **External** user type and click Create.
3. Fill in the required fields (App Name: `YouTube Refiner`, User Support Email: your email, Developer Contact Info: your email).
4. Click **Save and Continue**.
5. **Scopes:** Click *Add or Remove Scopes*, search for `youtube.force-ssl` (Manage your YouTube account) and check the box. Click Update, then Save and Continue.
6. **Test Users:** Under Test Users, click *Add Users* and add your personal Google/YouTube email address. (If you don't do this, you won't be able to log in while the app is unpublished!).

### 4. Generate OAuth Credentials
1. On the left sidebar, navigate to **APIs & Services > Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Application Type: Select **Web application**.
4. Under **Authorized redirect URIs**, click Add URI and paste exactly:
   `http://localhost:3000/api/auth/callback/google`
5. Click **Create**.
6. A popup will appear with your **Client ID** and **Client Secret**. Copy these into your `.env.local` file under `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

## Part 2: Google Gemini (AI Studio)

To power the core thesis engine, we use Google's Open Weights Gemma models via AI Studio (which has a huge free tier!).

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **Get API key** on the left sidebar.
4. Click **Create API key in new project**.
5. Copy the generated API key into your `.env.local` file under `GEMINI_API_KEY`.

---

## Part 3: Finalizing `.env.local`

Your root project directory must have a `.env.local` file that looks exactly like this:

```env
# OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID="your_client_id_here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_client_secret_here"

# NextAuth Config
NEXTAUTH_URL="http://localhost:3000"
# Generate a secret by running `openssl rand -base64 32` in your terminal
NEXTAUTH_SECRET="your_generated_random_string_here"

# Gemini Config (from Google AI Studio)
GEMINI_API_KEY="your_gemini_api_key_here"
```

## You're Done! 🎉
Run `npm run dev`, navigate to `http://localhost:3000`, click **Connect YouTube**, and engage the Auto-Pilot!
