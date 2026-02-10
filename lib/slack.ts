import { App, LogLevel } from '@slack/bolt';
import { VercelReceiver } from '@vercel/slack-bolt';
import { kv } from '@vercel/kv';

console.log('[DEBUG SLACK INIT] Slack module initialization started');

const logLevel =
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;

const hasSlackCredentials =
  !!process.env.SLACK_BOT_TOKEN && !!process.env.SLACK_SIGNING_SECRET;

const hasKvCredentials =
  !!process.env.KV_REST_API_URL &&
  !!process.env.KV_REST_API_TOKEN &&
  !!process.env.KV_REST_API_READ_ONLY_TOKEN;

console.log('[DEBUG SLACK INIT] NODE_ENV:', process.env.NODE_ENV);
console.log('[DEBUG SLACK INIT] Has SLACK_BOT_TOKEN:', !!process.env.SLACK_BOT_TOKEN);
console.log('[DEBUG SLACK INIT] Has SLACK_SIGNING_SECRET:', !!process.env.SLACK_SIGNING_SECRET);
console.log('[DEBUG SLACK INIT] hasSlackCredentials:', hasSlackCredentials);
console.log('[DEBUG SLACK INIT] Has KV credentials:', hasKvCredentials);

if (!hasSlackCredentials) {
  console.warn(
    '⚠️  SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set. Slack integration will be disabled.'
  );
} else {
  console.log('[DEBUG SLACK INIT] ✓ Slack credentials are configured');
}

/**
 * Store email in Vercel KV (works on serverless)
 * In development without KV, this gracefully skips storage
 */
export async function storeEmail(ts: string, email: string): Promise<void> {
  // Skip KV storage if credentials are not configured (development mode)
  if (!hasKvCredentials) {
    console.log('[DEBUG KV] KV not configured - skipping email storage (development mode)');
    return;
  }

  try {
    console.log('[DEBUG KV] Storing email with key:', ts);
    console.log('[DEBUG KV] Email length:', email.length);
    
    // Store with 1 hour expiration (3600 seconds)
    await kv.set(`email:${ts}`, email, { ex: 3600 });
    
    console.log('[DEBUG KV] ✓ Email stored successfully');
  } catch (error) {
    console.error('[ERROR KV] Failed to store email:', error);
    // Don't throw in development - just log and continue
    if (process.env.NODE_ENV === 'development') {
      console.warn('[WARN KV] Continuing without KV storage in development mode');
      return;
    }
    throw error;
  }
}

/**
 * Retrieve email from Vercel KV
 */
export async function getEmail(ts: string): Promise<string | undefined> {
  try {
    console.log('[DEBUG KV] Retrieving email with key:', ts);

    const email = await kv.get<string>(`email:${ts}`);
    
    if (email) {
      console.log('[DEBUG KV] ✓ Email retrieved, length:', email.length);
    } else {
      console.log('[DEBUG KV] Email not found in KV');
    }

    return email ?? undefined;
  } catch (error) {
    console.error('[ERROR KV] Failed to retrieve email:', error);
    throw error;
  }
}

// Only initialize Slack if credentials are available
export const receiver = hasSlackCredentials
  ? new VercelReceiver({
      signingSecret: process.env.SLACK_SIGNING_SECRET!,
      logLevel
    })
  : null;

console.log('[DEBUG SLACK INIT] receiver initialized:', !!receiver);

/**
 * Slack App instance
 */
export const slackApp = hasSlackCredentials
  ? new App({
      token: process.env.SLACK_BOT_TOKEN!,
      signingSecret: process.env.SLACK_SIGNING_SECRET!,
      receiver: receiver!,
      deferInitialization: true,
      logLevel
    })
  : null;

console.log('[DEBUG SLACK INIT] slackApp initialized:', !!slackApp);
console.log('[DEBUG SLACK INIT] Slack module initialization complete');

/**
 * Send the research and qualification to the human for approval in slack
 */
export async function sendSlackMessageWithButtons(
  channel: string,
  text: string,
  emailContent?: string
): Promise<{ messageTs: string; channel: string }> {
  console.log('[DEBUG SLACK] ========== SENDING SLACK MESSAGE WITH BUTTONS ==========');
  
  if (!slackApp) {
    console.error('[ERROR SLACK] Slack app is not initialized');
    throw new Error(
      'Slack app is not initialized. Please set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET environment variables.'
    );
  }

  console.log('[DEBUG SLACK] ✓ Slack app is initialized');
  
  // Ensure the app is initialized
  console.log('[DEBUG SLACK] Testing Slack authentication...');
  try {
    const authTest = await slackApp.client.auth.test();
    console.log('[DEBUG SLACK] ✓ Auth test successful');
    console.log('[DEBUG SLACK] - User:', authTest.user);
    console.log('[DEBUG SLACK] - Team:', authTest.team);
  } catch (authError) {
    console.error('[ERROR SLACK] Auth test failed:', authError);
    throw authError;
  }

  console.log('[DEBUG SLACK] Channel:', channel);
  console.log('[DEBUG SLACK] Text length:', text?.length || 'undefined');
  console.log('[DEBUG SLACK] Email content provided:', !!emailContent);
  console.log('[DEBUG SLACK] Email content length:', emailContent?.length || 'N/A');
  
  if (emailContent) {
    console.log('[DEBUG SLACK] Email preview (first 100 chars):', emailContent.substring(0, 100));
  }

  // Send message with blocks including action buttons
  console.log('[DEBUG SLACK] Calling chat.postMessage...');
  try {
    const result = await slackApp.client.chat.postMessage({
      channel,
      text,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Approve'
              },
              style: 'primary',
              action_id: 'lead_approved'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Reject'
              },
              style: 'danger',
              action_id: 'lead_rejected'
            }
          ]
        }
      ]
    });

    console.log('[DEBUG SLACK] ✓ chat.postMessage succeeded');
    console.log('[DEBUG SLACK] Response ok:', result.ok);
    console.log('[DEBUG SLACK] Message ts:', result.ts);
    console.log('[DEBUG SLACK] Channel:', result.channel);

    if (!result.ok || !result.ts) {
      console.error('[ERROR SLACK] Response not ok or missing ts');
      throw new Error(`Failed to send Slack message: ok=${result.ok}, ts=${result.ts}`);
    }

    // Store the email content in Vercel KV by message timestamp for later retrieval
    if (emailContent && result.ts) {
      console.log('[DEBUG SLACK] Storing email in KV with key:', result.ts);
      await storeEmail(result.ts, emailContent);
      console.log('[DEBUG SLACK] Email stored in KV successfully');
    }

    console.log('[DEBUG SLACK] ========== SLACK MESSAGE SENT SUCCESSFULLY ==========');

    return {
      messageTs: result.ts,
      channel: result.channel!
    };
  } catch (error) {
    console.error('[ERROR SLACK] chat.postMessage failed');
    console.error('[ERROR SLACK] Error:', error);
    console.error('[ERROR SLACK] Error message:', (error as any)?.message);
    console.error('[ERROR SLACK] Error code:', (error as any)?.code);
    throw error;
  }
}
