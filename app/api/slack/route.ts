import { createHandler } from '@vercel/slack-bolt';
import { slackApp, receiver, getEmail } from '@/lib/slack';
import { sendEmail } from '@/lib/services';

console.log('[DEBUG ROUTE INIT] Slack route module initialized');
console.log('[DEBUG ROUTE INIT] slackApp exists:', !!slackApp);
console.log('[DEBUG ROUTE INIT] receiver exists:', !!receiver);

// Only set up event handlers if Slack is initialized
if (slackApp && receiver) {
  console.log('[DEBUG ROUTE INIT] ✓ Setting up Slack handlers...');
  
  slackApp.event('app_mention', async ({ event, client, logger }) => {
    console.log('[DEBUG ROUTE] app_mention event received');
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: `Hello <@${event.user}>!`
    });
  });
  console.log('[DEBUG ROUTE INIT] ✓ Registered: app_mention handler');

  slackApp.action(
    'lead_approved',
    async ({ body, action, ack, client, logger }) => {
      try {
        console.log('[DEBUG APPROVE] ========== APPROVE BUTTON CLICKED ==========');
        console.log('[DEBUG APPROVE] Acknowledging action...');
        await ack();
        console.log('[DEBUG APPROVE] ✓ Action acknowledged');
        
        console.log('[DEBUG APPROVE] Full payload type:', typeof body);
        console.log('[DEBUG APPROVE] Body keys:', Object.keys(body as any).join(', '));
        
        // Log the entire structure for debugging
        console.log('[DEBUG APPROVE] Full payload structure:');
        console.log('[DEBUG APPROVE] - type:', (body as any)?.type);
        console.log('[DEBUG APPROVE] - trigger_id:', (body as any)?.trigger_id);
        console.log('[DEBUG APPROVE] - user.id:', (body as any)?.user?.id);
        console.log('[DEBUG APPROVE] - user.username:', (body as any)?.user?.username);
        console.log('[DEBUG APPROVE] - channel.id:', (body as any)?.channel?.id);
        console.log('[DEBUG APPROVE] - channel.name:', (body as any)?.channel?.name);
        console.log('[DEBUG APPROVE] - message.ts:', (body as any)?.message?.ts);
        console.log('[DEBUG APPROVE] - message keys:', Object.keys((body as any)?.message || {}).join(', '));
        
        // Extract the email from KV using message timestamp
        const messageTs = (body as any)?.message?.ts;
        console.log('[DEBUG APPROVE] Message timestamp:', messageTs);
        
        let emailContent: string | undefined = undefined;
        
        if (messageTs) {
          console.log('[DEBUG APPROVE] Retrieving email from KV...');
          emailContent = await getEmail(messageTs);
          console.log('[DEBUG APPROVE] Email retrieved from KV:', !!emailContent);
          
          if (emailContent) {
            console.log('[DEBUG APPROVE] Email length from KV:', emailContent.length);
            console.log('[DEBUG APPROVE] Email preview from KV:', emailContent.substring(0, 100));
          }
        }
        
        if (emailContent) {
          console.log('[DEBUG APPROVE] ✓ Email extracted successfully');
          console.log('[DEBUG APPROVE] Email preview:', emailContent.substring(0, 100));
          
          console.log('[DEBUG APPROVE] Sending email...');
          const sendResult = await sendEmail(emailContent);
          console.log('[DEBUG APPROVE] ✓ Email sent, result:', sendResult);
          
          // Update the Slack message to show approval
          const channelId = (body as any)?.channel?.id;
          const messageTs = (body as any)?.message?.ts;
          
          console.log('[DEBUG APPROVE] Updating Slack message...');
          console.log('[DEBUG APPROVE] - Channel ID:', channelId);
          console.log('[DEBUG APPROVE] - Message TS:', messageTs);
          
          if (channelId && messageTs) {
            console.log('[DEBUG APPROVE] Calling chat.update...');
            const updateResult = await client.chat.update({
              channel: channelId,
              ts: messageTs,
              text: ':white_check_mark: Email approved and sent!',
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: ':white_check_mark: *Email Approved!* This email has been sent to the lead.'
                  }
                }
              ]
            });
            console.log('[DEBUG APPROVE] ✓ Slack message updated successfully');
            console.log('[DEBUG APPROVE] Update result:', updateResult);
          } else {
            console.warn('[WARN APPROVE] Missing channel ID or message TS - cannot update message');
            console.warn('[WARN APPROVE] channelId:', channelId, 'messageTs:', messageTs);
          }
        } else {
          console.warn('[WARN APPROVE] No email content found in message metadata');
          console.log('[DEBUG APPROVE] Full message object:', JSON.stringify((body as any)?.message, null, 2));
          console.log('[DEBUG APPROVE] Sending fallback email...');
          const sendResult = await sendEmail('Send email to the lead');
          console.log('[DEBUG APPROVE] ✓ Fallback email sent, result:', sendResult);
        }
        
        console.log('[DEBUG APPROVE] ========== APPROVE BUTTON PROCESSING COMPLETE ==========');
      } catch (error) {
        console.error('[ERROR APPROVE] ========== APPROVE ACTION FAILED ==========');
        console.error('[ERROR APPROVE] Error:', error);
        console.error('[ERROR APPROVE] Error message:', (error as any)?.message);
        console.error('[ERROR APPROVE] Error stack:', (error as any)?.stack);
        logger?.error(`Error in lead_approved action: ${error}`);
      }
    }
  );
  console.log('[DEBUG ROUTE INIT] ✓ Registered: lead_approved handler');

  slackApp.action(
    'lead_rejected',
    async ({ body, action, ack, client, logger }) => {
      try {
        console.log('[DEBUG REJECT] ========== REJECT BUTTON CLICKED ==========');
        console.log('[DEBUG REJECT] Acknowledging action...');
        await ack();
        console.log('[DEBUG REJECT] ✓ Action acknowledged');
        
        console.log('[DEBUG REJECT] Full payload type:', typeof body);
        console.log('[DEBUG REJECT] Body keys:', Object.keys(body as any).join(', '));
        
        // Log the entire structure for debugging
        console.log('[DEBUG REJECT] Full payload structure:');
        console.log('[DEBUG REJECT] - type:', (body as any)?.type);
        console.log('[DEBUG REJECT] - trigger_id:', (body as any)?.trigger_id);
        console.log('[DEBUG REJECT] - user.id:', (body as any)?.user?.id);
        console.log('[DEBUG REJECT] - user.username:', (body as any)?.user?.username);
        console.log('[DEBUG REJECT] - channel.id:', (body as any)?.channel?.id);
        console.log('[DEBUG REJECT] - channel.name:', (body as any)?.channel?.name);
        console.log('[DEBUG REJECT] - message.ts:', (body as any)?.message?.ts);
        console.log('[DEBUG REJECT] - message keys:', Object.keys((body as any)?.message || {}).join(', '));
        
        // Extract metadata for logging/tracking
        const messageTs = (body as any)?.message?.ts;
        console.log('[DEBUG REJECT] Message timestamp:', messageTs);
        
        let emailContent: string | undefined = undefined;
        
        if (messageTs) {
          console.log('[DEBUG REJECT] Retrieving email from KV...');
          emailContent = await getEmail(messageTs);
          console.log('[DEBUG REJECT] Email retrieved from KV:', !!emailContent);
          
          if (emailContent) {
            console.log('[DEBUG REJECT] Email length from KV:', emailContent.length);
          }
        }
        
        // Update the Slack message to show rejection
        const channelId = (body as any)?.channel?.id;
        
        console.log('[DEBUG REJECT] Updating Slack message...');
        console.log('[DEBUG REJECT] - Channel ID:', channelId);
        console.log('[DEBUG REJECT] - Message TS:', messageTs);
        
        if (channelId && messageTs) {
          console.log('[DEBUG REJECT] Calling chat.update...');
          const updateResult = await client.chat.update({
            channel: channelId,
            ts: messageTs,
            text: ':x: Email rejected',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: ':x: *Email Rejected* - This email will not be sent.'
                }
              }
            ]
          });
          console.log('[DEBUG REJECT] ✓ Slack message updated successfully');
          console.log('[DEBUG REJECT] Update result:', updateResult);
        } else {
          console.warn('[WARN REJECT] Missing channel ID or message TS - cannot update message');
          console.warn('[WARN REJECT] channelId:', channelId, 'messageTs:', messageTs);
        }
        
        console.log('[DEBUG REJECT] ========== REJECT BUTTON PROCESSING COMPLETE ==========');
      } catch (error) {
        console.error('[ERROR REJECT] ========== REJECT ACTION FAILED ==========');
        console.error('[ERROR REJECT] Error:', error);
        console.error('[ERROR REJECT] Error message:', (error as any)?.message);
        console.error('[ERROR REJECT] Error stack:', (error as any)?.stack);
        logger?.error(`Error in lead_rejected action: ${error}`);
      }
    }
  );
  console.log('[DEBUG ROUTE INIT] ✓ Registered: lead_rejected handler');
  
  // Create the handler once at module load time
  console.log('[DEBUG ROUTE INIT] Creating Slack handler...');
} else {
  console.warn('[WARN ROUTE INIT] Slack handlers NOT registered - slackApp or receiver missing');
  console.warn('[WARN ROUTE INIT] slackApp:', !!slackApp);
  console.warn('[WARN ROUTE INIT] receiver:', !!receiver);
}

// Create and export the handler
const slackHandler = slackApp && receiver ? createHandler(slackApp, receiver) : undefined;

if (slackHandler) {
  console.log('[DEBUG ROUTE INIT] ✓ Slack handler created successfully');
} else {
  console.warn('[WARN ROUTE INIT] Slack handler NOT created');
}

export const POST = slackHandler
  ? async (request: Request) => {
      console.log('[DEBUG SLACK ROUTE] ========== SLACK ROUTE POST RECEIVED ==========');
      console.log('[DEBUG SLACK ROUTE] URL:', request.url);
      console.log('[DEBUG SLACK ROUTE] Method:', request.method);
      console.log('[DEBUG SLACK ROUTE] Content-Type:', request.headers.get('content-type'));
      
      try {
        console.log('[DEBUG SLACK ROUTE] Calling Slack handler...');
        const response = await slackHandler(request);
        console.log('[DEBUG SLACK ROUTE] Handler response status:', response.status);
        return response;
      } catch (error) {
        console.error('[ERROR SLACK ROUTE] Handler error:', error);
        console.error('[ERROR SLACK ROUTE] Error message:', (error as any)?.message);
        console.error('[ERROR SLACK ROUTE] Error stack:', (error as any)?.stack);
        throw error;
      }
    }
  : async () => {
      console.warn('[WARN SLACK ROUTE] Slack not configured - returning 503');
      return new Response('Slack credentials not configured', {
        status: 503
      });
    };

// GET handler for health check
export const GET = async (request: Request) => {
  console.log('[DEBUG SLACK ROUTE] GET request received');
  return new Response(JSON.stringify({ 
    status: 'ok',
    slackConfigured: !!slackHandler,
    message: 'Slack route is running'
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
