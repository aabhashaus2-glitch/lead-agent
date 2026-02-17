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
  console.log('[DEBUG HF] Category:', qualification?.category);
  console.log('[DEBUG HF] Email length:', email?.length || 'no email');
  console.log('[DEBUG HF] Research length:', research?.length || 'no research');
  
  // Extract key background verification data for Slack display
  const extractedData = extractBackgroundVerificationFields(research);
  
  const slackChannel = process.env.SLACK_CHANNEL_ID || '';
  
  console.log('[DEBUG HF] SLACK_CHANNEL_ID env var:', slackChannel ? '✓ SET' : '✗ NOT SET');
  
  if (!slackChannel) {
    console.error('[ERROR HF] SLACK_CHANNEL_ID is empty or not configured');
    throw new Error('SLACK_CHANNEL_ID environment variable is not set');
  }

  let message = '';
  
  // BUILD DIFFERENT MESSAGE BASED ON CATEGORY
  if (qualification.category === 'QUALIFIED' || qualification.category === 'FOLLOW_UP') {
    // SALES PATH: Show email draft for approval
    const sanitizedEmail = email
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();
    
    const sanitizedReason = qualification.reason
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();
    
    const categoryEmoji = qualification.category === 'QUALIFIED' ? '✅' : '🔄';
    
    message = `${categoryEmoji} *New Lead - ${qualification.category}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Reasoning:* ${sanitizedReason}

*📊 Background Verification:*
${extractedData}

*📧 Email Draft:*
\`\`\`
${sanitizedEmail}
\`\`\`

Please review and:`;
  }
  else if (qualification.category === 'SUPPORT') {
    // SUPPORT PATH: Alert support team
    message = `🛠️ *SUPPORT REQUEST DETECTED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Action:* Route to Support Team
*Reason:* ${qualification.reason}

*📊 Lead Details:*
${extractedData}

⚠️ This is NOT a sales lead - needs technical support handling`;
  }
  else if (qualification.category === 'UNQUALIFIED') {
    // UNQUALIFIED PATH: Log for analytics
    message = `❌ *UNQUALIFIED LEAD*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Reason:* ${qualification.reason}

*📊 Lead Details:*
${extractedData}

📋 Lead logged for analytics and archival`;
  } else {
    console.warn('[WARN HF] Unknown category:', qualification.category);
  }

  console.log('[DEBUG HF] Message built successfully');
  console.log('[DEBUG HF] Message length:', message.length);
  console.log('[DEBUG HF] About to send to Slack channel:', slackChannel);

  try {
    console.log('[DEBUG HF] Calling sendSlackMessageWithButtons...');
    console.log('[DEBUG HF] Parameters: channel=', slackChannel, ', category=', qualification.category);
    
    const result = await sendSlackMessageWithButtons(
      slackChannel, 
      message, 
      email,
      qualification.category
    );
    
    console.log('[DEBUG HF] ✓ Slack message sent successfully');
    console.log('[DEBUG HF] Message timestamp:', result.messageTs);
    console.log('[DEBUG HF] ========== HUMAN FEEDBACK COMPLETE ==========');
    
    return result;
  } catch (error) {
    console.error('[ERROR HF] ========== HUMAN FEEDBACK FAILED ==========');
    console.error('[ERROR HF] Failed to send Slack message');
    console.error('[ERROR HF] Error:', error);
    console.error('[ERROR HF] Error message:', (error as any)?.message);
    console.error('[ERROR HF] Error code:', (error as any)?.code);
    console.error('[ERROR HF] Stack trace:', (error as any)?.stack);
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
/**
 * PHASE 2: DEEP RESEARCH - Comprehensive qualification analysis
 * 
 * This phase analyzes the lead for qualification signals without timeouts.
 * It performs strategic analysis on:
 * - Business need and problem clarity
 * - Budget and purchase intent signals
 * - Decision-maker authority level
 * - Company fit against ICP
 * - Growth and market opportunity
 */
export async function deepResearch(
  lead: FormSchema,
  verification: any
): Promise<string> {
  console.log('[RESEARCH] PHASE 2: DEEP RESEARCH - Analyzing qualification signals');
  
  try {
    // Use Claude without timeout to perform deep analysis
    const deepAnalysis = await generateText({
      model: 'openai/gpt-4o-mini',
      system: `You are an expert B2B SaaS sales analyst. Perform deep research on leads to determine their qualification potential.

Analyze the following dimensions:
1. BUSINESS NEED: Is there a clear, specific problem stated?
2. URGENCY: What's the timeline? (ASAP/this month = high, next quarter = medium, exploratory = low)
3. BUDGET SIGNALS: Any indication of budget availability or decision authority?
4. DECISION-MAKER: Is this likely a decision-maker based on language and context?
5. COMPANY FIT: Does the company size/industry match tech/SaaS sector?
6. GROWTH POTENTIAL: Is this a growing company with scalability?
7. PROBLEM-SOLUTION FIT: Does our platform solve their stated problem?
8. PRIMARY RISK: What's the biggest red flag or concern?

Provide a structured analysis that ends with a RECOMMENDATION:
- STRONG_FIT: High potential, multiple positive signals
- GOOD_FIT: Decent potential, some positive signals  
- UNCERTAIN_FIT: Mixed signals, needs clarification
- POOR_FIT: Multiple concerns, low qualification potential`,
      prompt: `
LEAD INFORMATION:
- Name: ${lead.name}
- Email: ${lead.email}
- Company: ${lead.company || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
- Original Message: "${lead.message}"

BACKGROUND VERIFICATION DATA:
- Company Size: ${verification.companyInfo?.size || 'Unknown'}
- Industry: ${verification.companyInfo?.industry || 'Unknown'}
- Email Domain Safety: ${verification.emailValidation?.riskLevel || 'Unknown'}
- Decision-maker Status: ${verification.decisionMaker?.titleLevel || 'Unknown'}
- Tech Stack Compatibility: ${verification.techStack?.compatibility || 'Unknown'}
- Financial Health: ${verification.financialHealth?.status || 'Unknown'}
- Overall Risk Level: ${verification.riskLevel || 'Unknown'}

TASK:
Perform comprehensive qualification research on this lead. Analyze each dimension carefully.
Look for patterns in the message that indicate business maturity, problem clarity, and purchase intent.
Provide actionable insights for the sales team.
      `.trim()
    });

    console.log('[RESEARCH] Deep research analysis completed');
    return deepAnalysis.text;
  } catch (error) {
    console.error('[ERROR] Deep research failed:', error);
    // Graceful fallback - use verification data as fallback
    const fallback = `DEEP RESEARCH FALLBACK:
Based on background verification:
- Risk Level: ${verification.riskLevel}
- Financial Status: ${verification.financialHealth?.status}
- Decision-maker found: ${verification.decisionMaker?.titleLevel ? 'Yes' : 'No'}

RECOMMENDATION: Review verification data above for qualification decision.`;
    return fallback;
  }
}
