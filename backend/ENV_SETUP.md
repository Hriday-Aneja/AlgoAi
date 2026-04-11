# Environment Setup Guide

## Quick Start

To get the backend running, you need to set up your environment variables. Here's how:

### Step 1: Create the .env file

In the `backend/` directory, copy the `.env.example` template:

```bash
cd backend
cp .env.example .env
```

### Step 2: Fill in the required values

Edit `backend/.env` and fill in these required fields:

#### Supabase (Required)

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Select your project
3. Click **Settings** → **API**
4. Copy and paste:
   - **SUPABASE_URL** → "Project URL"
   - **SUPABASE_ANON_KEY** → "Anon Key"

Example:
```
SUPABASE_URL=https://xyzabc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### AI Provider (Required)

Choose either **Gemini** or **OpenAI**:

**Option 1: Google Gemini (Recommended)**

1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Set in `.env`:
```
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyD-...
```

**Option 2: OpenAI**

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Set in `.env`:
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### Step 3: Start the backend

```bash
npm run dev
```

You should see output like:

```
✅ Loaded .env from: C:\...\backend\.env
   Found 13 variables

✅ Environment Configuration Loaded:

   [SERVER]
   • NODE_ENV: development
   • PORT: 3001
   • CORS_ORIGIN: http://localhost:5173

   [SUPABASE]
   • SUPABASE_URL: ✓ configured
   • SUPABASE_ANON_KEY: ✓ configured

   [AI PROVIDER]
   • AI_PROVIDER: gemini
   • GEMINI_MODEL: gemini-1.5-flash
   • GEMINI_API_KEY: ✓ configured

🚀 Server running on http://localhost:3001
```

## Troubleshooting

### Error: "Missing required environment variables"

This means your `.env` file is missing required values or not being loaded.

**Quick fixes:**

1. **Check .env exists**: 
   ```bash
   ls -la backend/.env
   ```

2. **Verify values are set** (not empty):
   ```bash
   cat backend/.env | grep SUPABASE_URL
   ```

3. **Clear Node cache** (if you just created .env):
   ```bash
   npm run dev
   ```

### Error: "SUPABASE_URL is not defined"

- Check Supabase credentials are correct
- Ensure `.env` file is in `backend/` folder (NOT `backend/src/`)
- Make sure no spaces or quotes around values

### Error: "GEMINI_API_KEY is not defined"

- If using Gemini, check your API key is correct
- Keys usually start with `AIzaSy...`
- Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) to regenerate if needed

## Security Notes

- ✅ `.env` is in `.gitignore` - won't be committed to Git
- ✅ Safe logging in `src/config/env.ts` - shows configuration status without exposing secrets
- ✅ Environment variables validated on startup - clear error messages help debugging
- ❌ Never commit `.env` to version control
- ❌ Never share your API keys or database credentials
- ❌ Don't paste actual credentials in Slack, email, or public chat

## File Structure

```
backend/
├── .env              ← Your actual secrets (created in Step 1)
├── .env.example      ← Template (checked into Git)
├── .gitignore        ← Prevents .env from being committed
└── src/
    └── config/
        ├── env.ts    ← Environment validation & logging
        └── supabase.ts    ← Uses validated env config
```

## Environment Variables Reference

| Variable | Required | Example | Source |
|----------|----------|---------|--------|
| `SUPABASE_URL` | ✅ | `https://abc.supabase.co` | Supabase Dashboard |
| `SUPABASE_ANON_KEY` | ✅ | `eyJhbGc...` | Supabase Dashboard |
| `AI_PROVIDER` | ✅ | `gemini` or `openai` | Your choice |
| `GEMINI_API_KEY` | ✅ if Gemini | `AIzaSy...` | Google AI Studio |
| `GEMINI_MODEL` | ❌ | `gemini-1.5-flash` | Google (default used) |
| `OPENAI_API_KEY` | ✅ if OpenAI | `sk-...` | OpenAI Dashboard |
| `OPENAI_MODEL` | ❌ | `gpt-4-turbo` | OpenAI (default used) |
| `PORT` | ❌ | `3001` | Your preference |
| `NODE_ENV` | ❌ | `development` | Your preference |
| `CORS_ORIGIN` | ❌ | `http://localhost:5173` | Your frontend URL |
| `ONBOARDING_PROMPT_PREFIX` | ❌ | Custom text | Your preference |

---

**Need help?** Check the error message from when you run `npm run dev` - it will tell you exactly which variables are missing!
