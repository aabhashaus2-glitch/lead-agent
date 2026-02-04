# Slack Approve/Reject Debugging Guide

## How to Use This Debug Setup

When you run the server and interact with the Slack buttons, watch for these log messages in order:

### 1. **Startup Logs** (When server starts)
```
[DEBUG SLACK INIT] Slack module initialization started
[DEBUG SLACK INIT] Has SLACK_BOT_TOKEN: true
[DEBUG SLACK INIT] Has SLACK_SIGNING_SECRET: true
[DEBUG SLACK INIT] hasSlackCredentials: true
[DEBUG SLACK INIT] ✓ Slack credentials are configured
[DEBUG SLACK INIT] receiver initialized: true
[DEBUG SLACK INIT] slackApp initialized: true
[DEBUG SLACK INIT] Slack module initialization complete
[DEBUG ROUTE INIT] Slack route module initialized
[DEBUG ROUTE INIT] slackApp exists: true
[DEBUG ROUTE INIT] receiver exists: true
[DEBUG ROUTE INIT] ✓ Setting up Slack handlers...
[DEBUG ROUTE INIT] ✓ Registered: app_mention handler
[DEBUG ROUTE INIT] ✓ Registered: lead_approved handler
[DEBUG ROUTE INIT] ✓ Registered: lead_rejected handler
```

**If you don't see these logs**, the Slack app isn't initializing - check your `.env.local` file for:
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`

### 2. **Form Submission Logs** (When you submit the lead form)
```
[DEBUG HF] ========== HUMAN FEEDBACK INITIATED ==========
[DEBUG HF] Email length: XXX
[DEBUG SLACK] ========== SENDING SLACK MESSAGE WITH BUTTONS ==========
[DEBUG SLACK] ✓ Slack app is initialized
[DEBUG SLACK] ✓ Auth test successful
[DEBUG SLACK] Channel: C0AAP8ARW8Y
[DEBUG SLACK] Email content provided: true
[DEBUG SLACK] Metadata prepared: true
[DEBUG SLACK] ✓ chat.postMessage succeeded
[DEBUG SLACK] ========== SLACK MESSAGE SENT SUCCESSFULLY ==========
```

**If you see errors here**, check:
- `SLACK_CHANNEL_ID` is set correctly
- Bot has `chat:write` permission
- Slack API credentials are valid

### 3. **Slack Route Reception** (When Slack sends webhook to your app)
```
[DEBUG SLACK ROUTE] ========== SLACK ROUTE POST RECEIVED ==========
[DEBUG SLACK ROUTE] URL: http://localhost:3000/api/slack
[DEBUG SLACK ROUTE] Method: POST
[DEBUG SLACK ROUTE] Content-Type: application/json
[DEBUG SLACK ROUTE] Handler created, calling it...
[DEBUG SLACK ROUTE] Handler response status: 200
```

**If you don't see these logs**, Slack isn't reaching your endpoint - check:
- Your Slack app manifest has the correct `request_url` for the interactivity endpoint
- The URL matches your actual domain/port
- Firewall isn't blocking requests

### 4. **Action Handler Logs** (When you click Approve or Reject)
```
[DEBUG APPROVE] ========== APPROVE BUTTON CLICKED ==========
[DEBUG APPROVE] Full payload type: object
[DEBUG APPROVE] Body keys: type, trigger_id, user, channel, message, ...
[DEBUG APPROVE] Acknowledging action...
[DEBUG APPROVE] ✓ Action acknowledged
[DEBUG APPROVE] Message exists: true
[DEBUG APPROVE] Metadata extracted: true
[DEBUG APPROVE] Email content exists: true
[DEBUG APPROVE] Email content length: 135
[DEBUG APPROVE] ✓ Email extracted successfully
[DEBUG SEND_EMAIL] ========== EMAIL SENDING INITIATED ==========
[DEBUG SEND_EMAIL] Email content length: 135
[DEBUG APPROVE] Sending email...
[DEBUG APPROVE] ✓ Email sent
[DEBUG APPROVE] Updating Slack message...
[DEBUG APPROVE] Calling chat.update...
[DEBUG APPROVE] ✓ Slack message updated successfully
[DEBUG APPROVE] ========== APPROVE BUTTON PROCESSING COMPLETE ==========
```

**If you don't see these logs**, the handler isn't being called:
- Check step 1 - handlers should be registered
- Check step 3 - webhook should reach your app
- Check the `action_id` in your Slack buttons matches `lead_approved` or `lead_rejected`

### 5. **Error Cases** (If something goes wrong)
```
[ERROR SLACK ROUTE] Handler error: ...
[ERROR SLACK ROUTE] Error message: ...
[ERROR SLACK ROUTE] Error stack: ...

[ERROR APPROVE] ========== APPROVE ACTION FAILED ==========
[ERROR APPROVE] Error: ...
[ERROR APPROVE] Error message: ...
[ERROR APPROVE] Error stack: ...
```

## Quick Troubleshooting Checklist

- [ ] See `[DEBUG SLACK INIT]` logs with `true` values
- [ ] See `[DEBUG ROUTE INIT]` logs with all handlers registered
- [ ] See `[DEBUG HF]` logs when submitting form
- [ ] See `[DEBUG SLACK ROUTE]` logs when clicking button in Slack
- [ ] See `[DEBUG APPROVE]` or `[DEBUG REJECT]` logs when button is clicked
- [ ] See `[DEBUG SEND_EMAIL]` logs showing email content length > 0

If you're missing any of these sections, the logs will tell you exactly where the flow breaks.
