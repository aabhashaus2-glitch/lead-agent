import {
  humanFeedback,
  qualify,
  writeEmail
} from '@/lib/services';
import { FormSchema, QualificationSchema } from '@/lib/types';

/**
 * step to qualify the lead
 */
export const stepQualify = async (data: FormSchema, research: string) => {
  'use step';

  try {
    console.log('[DEBUG] stepQualify called');
    const qualification = await qualify(data, research);
    console.log('[DEBUG] stepQualify completed:', qualification);
    return qualification;
  } catch (error) {
    console.error('[ERROR] stepQualify failed:', error);
    throw error;
  }
};

/**
 * step to research the lead
 */
export const stepResearch = async (data: FormSchema) => {
  'use step';

  try {
    console.log('[DEBUG] stepResearch called');
    
    // For now, return mock research to test Slack integration
    // In production, replace with real research
    const mockResearch = `
Research Summary for ${data.name}:
- Email: ${data.email}
- Phone: ${data.phone}
- Company: ${data.company || 'Not provided'}
- Message: ${data.message}

This is a mock research response for testing purposes. Replace with real research agent when needed.
    `.trim();
    
    console.log('[DEBUG] stepResearch completed, length:', mockResearch.length);
    return mockResearch;
  } catch (error) {
    console.error('[ERROR] stepResearch failed:', error);
    // Return a fallback so the workflow can continue
    const fallback = `Lead data: ${JSON.stringify(data)}`;
    console.log('[DEBUG] stepResearch using fallback');
    return fallback;
  }
};

/**
 * step to write an email for the lead
 */
export const stepWriteEmail = async (
  data: FormSchema,
  research: string,
  qualification: QualificationSchema
) => {
  'use step';

  try {
    console.log('[DEBUG] stepWriteEmail called');
    const email = await writeEmail(data, research, qualification);
    console.log('[DEBUG] stepWriteEmail completed, length:', email.length);
    return email;
  } catch (error) {
    console.error('[ERROR] stepWriteEmail failed:', error);
    throw error;
  }
};

/**
 * step to get human feedback for the email
 */
export const stepHumanFeedback = async (
  research: string,
  email: string,
  qualification: QualificationSchema
) => {
  'use step';

  console.log('[DEBUG] stepHumanFeedback called');
  console.log('[DEBUG] SLACK_BOT_TOKEN exists:', !!process.env.SLACK_BOT_TOKEN);
  console.log('[DEBUG] SLACK_SIGNING_SECRET exists:', !!process.env.SLACK_SIGNING_SECRET);
  console.log('[DEBUG] SLACK_CHANNEL_ID:', process.env.SLACK_CHANNEL_ID);

  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
    console.warn(
      '⚠️  SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set, skipping human feedback step'
    );
    return;
  }

  try {
    console.log('[DEBUG] Calling humanFeedback function');
    const slackMessage = await humanFeedback(research, email, qualification);
    console.log('[DEBUG] slackMessage response:', slackMessage);
    return slackMessage;
  } catch (error) {
    console.error('[ERROR] stepHumanFeedback failed:', error);
    throw error;
  }
};
