# Slack Button Action Troubleshooting

## Quick Test Steps

### 1. Verify Slack Route is Running
Open this URL in your browser (or curl):
```
http://localhost:3000/api/slack
```

You should see a JSON response:
```json
{
  "status": "ok",
  "slackConfigured": true,
  "message": "Slack route is running"
}
```

If `slackConfigured` is `false`, check your environment variables.

### 2. Check Startup Logs

When you restart with `pnpm dev`, look for these logs in order:

```
[DEBUG SLACK INIT] Slack module initialization started
[DEBUG SLACK INIT] Has SLACK_BOT_TOKEN: true
[DEBUG SLACK INIT] Has SLACK_SIGNING_SECRET: true
[DEBUG SLACK INIT] ✓ Slack credentials are configured
[DEBUG SLACK INIT] Email store initialized
[DEBUG SLACK INIT] receiver initialized: true
[DEBUG SLACK INIT] slackApp initialized: true
[DEBUG ROUTE INIT] Slack route module initialized
[DEBUG ROUTE INIT] slackApp exists: true
[DEBUG ROUTE INIT] receiver exists: true
[DEBUG ROUTE INIT] ✓ Setting up Slack handlers...
[DEBUG ROUTE INIT] ✓ Registered: app_mention handler
[DEBUG ROUTE INIT] ✓ Registered: lead_approved handler
[DEBUG ROUTE INIT] ✓ Registered: lead_rejected handler
[DEBUG ROUTE INIT] Creating Slack handler...
[DEBUG ROUTE INIT] ✓ Slack handler created successfully
```

**If you don't see these**, your Slack credentials aren't loading.

### 3. Test Button Click Flow

1. **Submit a form** → Look for `[DEBUG HF]` logs (email stored)
2. **Click Approve/Reject in Slack** → Look for `[DEBUG SLACK ROUTE] ========== SLACK ROUTE POST RECEIVED ==========`

If you see step 1 but not step 2, **Slack isn't reaching your endpoint**.

### 4. Verify Slack App Configuration

In your Slack app settings, check:

- **Request URL for Interactivity**: Should be `http://YOUR_DOMAIN/api/slack` (not localhost unless testing locally with ngrok/similar)
- **Event Subscriptions**: Should include your request URL
- **Action IDs**: Buttons should have `action_id` of `lead_approved` and `lead_rejected` (check [lib/slack.ts](../lib/slack.ts))

### 5. If Still No Logs

Check that:
- Your public URL is correct in Slack's app settings (Slack can't reach localhost without a tunnel)
- Slack bot has permission: `chat:write` and `app_mentions:read`
- No firewall blocking Slack's webhook requests
- Not testing locally without ngrok/tunnel to your localhost

## Expected Log Sequence When Clicking Button

```
[DEBUG SLACK ROUTE] ========== SLACK ROUTE POST RECEIVED ==========
[DEBUG SLACK ROUTE] URL: http://localhost:3000/api/slack
[DEBUG SLACK ROUTE] Method: POST
[DEBUG SLACK ROUTE] Content-Type: application/json
[DEBUG SLACK ROUTE] Calling Slack handler...
[DEBUG APPROVE] ========== APPROVE BUTTON CLICKED ==========
[DEBUG APPROVE] Full payload type: object
[DEBUG APPROVE] Acknowledging action...
[DEBUG APPROVE] ✓ Action acknowledged
[DEBUG APPROVE] Message timestamp: 1770185227.467049
[DEBUG APPROVE] Email store size: 1
[DEBUG APPROVE] Email retrieved from store: true
[DEBUG SEND_EMAIL] Email content length: 135
[DEBUG APPROVE] ✓ Email sent
[DEBUG SLACK ROUTE] Handler response status: 200
```

If this sequence doesn't appear, the buttons aren't reaching your server.
