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
import {
  QUALIFICATION_CONFIG,
  hasRedFlags,
  isSupportRequest,
  countQualitySignals
} from '@/lib/qualification-rules';

/**
 * Qualify the lead using AI with business rules
 * 
 * Decision Process:
 * 1. Check for SUPPORT keywords/patterns → SUPPORT
 * 2. Check for RED FLAGS → UNQUALIFIED
 * 3. Use LLM to analyze fit against ICP → QUALIFIED or FOLLOW_UP
 */
export async function qualify(
  lead: FormSchema,
  research: string
): Promise<QualificationSchema> {
  try {
    console.log('[DEBUG] qualify called - using AI-driven qualification');

    // STEP 1: Check if this is a support request
    if (isSupportRequest(lead.message, QUALIFICATION_CONFIG)) {
      console.log('[DEBUG] Support keywords detected - routing to SUPPORT');
      return {
        category: 'SUPPORT',
        reason: 'Support request keywords detected. Route to support team for technical assistance.'
      };
    }

    // STEP 2: Check for red flags
    const redFlagCheck = hasRedFlags(lead, QUALIFICATION_CONFIG);
    if (redFlagCheck.flagged) {
      console.log('[DEBUG] Red flags detected:', redFlagCheck.reason);
      return {
        category: 'UNQUALIFIED',
        reason: redFlagCheck.reason || 'Lead does not match business criteria'
      };
    }

    // STEP 3: Count quality signals for quick assessment
    const signals = countQualitySignals(lead.message, QUALIFICATION_CONFIG);
    console.log('[DEBUG] Quality signals detected:', signals);

    // STEP 4: Use LLM to perform detailed analysis
    console.log('[DEBUG] Performing LLM-based qualification analysis...');
    
    const result = await generateObject({
      model: 'openai/gpt-4o-mini', // Using mini for cost efficiency
      system: `You are a B2B SaaS lead qualification expert. Analyze leads against the business's Ideal Customer Profile (ICP) and rules.

QUALIFICATION RULES:
${JSON.stringify(QUALIFICATION_CONFIG, null, 2)}

Your job is to classify the lead into ONE of these categories:
- QUALIFIED: High-fit leads ready for immediate sales engagement (large company, clear need, budget signals)
- FOLLOW_UP: Interested but wrong timing or growth potential (startup, exploratory, future plans)  
- UNQUALIFIED: Poor fit (already checked red flags, but verify other factors)
- SUPPORT: Not a sales lead (support request, existing customer issue, partnership inquiry)

Provide your analysis with clear reasoning.`,
      prompt: `Analyze this lead against our ICP and qualification rules:

LEAD DATA:
- Name: ${lead.name}
- Email: ${lead.email}
- Company: ${lead.company || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
- Message: ${lead.message}

RESEARCH FINDINGS:
${research}

SIGNALS DETECTED:
- Urgency mentions: ${signals.urgency}
- Business need mentions: ${signals.need}
- Budget signals: ${signals.budget}
- Decision-maker signals: ${signals.decisionMaker}

Based on the ICP and rules provided, classify this lead into QUALIFIED, FOLLOW_UP, UNQUALIFIED, or SUPPORT.
Provide your confidence level (0-100) and detailed reasoning for the classification.`,
      schema: z.object({
        category: qualificationSchema.shape.category,
        reason: z.string().describe('Clear explanation of why this lead falls into this category'),
        confidence: z.number().min(0).max(100).describe('Confidence level in this classification (0-100)'),
        icpScore: z.number().min(0).max(100).describe('How well this lead matches the ICP (0-100)'),
        keyFactors: z.array(z.string()).describe('Top 3-5 factors that influenced this decision')
      })
    });

    console.log('[DEBUG] LLM qualification complete:', {
      category: result.object.category,
      confidence: result.object.confidence,
      icpScore: result.object.icpScore
    });

    // Log confidence for human review if below threshold
    if (result.object.confidence < QUALIFICATION_CONFIG.confidenceThresholds.requireHumanReviewThreshold) {
      console.warn('[DEBUG] Low confidence qualification - recommend human review');
    }

    return {
      category: result.object.category,
      reason: `[${result.object.confidence}% confidence] ${result.object.reason}
      
Key Factors: ${result.object.keyFactors.join(', ')}
ICP Match Score: ${result.object.icpScore}/100`
    };
  } catch (error) {
    console.error('[ERROR] qualify failed:', error);
    // Return a safer default for failures
    return {
      category: 'FOLLOW_UP',
      reason: `Qualification error: ${error instanceof Error ? error.message : 'Unknown error'}. Defaulting to FOLLOW_UP for safety.`
    };
  }
}

/**
 * Write a personalized email based on lead data and qualification
 * Uses LLM to generate contextual, personalized responses
 */
export async function writeEmail(
  lead: FormSchema,
  research: string,
  qualification: QualificationSchema
) {
  try {
    console.log('[DEBUG] writeEmail called - generating personalized email with LLM');

    const emailTone = qualification.category === 'QUALIFIED' 
      ? 'urgent and sales-focused' 
      : qualification.category === 'FOLLOW_UP'
      ? 'exploratory and nurturing'
      : 'professional';

    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      system: `You are an expert sales email writer. Generate a personalized, professional email response to a lead inquiry.
      
KEY GUIDELINES:
- Use the lead's actual name (NOT "Dear Lead")
- Reference their company if provided
- Address their specific request/pain point from their message
- Match the tone to the qualification category: ${emailTone}
- Keep it concise (3-4 paragraphs max)
- Include a clear call-to-action
- Sign with a professional closing
- Do NOT include subject line - only the email body

QUALIFICATION CONTEXT:
- Category: ${qualification.category}
- Confidence: ${qualification.reason}
`,
      prompt: `Generate a personalized email for this lead:

LEAD INFORMATION:
- Name: ${lead.name}
- Email: ${lead.email}
- Company: ${lead.company || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
- Their Message/Request: "${lead.message}"

RESEARCH FINDINGS:
${research}

QUALIFICATION ASSESSMENT:
${qualification.reason}

Write the personalized email response now:`
    });

    console.log('[DEBUG] Personalized email generated successfully, length:', result.text.length);
    return result.text;
  } catch (error) {
    console.error('[ERROR] writeEmail failed:', error);
    // Return a fallback personalized email if LLM fails
    const fallbackEmail = `Dear ${lead.name},\n\nThank you for reaching out to us regarding your interest in our platform for ${lead.company ? lead.company : 'your team'}.\n\nWe appreciate your inquiry and would like to learn more about your needs. We'll be in touch soon with more information.\n\nBest regards,\nOur Team`;
    console.log('[DEBUG] Using fallback personalized email');
    return fallbackEmail;
  }
}

/**
 * Extract key background verification fields from research report for Slack display
 */
function extractBackgroundVerificationFields(research: string): string {
  try {
    // Extract company info
    const companyMatch = research.match(/🏢 COMPANY BACKGROUND:(.*?)👤 DECISION-MAKER/s);
    const companyText = companyMatch ? companyMatch[1].trim() : '';
    
    // Extract decision maker info
    const dmMatch = research.match(/👤 DECISION-MAKER ANALYSIS:(.*?)🛠️ TECHNOLOGY/s);
    const dmText = dmMatch ? dmMatch[1].trim() : '';
    
    // Extract tech stack
    const techMatch = research.match(/🛠️ TECHNOLOGY COMPATIBILITY:(.*?)💰 FINANCIAL/s);
    const techText = techMatch ? techMatch[1].trim() : '';
    
    // Extract financial health
    const finMatch = research.match(/💰 FINANCIAL HEALTH:(.*?)⚠️ RISK/s);
    const finText = finMatch ? finMatch[1].trim() : '';
    
    // Extract risk
    const riskMatch = research.match(/⚠️ RISK ASSESSMENT:(.*?)DETAILED AI/s);
    const riskText = riskMatch ? riskMatch[1].trim() : '';
    
    // Format for Slack display - show only key data points
    const emailRegex = /Email: (.*?)($|\n)/;
    const emailMatch = research.match(emailRegex);
    const emailVal = emailMatch ? emailMatch[1].trim() : 'Unknown';
    
    const companyRegex = /Company: (.*?)($|\n)/;
    const companyMatchVal = research.match(companyRegex);
    const companyVal = companyMatchVal ? companyMatchVal[1].trim() : 'Unknown';
    
    // Extract size if available
    const sizeRegex = /employees?:\s*([\d,+]+[^,\n]*)/i;
    const sizeMatch = companyText.match(sizeRegex);
    const sizeVal = sizeMatch ? sizeMatch[1].trim() : 'Unknown';
    
    // Extract industry if available
    const industryRegex = /Industry:\s*([^\n]+)/;
    const industryMatch = companyText.match(industryRegex);
    const industryVal = industryMatch ? industryMatch[1].trim() : 'Unknown';
    
    // Extract decision maker
    const dmRegex = /Title Level:\s*([^\n]+)/;
    const dmLevelMatch = dmText.match(dmRegex);
    const dmLevelVal = dmLevelMatch ? dmLevelMatch[1].trim() : 'Unknown';
    
    // Extract tech compatibility
    const techRegex = /Compatibility:\s*([^\n]+)/;
    const techCompatMatch = techText.match(techRegex);
    const techCompatVal = techCompatMatch ? techCompatMatch[1].trim() : 'Unknown';
    
    // Extract financial status
    const finStatusRegex = /Status:\s*([^\n]+)/;
    const finStatusMatch = finText.match(finStatusRegex);
    const finStatusVal = finStatusMatch ? finStatusMatch[1].trim() : 'Unknown';
    
    // Extract risk level
    const riskLevelRegex = /Overall Risk Level:\s*([^\n]+)/;
    const riskLevelMatch = riskText.match(riskLevelRegex);
    const riskLevelVal = riskLevelMatch ? riskLevelMatch[1].trim() : 'Unknown';
    
    // Build clean summary
    return `✉️ Email: ${emailVal}
🏢 Company: ${companyVal}
👥 Company Size: ${sizeVal}
🏭 Industry: ${industryVal}
👤 Decision-Maker Level: ${dmLevelVal}
🛠️ Tech Compatibility: ${techCompatVal}
💰 Financial Status: ${finStatusVal}
⚠️ Risk Level: ${riskLevelVal}`;
  } catch (error) {
    console.error('[ERROR] Failed to extract verification fields:', error);
    return 'Background verification data processing...';
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
  
  // Extract key background verification data for Slack display
  // Parse the research report to get actual field values
  const extractedData = extractBackgroundVerificationFields(research);
  
  // SHOW FULL EMAIL (not truncated) so you can review before approving/rejecting
  const sanitizedEmail = email
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
  
  const sanitizedReason = qualification.reason
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();

  // ENHANCED MESSAGE: Show real verified data in structured format
  const message = `*🎯 New Lead Qualification*
*Category:* ${qualification.category}
*Confidence:* ${qualification.reason.split('%')[0]}% (if mentioned)
*Reason:* ${sanitizedReason.substring(0, 150)}...

*📊 BACKGROUND VERIFICATION RESULTS:*

${extractedData}

*📧 FULL EMAIL DRAFT:*
\`\`\`
${sanitizedEmail}
\`\`\`

⬇️ Please review the FULL email above and then:`;
  
  // Add helpful note about what user is seeing
  console.log('[DEBUG HF] ✅ FULL email shown in Slack (not truncated)');
  console.log('[DEBUG HF] Email length shown:', sanitizedEmail.length);
  console.log('[DEBUG HF] Background verification data extracted for display');
  console.log('[DEBUG HF] User can now review complete email before approving/rejecting');

  const slackChannel = process.env.SLACK_CHANNEL_ID || '';
  
  console.log('[DEBUG HF] Slack Channel:', slackChannel);
  console.log('[DEBUG HF] Message length:', message.length);
  console.log('[DEBUG HF] Full email is now visible in Slack (not truncated)');
  console.log('[DEBUG HF] Email will be sent with full content on approval');
  
  if (!slackChannel) {
    console.error('[ERROR HF] SLACK_CHANNEL_ID is empty');
    throw new Error('SLACK_CHANNEL_ID environment variable is not set');
  }

  try {
    console.log('[DEBUG HF] Calling sendSlackMessageWithButtons...');
    console.log('[DEBUG HF] Full email content available for approval');
    console.log('[DEBUG HF] Email content length to send:', email.length);
    
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
