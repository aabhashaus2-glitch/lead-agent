import {
  Experimental_Agent as Agent,
  stepCountIs,
  tool,
  generateObject,
  generateText
} from 'ai';
import {
  FormSchema,
  QualificationSchema,
  qualificationSchema
} from '@/lib/types';
import { sendSlackMessageWithButtons } from '@/lib/slack';
import { z } from 'zod';
import { exa } from '@/lib/exa';

/**
 * Qualify the lead
 */
export async function qualify(
  lead: FormSchema,
  research: string
): Promise<QualificationSchema> {
  try {
    console.log('[DEBUG] qualify called - using default response');
    // For testing, return a default qualification
    return {
      category: 'QUALIFIED',
      reason: 'Test lead - using default qualification'
    };
  } catch (error) {
    console.error('[ERROR] qualify failed:', error);
    // Return a default qualification so workflow can continue
    return {
      category: 'FOLLOW_UP',
      reason: 'Unable to qualify - using default follow-up category'
    };
  }
}

/**
 * Write an email
 */
export async function writeEmail(
  research: string,
  qualification: QualificationSchema
) {
  try {
    console.log('[DEBUG] writeEmail called - using default response');
    // For testing, return a default email
    return `Dear Lead,\n\nThank you for your interest in our company. We would like to follow up with you about your inquiry.\n\nBest regards,\nOur Team`;
  } catch (error) {
    console.error('[ERROR] writeEmail failed:', error);
    // Return a default email so workflow can continue
    return `Dear Lead,\n\nThank you for your interest. We would like to follow up with you.\n\nBest regards`;
  }
}

/**
 * Send the research and qualification to the human for approval in slack
 */
export async function humanFeedback(
  research: string,
  email: string,
  qualification: QualificationSchema
) {
  console.log('[DEBUG HF] ========== HUMAN FEEDBACK INITIATED ==========');
  console.log('[DEBUG HF] Research length:', research?.length || 'undefined');
  console.log('[DEBUG HF] Email length:', email?.length || 'undefined');
  console.log('[DEBUG HF] Email content exists:', !!email && email.trim().length > 0);
  console.log('[DEBUG HF] Qualification category:', qualification?.category);
  console.log('[DEBUG HF] Qualification reason:', qualification?.reason);
  
  // Sanitize and format the message for Slack
  const sanitizedResearch = research
    .slice(0, 300)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
  
  const sanitizedEmail = email
    .slice(0, 250)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
  
  const sanitizedReason = qualification.reason
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();

  const message = `*New Lead Qualification*
*Category:* ${qualification.category}
*Reason:* ${sanitizedReason}

*Research Summary:*
${sanitizedResearch}...

*Email Draft:*
${sanitizedEmail}...

Please review and approve or reject this email`;

  const slackChannel = process.env.SLACK_CHANNEL_ID || '';
  
  console.log('[DEBUG HF] Slack Channel:', slackChannel);
  console.log('[DEBUG HF] Message length:', message.length);
  console.log('[DEBUG HF] Message preview:', message.substring(0, 200));
  console.log('[DEBUG HF] Sanitized email to pass to Slack:', sanitizedEmail.substring(0, 100));
  
  if (!slackChannel) {
    console.error('[ERROR HF] SLACK_CHANNEL_ID is empty');
    throw new Error('SLACK_CHANNEL_ID environment variable is not set');
  }

  try {
    console.log('[DEBUG HF] Calling sendSlackMessageWithButtons...');
    console.log('[DEBUG HF] - Email content to send as metadata:', email.substring(0, 50) + '...');
    console.log('[DEBUG HF] - Email content length:', email.length);
    
    const result = await sendSlackMessageWithButtons(slackChannel, message, email);
    
    console.log('[DEBUG HF] ✓ sendSlackMessageWithButtons completed');
    console.log('[DEBUG HF] Result:', result);
    console.log('[DEBUG HF] Message timestamp:', result.messageTs);
    console.log('[DEBUG HF] Channel:', result.channel);
    console.log('[DEBUG HF] ========== HUMAN FEEDBACK COMPLETE ==========');
    
    return result;
  } catch (error) {
    console.error('[ERROR HF] ========== HUMAN FEEDBACK FAILED ==========');
    console.error('[ERROR HF] Failed to send Slack message:', error);
    console.error('[ERROR HF] Error message:', (error as any)?.message);
    console.error('[ERROR HF] Error stack:', (error as any)?.stack);
    throw error;
  }
}

/**
 * Send an email
 */
export async function sendEmail(emailContent: string) {
  /**
   * TODO: Implement email sending using provider like sendgrid, mailgun, resend etc.
   * Example for Resend:
   * 
   * const { Resend } = require('resend');
   * const resend = new Resend(process.env.RESEND_API_KEY);
   * 
   * await resend.emails.send({
   *   from: process.env.EMAIL_FROM || 'noreply@example.com',
   *   to: recipientEmail,
   *   subject: 'Lead Follow-up',
   *   html: emailContent,
   * });
   */
  console.log('[DEBUG SEND_EMAIL] ========== EMAIL SENDING INITIATED ==========');
  console.log('[DEBUG SEND_EMAIL] Email content type:', typeof emailContent);
  console.log('[DEBUG SEND_EMAIL] Email content length:', emailContent?.length || 'undefined');
  console.log('[DEBUG SEND_EMAIL] Email content is empty:', !emailContent || emailContent.trim().length === 0);
  
  if (emailContent && emailContent.trim().length > 0) {
    console.log('[DEBUG SEND_EMAIL] Email preview (first 200 chars):', emailContent.substring(0, 200));
  }
  
  console.log('[INFO] Email sending is not yet implemented');
  console.log('[DEBUG SEND_EMAIL] Email content would be sent to recipient');
  console.log('[DEBUG SEND_EMAIL] ========== EMAIL SENDING COMPLETE (MOCK) ==========');
  
  return { success: true, message: 'Email sending not implemented yet' };
}

/**
 * ------------------------------------------------------------
 * Agent & Tools
 * ------------------------------------------------------------
 */

/**
 * Fetch tool
 */
export const fetchUrl = tool({
  description: 'Return visible text from a public URL as Markdown.',
  inputSchema: z.object({
    url: z.string().describe('Absolute URL, including http:// or https://')
  }),
  execute: async ({ url }) => {
    const result = await exa.getContents(url, {
      text: true
    });
    return result;
  }
});

/**
 * CRM Search tool
 */
export const crmSearch = tool({
  description:
    'Search existing Vercel CRM for opportunities by company name or domain',
  inputSchema: z.object({
    name: z
      .string()
      .describe('The name of the company to search for (e.g. "Vercel")')
  }),
  execute: async ({ name }) => {
    // fetch from CRM like Salesforce, Hubspot, or Snowflake, etc.
    return [];
  }
});

/**
 * Tech-stack analysis tool
 */
export const techStackAnalysis = tool({
  description: 'Return tech stack analysis for a domain.',
  inputSchema: z.object({
    domain: z.string().describe('Domain, e.g. "vercel.com"')
  }),
  execute: async ({ domain }) => {
    // fetch the tech stack for the domain
    return [];
  }
});

/**
 * Search tool
 */
const search = tool({
  description: 'Search the web for information',
  inputSchema: z.object({
    keywords: z
      .string()
      .describe(
        'The entity to search for (e.g. "Apple") — do not include any Vercel specific keywords'
      ),
    resultCategory: z
      .enum([
        'company',
        'research paper',
        'news',
        'pdf',
        'github',
        'tweet',
        'personal site',
        'linkedin profile',
        'financial report'
      ])
      .describe('The category of the result you are looking for')
  }),
  execute: async ({ keywords, resultCategory }) => {
    /**
     * Deep research using exa.ai
     * Return the results in markdown format
     */
    const result = await exa.searchAndContents(keywords, {
      numResults: 2,
      type: 'keyword',
      category: resultCategory,
      summary: true
    });
    return result;
  }
});

/**
 * Query the knowledge base
 */
const queryKnowledgeBase = tool({
  description: 'Query the knowledge base for the given query.',
  inputSchema: z.object({
    query: z.string()
  }),
  execute: async ({ query }: { query: string }) => {
    /**
     * Query the knowledge base for the given query
     * - ex: pull from turbopuffer, pinecone, postgres, snowflake, etc.
     * Return the context from the knowledge base
     */
    return 'Context from knowledge base for the given query';
  }
});

/**
 * Research agent
 *
 * This agent is used to research the lead and return a comprehensive report
 */
export const researchAgent = new Agent({
  model: 'openai/gpt-5',
  system: `
  You are a researcher to find information about a lead. You are given a lead and you need to find information about the lead.
  
  You can use the tools provided to you to find information about the lead: 
  - search: Searches the web for information
  - queryKnowledgeBase: Queries the knowledge base for the given query
  - fetchUrl: Fetches the contents of a public URL
  - crmSearch: Searches the CRM for the given company name
  - techStackAnalysis: Analyzes the tech stack of the given domain
  
  Synthesize the information you find into a comprehensive report.
  `,
  tools: {
    search,
    queryKnowledgeBase,
    fetchUrl,
    crmSearch,
    techStackAnalysis
    // add other tools here
  },
  stopWhen: [stepCountIs(20)] // stop after max 20 steps
});

/**
 * Wrapper function to handle research with timeout and error handling
 */
export async function researchWithTimeout(prompt: string): Promise<string> {
  console.log('[DEBUG] Starting research with timeout protection');
  
  try {
    // Set a 30-second timeout for the research
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Research timeout after 30 seconds')), 30000)
    );
    
    const researchPromise = researchAgent.generate({ prompt });
    
    const result = await Promise.race([
      researchPromise.then(r => {
        console.log('[DEBUG] Research agent returned:', r.text ? r.text.substring(0, 100) : 'empty');
        return r.text;
      }),
      timeoutPromise
    ]);
    
    console.log('[DEBUG] Research completed successfully, length:', result.length);
    return result;
  } catch (error) {
    console.error('[ERROR] Research failed with error:', error);
    // Return a fallback response instead of crashing
    const fallback = `Unable to complete research: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.log('[DEBUG] Using fallback research response');
    return fallback;
  }
}
