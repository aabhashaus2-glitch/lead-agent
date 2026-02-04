# Deploy to Vercel

This app is now configured to work on Vercel using Vercel KV for serverless-safe email storage.

## Prerequisites

- Vercel account (free tier works: https://vercel.com)
- GitHub account (to connect your repo)

## Step-by-Step Deployment

### 1. Push to GitHub

If not already on GitHub, push your code:

```bash
git init
git add .
git commit -m "Ready for Vercel deployment with KV support"
git remote add origin https://github.com/YOUR_USERNAME/lead-agent.git
git branch -M main
git push -u origin main
```

### 2. Create Vercel Project

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import from GitHub (select your `lead-agent` repo)
4. Click "Import"

### 3. Set Environment Variables

In the Vercel dashboard, go to **Settings** → **Environment Variables** and add:

```
AI_GATEWAY_API_KEY=your_ai_gateway_key
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_CHANNEL_ID=C0AAP8ARW8Y
EXA_API_KEY=your_exa_api_key
```

### 4. Connect Vercel KV

1. In your Vercel project, go to **Storage** tab
2. Click "Create Database" → Choose **Vercel KV**
3. Follow the setup (it auto-connects environment variables)
4. The `KV_*` environment variables are added automatically

### 5. Deploy

Click "Deploy" in Vercel dashboard. It will automatically build and deploy.

### 6. Update Slack App Settings

Once deployed, update your Slack app:

1. Go to https://api.slack.com/apps
2. Click your app
3. Go to **Interactivity & Shortcuts**
4. Update **Request URL** to: `https://YOUR_VERCEL_DOMAIN.vercel.app/api/slack`
5. Save Changes

### 7. Test

1. Visit your Vercel URL
2. Submit a form
3. Click Approve/Reject in Slack
4. Check Vercel logs: Dashboard → Deployments → Logs

## Architecture on Vercel

```
User submits form
    ↓
Workflow executes
    ↓
Email generated & stored in Vercel KV
    ↓
Slack message posted
    ↓
User clicks Approve/Reject
    ↓
Vercel KV retrieves email (works across function instances!)
    ↓
Email sent
```

## What Changed from Local

| Local | Vercel |
|-------|--------|
| In-memory Map | Vercel KV (Redis) |
| Email lost on restart | Email persists for 1 hour |
| Works with ngrok | Works natively |

## Troubleshooting

### KV Not Working
- Verify Vercel KV is connected in Storage tab
- Check that `KV_REST_API_*` env vars exist
- Redeploy after adding KV

### Slack Buttons Still Not Working
- Verify Request URL is updated in Slack app settings
- Check Vercel logs for errors
- Wait 5 minutes for Slack to recognize the new URL

### Build Fails
- Check Environment Variables are set (all required ones)
- Look at build logs in Vercel dashboard
- Ensure all `.env.local` variables are in Vercel

## Local Testing Still Works

You can still test locally with ngrok:
```bash
# Terminal 1
C:\ngrok\ngrok http 3000

# Terminal 2
pnpm dev
```

The code automatically uses Vercel KV when deployed, and in-memory storage locally (if not on Vercel).

## Next Steps

- Implement real email sending in `lib/services.ts` (currently mock)
- Implement real AI research agent
- Add user feedback/logging to database
- Set up monitoring and alerts

Enjoy! 🚀
