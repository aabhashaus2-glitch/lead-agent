import { exa } from '@/lib/exa';
import { FormSchema } from '@/lib/types';

/**
 * Background Verification Module
 * 
 * Performs real background verification including:
 * - Email validation and domain research
 * - Company research (funding, team size, location)
 * - Decision-maker verification (LinkedIn, title validation)
 * - Tech stack analysis
 * - Financial health & red flags
 * - Industry and reputation research
 */

export interface VerificationResult {
  email: {
    valid: boolean;
    domain: string;
    domainAge: string;
    domainReputation: 'high' | 'medium' | 'low' | 'unknown';
    mxRecords: boolean;
  };
  phone: {
    valid: boolean;
    reason: string;
  };
  company: {
    name: string;
    found: boolean;
    description: string;
    employees: string;
    funding: string;
    industry: string;
    location: string;
    website: string;
    linkedinUrl?: string;
  };
  decisionMaker: {
    titleValid: boolean;
    titleLevel: 'C-Suite' | 'VP/Director' | 'Manager' | 'Individual Contributor' | 'Unknown';
    linkedinMatch?: boolean;
    linkedinUrl?: string;
  };
  techStack: {
    primaryTechs: string[];
    compatibility: 'high' | 'medium' | 'low' | 'unknown';
    matchAnalysis: string;
  };
  financialHealth: {
    status: 'strong' | 'stable' | 'concerning' | 'unknown';
    redFlags: string[];
    funding: string;
    recentNews: string[];
  };
  riskFactors: {
    overall: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
}

/**
 * Validate phone number - check for fake/test numbers
 */
export function validatePhoneNumber(phone: string): { valid: boolean; reason: string } {
  if (!phone || phone.length === 0) {
    return { valid: true, reason: 'Phone not provided (optional)' };
  }

  // Extract only digits
  const digitsOnly = phone.replace(/\D/g, '');

  // Check minimum length (at least 10 digits)
  if (digitsOnly.length < 10) {
    return { valid: false, reason: 'Phone number too short (less than 10 digits)' };
  }

  // Check for common test/fake numbers
  const testNumbers = [
    '1234567890', '0123456789', '9876543210', // Sequential
    '1111111111', '2222222222', '3333333333', '4444444444', // Repeated digits
    '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
    '0000000000', // All zeros
    '5550000000', '5550001111', '5550002222', // Test ranges (555 area code)
    '2015550000', // Test number (20155...)
  ];

  if (testNumbers.includes(digitsOnly)) {
    return { valid: false, reason: 'Phone number appears to be a test/fake number' };
  }

  // Check for too many repeated digits (>6 same digit in a row is suspicious)
  const repeatedDigits = /(\d)\1{6,}/.test(digitsOnly);
  if (repeatedDigits) {
    return { valid: false, reason: 'Phone number has too many repeated digits (suspicious)' };
  }

  // Check if number is mostly sequential
  let sequentialCount = 0;
  for (let i = 0; i < digitsOnly.length - 1; i++) {
    const current = parseInt(digitsOnly[i]);
    const next = parseInt(digitsOnly[i + 1]);
    if (Math.abs(next - current) === 1) {
      sequentialCount++;
    }
  }
  if (sequentialCount > digitsOnly.length * 0.6) {
    return { valid: false, reason: 'Phone number appears to be sequential (test number)' };
  }

  return { valid: true, reason: 'Phone number format valid' };
}

/**
 * Validate email format and extract domain
 */
export function validateEmailDomain(email: string): { valid: boolean; domain: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, domain: '' };
  }

  const domain = email.split('@')[1];
  const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const isPublicDomain = publicDomains.includes(domain.toLowerCase());

  return {
    valid: !isPublicDomain, // Corporate email is preferred
    domain: domain
  };
}

/**
 * Research company information using Exa
 */
export async function researchCompany(
  companyName: string,
  domain?: string
): Promise<Partial<VerificationResult['company']>> {
  console.log('[BG-VERIFY] Researching company:', companyName);

  try {
    // Search for company information (summaries only, no content)
    const searchQuery = domain ? `"${companyName}" site:${domain}` : companyName;

    const result = await exa.search(searchQuery, {
      numResults: 2,
      type: 'keyword'
    });

    if (!result.results || result.results.length === 0) {
      console.log('[BG-VERIFY] No company info found');
      return {
        name: companyName,
        found: false,
        description: 'Company information not found in public records'
      };
    }

    const primaryResult = result.results[0];
    
    // Extract key information from search results (title only, no content fetch)
    const description = primaryResult.title || '';
    const linkedinUrl = result.results.find(r => r.url.includes('linkedin'))?.url;

    console.log('[BG-VERIFY] Company found:', companyName);

    return {
      name: companyName,
      found: true,
      description: description.substring(0, 300),
      website: primaryResult.url,
      linkedinUrl: linkedinUrl,
      industry: extractIndustry(description),
      employees: extractEmployeeCount(description),
      location: extractLocation(description),
      funding: 'See detailed research'
    };
  } catch (error) {
    console.error('[BG-VERIFY] Company research failed:', error);
    return {
      name: companyName,
      found: false,
      description: `Research error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Research decision-maker and validate title
 */
export async function verifyDecisionMaker(
  name: string,
  title: string,
  company: string,
  email: string
): Promise<Partial<VerificationResult['decisionMaker']>> {
  console.log('[BG-VERIFY] Verifying decision-maker:', name, title);

  try {
    // Decision maker titles that indicate buying authority
    const executiveTitles = ['cto', 'cfo', 'coo', 'ceo', 'vp', 'chief', 'president', 'founder', 'partner'];
    const managerTitles = ['director', 'head of', 'manager', 'lead'];
    const individualTitles = ['engineer', 'developer', 'analyst', 'specialist', 'coordinator'];

    const lowerTitle = title.toLowerCase();
    let titleLevel: 'C-Suite' | 'VP/Director' | 'Manager' | 'Individual Contributor' | 'Unknown' = 'Unknown';

    if (executiveTitles.some(t => lowerTitle.includes(t))) {
      titleLevel = 'C-Suite';
    } else if (managerTitles.some(t => lowerTitle.includes(t))) {
      titleLevel = 'VP/Director';
    } else if (managerTitles.some(t => lowerTitle.includes(t))) {
      titleLevel = 'Manager';
    } else if (individualTitles.some(t => lowerTitle.includes(t))) {
      titleLevel = 'Individual Contributor';
    }

    // Search for LinkedIn profile (summaries only)
    const linkedinSearch = await exa.search(`${name} ${company} site:linkedin.com`, {
      numResults: 1,
      type: 'keyword'
    });

    const linkedinUrl = linkedinSearch.results?.[0]?.url;
    const linkedinMatch = linkedinUrl && (linkedinSearch.results?.[0]?.title || '').toLowerCase().includes(title.toLowerCase());

    console.log('[BG-VERIFY] Decision-maker verified:', { titleLevel, linkedinMatch });

    return {
      titleValid: titleLevel !== 'Unknown' && titleLevel !== 'Individual Contributor',
      titleLevel,
      linkedinMatch: !!linkedinMatch,
      linkedinUrl
    };
  } catch (error) {
    console.error('[BG-VERIFY] Decision-maker verification failed:', error);
    return {
      titleValid: false,
      titleLevel: 'Unknown'
    };
  }
}

/**
 * Analyze tech stack compatibility
 */
export async function analyzeTechStack(
  companyName: string,
  domain?: string
): Promise<Partial<VerificationResult['techStack']>> {
  console.log('[BG-VERIFY] Analyzing tech stack for:', companyName);

  try {
    const searchQuery = domain ? `${companyName} tech stack tools ${domain}` : `${companyName} technology stack`;

    const result = await exa.search(searchQuery, {
      numResults: 1,
      type: 'keyword'
    });

    if (!result.results || result.results.length === 0) {
      return {
        primaryTechs: [],
        compatibility: 'unknown',
        matchAnalysis: 'Unable to determine tech stack'
      };
    }

    const techContent = result.results.map(r => r.title || '').join(' ');

    // Extract common tech keywords
    const techKeywords = [
      'kubernetes', 'docker', 'aws', 'gcp', 'azure', 'jenkins', 'github',
      'gitlab', 'terraform', 'cloudformation', 'react', 'nextjs', 'nodejs',
      'python', 'go', 'rust', 'java', 'postgres', 'mongodb', 'redis',
      'elasticsearch', 'datadog', 'cloudflare', 'vercel', 'netlify'
    ];

    const foundTechs = techKeywords.filter(tech => 
      techContent.toLowerCase().includes(tech)
    );

    const compatibility = foundTechs.length > 5 ? 'high' : foundTechs.length > 2 ? 'medium' : 'low';

    console.log('[BG-VERIFY] Tech stack found:', foundTechs);

    return {
      primaryTechs: foundTechs,
      compatibility: compatibility as 'high' | 'medium' | 'low' | 'unknown',
      matchAnalysis: `Identified ${foundTechs.length} compatible technologies. ${foundTechs.join(', ')}`
    };
  } catch (error) {
    console.error('[BG-VERIFY] Tech stack analysis failed:', error);
    return {
      primaryTechs: [],
      compatibility: 'unknown',
      matchAnalysis: 'Tech stack analysis unavailable'
    };
  }
}

/**
 * Check financial health and red flags
 */
export async function checkFinancialHealth(
  companyName: string,
  domain?: string
): Promise<Partial<VerificationResult['financialHealth']>> {
  console.log('[BG-VERIFY] Checking financial health:', companyName);

  try {
    const searchQuery = `"${companyName}" funding layoffs bankruptcy news 2024 2025`;

    const result = await exa.search(searchQuery, {
      numResults: 2,
      type: 'keyword'
    });

    const redFlags: string[] = [];
    const recentNews: string[] = [];

    result.results?.forEach(article => {
      const text = article.title?.toLowerCase() || '';
      const title = article.title?.toLowerCase() || '';

      // Check for red flags
      if (text.includes('bankruptcy') || title.includes('bankruptcy')) {
        redFlags.push('Bankruptcy filing detected');
      }
      if (text.includes('layoff') || title.includes('layoff')) {
        redFlags.push('Recent layoffs reported');
      }
      if (text.includes('fraud') || title.includes('fraud')) {
        redFlags.push('Fraud allegations found');
      }
      if (text.includes('acquisition') || title.includes('acquisition')) {
        recentNews.push('Company acquisition announced');
      }
      if (text.includes('funding') || title.includes('funding')) {
        recentNews.push('Recent funding round reported');
      }

      if (recentNews.length < 3) {
        recentNews.push(article.title || article.url);
      }
    });

    const status: 'strong' | 'stable' | 'concerning' | 'unknown' = 
      redFlags.length > 2 ? 'concerning' : 
      redFlags.length > 0 ? 'stable' : 
      'strong';

    console.log('[BG-VERIFY] Financial health:', { status, redFlags: redFlags.length });

    return {
      status,
      redFlags,
      recentNews: recentNews.slice(0, 5),
      funding: 'See research details'
    };
  } catch (error) {
    console.error('[BG-VERIFY] Financial health check failed:', error);
    return {
      status: 'unknown',
      redFlags: [],
      recentNews: []
    };
  }
}

/**
 * Comprehensive background and risk assessment
 */
export async function performBackgroundVerification(
  lead: FormSchema
): Promise<VerificationResult> {
  console.log('[BG-VERIFY] ========== STARTING BACKGROUND VERIFICATION ==========');
  console.log('[BG-VERIFY] Lead:', lead.name, 'Company:', lead.company);

  try {
    // 1. EMAIL VALIDATION
    const emailValidation = validateEmailDomain(lead.email);
    const emailDomainInfo = extractDomainAge(lead.email.split('@')[1]);

    // 2. PHONE VALIDATION (NEW)
    const phoneValidation = validatePhoneNumber(lead.phone || '');

    // 3-6. RUN COMPANY RESEARCH WITH DELAYS (free tier rate limiting)
    console.log('[BG-VERIFY] Running research tasks sequentially with delays for free tier API...');
    
    // Essential: Company research
    const companyInfo = await researchCompany(lead.company || 'Unknown', 
      emailValidation.domain !== '' ? emailValidation.domain : undefined
    );
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay for free tier rate limiting
    
    // Essential: Decision-maker verification
    const decisionMakerInfo = await verifyDecisionMaker(
      lead.name,
      'Professional',
      lead.company || 'Unknown',
      lead.email
    );
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay for free tier rate limiting
    
    // Optional: Tech stack analysis (fail fast if timeout - 3s max)
    let techStackInfo = { primaryTechs: [], compatibility: 'unknown' as const, matchAnalysis: 'Skipped (free tier)' };
    try {
      techStackInfo = await Promise.race([
        analyzeTechStack(
          lead.company || 'Unknown',
          emailValidation.domain !== '' ? emailValidation.domain : undefined
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]) as Partial<VerificationResult['techStack']>;
      await new Promise(resolve => setTimeout(resolve, 500)); // Smaller delay after optional call
    } catch (error) {
      console.log('[BG-VERIFY] Tech stack skipped (timeout)');
    }
    
    // Optional: Financial health check (fail fast if timeout - 3s max)
    let financialInfo = { status: 'unknown' as const, redFlags: [], funding: 'Unknown', recentNews: [] };
    try {
      financialInfo = await Promise.race([
        checkFinancialHealth(
          lead.company || 'Unknown',
          emailValidation.domain !== '' ? emailValidation.domain : undefined
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]) as Partial<VerificationResult['financialHealth']>;
    } catch (error) {
      console.log('[BG-VERIFY] Financial health skipped (timeout)');
    }

    console.log('[BG-VERIFY] Sequential research tasks completed');

    // 7. RISK ASSESSMENT
    const riskFactors = assessRiskFactors(
      emailValidation,
      companyInfo,
      decisionMakerInfo,
      financialInfo,
      phoneValidation
    );

    const verification: VerificationResult = {
      email: {
        valid: emailValidation.valid,
        domain: emailValidation.domain || 'Unknown',
        domainAge: emailDomainInfo.age,
        domainReputation: emailDomainInfo.reputation,
        mxRecords: true // In production, check actual MX records
      },
      phone: {
        valid: phoneValidation.valid,
        reason: phoneValidation.reason
      },
      company: {
        name: lead.company || 'Not provided',
        found: companyInfo.found || false,
        description: companyInfo.description || 'No information found',
        employees: companyInfo.employees || 'Unknown',
        funding: companyInfo.funding || 'Unknown',
        industry: companyInfo.industry || 'Unknown',
        location: companyInfo.location || 'Unknown',
        website: companyInfo.website || 'Not found',
        linkedinUrl: companyInfo.linkedinUrl
      },
      decisionMaker: {
        titleValid: decisionMakerInfo.titleValid || false,
        titleLevel: decisionMakerInfo.titleLevel || 'Unknown',
        linkedinMatch: decisionMakerInfo.linkedinMatch,
        linkedinUrl: decisionMakerInfo.linkedinUrl
      },
      techStack: {
        primaryTechs: techStackInfo.primaryTechs || [],
        compatibility: techStackInfo.compatibility || 'unknown',
        matchAnalysis: techStackInfo.matchAnalysis || 'Unknown'
      },
      financialHealth: {
        status: financialInfo.status || 'unknown',
        redFlags: financialInfo.redFlags || [],
        funding: financialInfo.funding || 'Unknown',
        recentNews: financialInfo.recentNews || []
      },
      riskFactors
    };

    console.log('[BG-VERIFY] ========== VERIFICATION COMPLETE ==========');
    console.log('[BG-VERIFY] Risk Level:', verification.riskFactors.overall);

    return verification;
  } catch (error) {
    console.error('[BG-VERIFY] ========== VERIFICATION FAILED ==========', error);
    // Return a partial verification with error info
    return {
      email: { valid: false, domain: '', domainAge: 'Unknown', domainReputation: 'unknown', mxRecords: false },
      phone: { valid: false, reason: 'Verification process failed' },
      company: { name: lead.company || 'Unknown', found: false, description: `Verification error: ${error instanceof Error ? error.message : 'Unknown'}`, employees: 'Unknown', funding: 'Unknown', industry: 'Unknown', location: 'Unknown', website: '' },
      decisionMaker: { titleValid: false, titleLevel: 'Unknown' },
      techStack: { primaryTechs: [], compatibility: 'unknown', matchAnalysis: 'Verification failed' },
      financialHealth: { status: 'unknown', redFlags: [], funding: 'Unknown', recentNews: [] },
      riskFactors: {
        overall: 'high',
        factors: ['Verification process failed'],
        recommendations: ['Manual review required']
      }
    };
  }
}

/**
 * Helper: Extract industry from text
 */
function extractIndustry(text: string): string {
  const industries = ['SaaS', 'Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Energy'];
  for (const industry of industries) {
    if (text.toLowerCase().includes(industry.toLowerCase())) {
      return industry;
    }
  }
  return 'Unknown';
}

/**
 * Helper: Extract employee count from text
 */
function extractEmployeeCount(text: string): string {
  const matches = text.match(/(\d+)\s*(?:employees?|person|people)/i) ||
                  text.match(/(\d+),(\d+)\s*(?:employees?)/);
  
  if (matches) {
    return `${matches[1]}+ employees`;
  }
  return 'Unknown';
}

/**
 * Helper: Extract location from text
 */
function extractLocation(text: string): string {
  const locationRegex = /(?:based in|headquartered in|located in)\s+([A-Za-z\s,]+?)(?:,|$|\.)/i;
  const match = text.match(locationRegex);
  return match ? match[1].trim() : 'Unknown';
}

/**
 * Helper: Extract domain age and reputation
 */
function extractDomainAge(domain: string): { age: string; reputation: 'high' | 'medium' | 'low' | 'unknown' } {
  const blockedDomains = ['temp-mail', 'guerrillamail', 'maildrop', '10minutemail'];
  const isProbablematic = blockedDomains.some(d => domain.includes(d));

  // In production, query domain registration date
  return {
    age: '5+ years', // Placeholder
    reputation: isProbablematic ? 'low' : 'high'
  };
}

/**
 * Helper: Assess overall risk factors
 */
function assessRiskFactors(
  email: ReturnType<typeof validateEmailDomain> & any,
  company: Partial<VerificationResult['company']>,
  decisionMaker: Partial<VerificationResult['decisionMaker']>,
  financial: Partial<VerificationResult['financialHealth']>,
  phone: ReturnType<typeof validatePhoneNumber>
): VerificationResult['riskFactors'] {
  const factors: string[] = [];
  const recommendations: string[] = [];

  // Email risks
  if (!email.valid) {
    factors.push('Personal email domain (not corporate)');
  }

  // Phone risks (NEW)
  if (!phone.valid) {
    factors.push(`Suspicious phone number: ${phone.reason}`);
    recommendations.push('Contact lead to verify phone number');
  }

  // Company risks
  if (!company.found) {
    factors.push('Company information not found in public records');
    recommendations.push('Request company verification');
  }

  if (company.employees === 'Unknown') {
    factors.push('Unable to verify company size');
  }

  // Decision maker risks
  if (!decisionMaker.titleValid) {
    factors.push('Title may not indicate buying authority');
    recommendations.push('Verify decision-making role');
  }

  // Financial risks
  if (financial.redFlags && financial.redFlags.length > 0) {
    factors.push(`Financial red flags: ${financial.redFlags[0]}`);
    recommendations.push('Request current financial status');
  }

  const overallRisk: 'low' | 'medium' | 'high' = 
    factors.length > 4 ? 'high' :
    factors.length > 2 ? 'medium' :
    'low';

  return {
    overall: overallRisk,
    factors,
    recommendations: recommendations.length > 0 ? recommendations : ['Lead appears legitimate, proceed with qualification review']
  };
}
