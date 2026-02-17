import {
  humanFeedback,
  qualify,
  writeEmail,
  deepResearch
} from '@/lib/services';
import { performBackgroundVerification } from '@/lib/background-verification';
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
 * 
 * Performs REAL background verification and research including:
 * - Email domain validation and reputation check
 * - Company background research (funding, team size, location)
 * - Decision-maker verification via LinkedIn
 * - Tech stack analysis for compatibility
 * - Financial health and red flag detection
 * - AI agent-based comprehensive research
 */
export const stepResearch = async (data: FormSchema) => {
  'use step';

  try {
    console.log('[RESEARCH] ========== STARTING REAL LEAD RESEARCH ==========');
    console.log('[RESEARCH] Lead:', data.name, 'Company:', data.company);

    // PHASE 1: BACKGROUND VERIFICATION (Operational Research)
    console.log('[RESEARCH] Phase 1: Running background verification...');
    const verification = await performBackgroundVerification(data);

    // PHASE 2: DEEP RESEARCH (Strategic Qualification Analysis)
    console.log('[RESEARCH] Phase 2: Running deep research analysis...');
    const deepAnalysis = await deepResearch(data, verification);
    console.log('[RESEARCH] Deep research analysis completed, length:', deepAnalysis.length);

    // PHASE 3: COMPILE COMPLETE RESEARCH REPORT
    const completeResearch = compileResearchReport(data, verification, deepAnalysis);

    console.log('[RESEARCH] ========== RESEARCH COMPLETE ==========');
    console.log('[RESEARCH] Report length:', completeResearch.length);
    return completeResearch;
  } catch (error) {
    console.error('[ERROR] stepResearch failed:', error);
    // Return a fallback so the workflow can continue
    const fallback = `Lead data: ${JSON.stringify({
      name: data.name,
      email: data.email,
      company: data.company,
      message: data.message,
      error: error instanceof Error ? error.message : 'Unknown error'
    })}`;
    console.log('[DEBUG] stepResearch using fallback');
    return fallback;
  }
};

/**
 * Format verification results for research prompt
 */
function formatVerificationResults(verification: any): string {
  return `
EMAIL VERIFICATION:
- Valid Corporate Email: ${verification.email.valid}
- Domain: ${verification.email.domain}
- Domain Reputation: ${verification.email.domainReputation}

COMPANY INFORMATION:
- Found: ${verification.company.found}
- Name: ${verification.company.name}
- Industry: ${verification.company.industry}
- Employees: ${verification.company.employees}
- Location: ${verification.company.location}
- Website: ${verification.company.website}
- LinkedIn: ${verification.company.linkedinUrl || 'Not found'}
- Summary: ${verification.company.description}

DECISION-MAKER VERIFICATION:
- Title Valid: ${verification.decisionMaker.titleValid}
- Title Level: ${verification.decisionMaker.titleLevel}
- LinkedIn Verified: ${verification.decisionMaker.linkedinMatch || false}
- LinkedIn URL: ${verification.decisionMaker.linkedinUrl || 'Not found'}

TECH STACK ANALYSIS:
- Detected Technologies: ${verification.techStack.primaryTechs.join(', ') || 'Unknown'}
- Compatibility: ${verification.techStack.compatibility}
- Analysis: ${verification.techStack.matchAnalysis}

FINANCIAL HEALTH:
- Status: ${verification.financialHealth.status}
- Red Flags: ${verification.financialHealth.redFlags.length > 0 ? verification.financialHealth.redFlags.join(', ') : 'None detected'}
- Recent News: ${verification.financialHealth.recentNews.slice(0, 3).join('; ') || 'No recent news found'}

RISK ASSESSMENT:
- Overall Risk: ${verification.riskFactors.overall}
- Risk Factors: ${verification.riskFactors.factors.join('; ')}
- Recommendations: ${verification.riskFactors.recommendations.join('; ')}
  `.trim();
}

/**
 * Compile complete research report
 */
function compileResearchReport(data: FormSchema, verification: any, agentResearch: string): string {
  return `
═══════════════════════════════════════════════════════════════
                  COMPREHENSIVE LEAD RESEARCH REPORT
═══════════════════════════════════════════════════════════════

LEAD PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${data.name}
Email: ${data.email} (${verification.email.valid ? '✓ Corporate' : '✗ Personal'})
Company: ${data.company || 'Not provided'}
Phone: ${data.phone || 'Not provided'}
Request: "${data.message}"

BACKGROUND VERIFICATION RESULTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 EMAIL VERIFICATION:
  • Domain: ${verification.email.domain}
  • Reputation: ${verification.email.domainReputation} (${verification.email.valid ? 'Corporate email' : 'Personal email'})
  • Domain Age: ${verification.email.domainAge}
  • MX Records Valid: ${verification.email.mxRecords ? 'Yes' : 'No'}

🏢 COMPANY BACKGROUND:
  • Name: ${verification.company.name}
  • Found in Public Records: ${verification.company.found ? 'Yes' : 'No'}
  • Industry: ${verification.company.industry}
  • Company Size: ${verification.company.employees}
  • Location: ${verification.company.location}
  • Website: ${verification.company.website}
  • LinkedIn Profile: ${verification.company.linkedinUrl ? 'Found' : 'Not found'}
  
  Company Summary:
  ${verification.company.description}

👤 DECISION-MAKER ANALYSIS:
  • Name: ${data.name}
  • Title Valid: ${verification.decisionMaker.titleValid ? 'Yes - Buying authority' : 'No - Verify role'}
  • Authority Level: ${verification.decisionMaker.titleLevel}
  • LinkedIn Verified: ${verification.decisionMaker.linkedinMatch ? 'Yes' : 'No'}
  ${verification.decisionMaker.linkedinUrl ? `  • LinkedIn: ${verification.decisionMaker.linkedinUrl}` : ''}

🛠️ TECHNOLOGY COMPATIBILITY:
  • Detected Tech Stack: ${verification.techStack.primaryTechs.length > 0 ? verification.techStack.primaryTechs.join(', ') : 'Unknown'}
  • Product Compatibility: ${verification.techStack.compatibility === 'high' ? '✓ High' : verification.techStack.compatibility === 'medium' ? '~ Medium' : '✗ Low'}
  • Analysis: ${verification.techStack.matchAnalysis}

💰 FINANCIAL HEALTH:
  • Company Status: ${verification.financialHealth.status}
  • Red Flags: ${verification.financialHealth.redFlags.length > 0 ? verification.financialHealth.redFlags.join(', ') : 'None detected ✓'}
  • Recent News:
    ${verification.financialHealth.recentNews.slice(0, 3).map((n: string) => `    • ${n}`).join('\n')}

⚠️ RISK ASSESSMENT:
  • Overall Risk Level: ${verification.riskFactors.overall.toUpperCase()}
  • Risk Factors:
    ${verification.riskFactors.factors.map((f: string) => `    • ${f}`).join('\n')}
  • Recommendations:
    ${verification.riskFactors.recommendations.map((r: string) => `    • ${r}`).join('\n')}

DETAILED AI RESEARCH ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${agentResearch}

═══════════════════════════════════════════════════════════════
Generated: ${new Date().toISOString()}
═══════════════════════════════════════════════════════════════
  `.trim();
}

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
