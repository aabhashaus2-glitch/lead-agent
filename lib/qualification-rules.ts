/**
 * Lead Qualification Business Rules & Configuration
 * 
 * Define your business's Ideal Customer Profile (ICP) and qualification rules here.
 * Update these based on your actual business needs.
 */

export const QUALIFICATION_CONFIG = {
  /**
   * IDEAL CUSTOMER PROFILE (ICP)
   */
  icp: {
    // Company size: minimum and maximum employees
    minEmployees: 20,
    maxEmployees: 5000,
    
    // Industries that are good fits for your product
    targetIndustries: [
      'Software/SaaS',
      'Technology',
      'FinTech',
      'Web3/Crypto',
      'E-commerce',
      'Venture Capital',
      'Telecommunications',
      'Cloud Infrastructure'
    ],
    
    // Annual budget expectations
    minAnnualBudget: 50000, // $50K minimum
    maxAnnualBudget: 5000000, // $5M maximum
    
    // Decision-maker titles that indicate good fit
    decisionMakerTitles: [
      'VP Engineering',
      'Chief Technology Officer',
      'CTO',
      'Engineering Manager',
      'Tech Lead',
      'Director of Engineering',
      'VP Product',
      'Chief Product Officer'
    ],
    
    // Geographic regions you serve
    targetRegions: ['North America', 'Europe', 'Asia-Pacific'],
    
    // Preferred company growth stage
    preferredStage: ['Growth', 'Scale-up', 'Enterprise']
  },

  /**
   * RED FLAGS - Automatic UNQUALIFIED if detected
   */
  redFlags: {
    // Competitor companies - do not engage with sales
    competitors: [
      'competitor_company_1',
      'competitor_company_2',
      'competitor_company_3'
    ],
    
    // Industries that are not a fit
    excludedIndustries: [
      'Insurance',
      'Government',
      'Non-profit',
      'Healthcare',
      'Manufacturing'
    ],
    
    // Phrases indicating they're not a fit
    excludeKeywords: [
      'freelancer',
      'solo developer',
      'personal use',
      'hobby project',
      'just curious',
      'student',
      'academic research'
    ],
    
    // Budget signals that indicate poor fit
    maxAcceptableBudget: 5000, // If explicitly stating budget <$5K, UNQUALIFIED
  },

  /**
   * SUPPORT KEYWORDS - Route to support, not sales
   */
  supportKeywords: [
    'bug',
    'error',
    'issue',
    'ticket',
    'support',
    'help',
    'integration problem',
    'technical issue',
    'not working',
    'crash',
    'existing customer',
    'onboarding',
    'training',
    'partnership',
    'sponsor',
    'press',
    'media',
    'refund',
    'billing'
  ],

  /**
   * QUALIFIED SIGNALS - Promotion rules
   * Lead gets QUALIFIED if it matches these patterns
   */
  qualifiedSignals: {
    // Company indicators
    companySize: {
      minForAutoQualified: 100, // Companies with 100+ people auto-qualify
      weight: 0.3
    },
    
    // Urgency indicators
    urgencyKeywords: [
      'urgent',
      'asap',
      'this week',
      'this month',
      'immediately',
      'critical',
      'blocking',
      'production issue'
    ],
    
    // Clear need indicators
    needKeywords: [
      'we need',
      'we are looking for',
      'requirement',
      'must have',
      'problem is',
      'scaling',
      'trying to',
      'help us with'
    ],
    
    // Budget signals
    budgetKeywords: [
      'enterprise',
      'dedicated budget',
      'budget approved',
      'annual spend',
      'investment',
      'willing to pay'
    ],

    // Decision-maker signals
    decisionsignal: [
      'i\'m the cto',
      'i\'m the vp',
      'i\'m the decision maker',
      'i have budget authority',
      'can approve',
      'cto here',
      'vp engineering'
    ]
  },

  /**
   * FOLLOW_UP SIGNALS - These lead to nurture track
   * Interested but wrong timing or missing info
   */
  followUpSignals: {
    // Timing issues
    wrongTimingKeywords: [
      'next quarter',
      'next year',
      'waiting for',
      'expanding',
      'after we',
      'when we grow',
      'in the future',
      'considering',
      'evaluating',
      'exploring options'
    ],
    
    // Small company with growth potential
    growthPotentialKeywords: [
      'startup',
      'growing',
      'scaling up',
      'expansion',
      'raising money',
      'funding',
      'series a',
      'series b'
    ],
    
    // Information gathering phase
    researchPhaseKeywords: [
      'tell us about',
      'send documentation',
      'pricing',
      'features',
      'capabilities',
      'how does it work',
      'case study',
      'demo'
    ]
  },

  /**
   * CONFIDENCE SCORING
   * 0-100 score indicating how confident we are in the classification
   */
  confidenceThresholds: {
    // Only auto-send emails if confidence is above this
    autoApprovalThreshold: 80,
    
    // If confidence is below this, always require human review
    requireHumanReviewThreshold: 70,
    
    // Log warnings for edge cases in this range
    warningRange: [70, 80]
  },

  /**
   * QUALIFICATION RULES FOR TESTING
   * These are example leads to test your config
   */
  exampleLeads: {
    qualified: {
      name: 'Sarah Chen',
      company: 'TechCorp Inc',
      message: 'Our 200-person engineering team is struggling with deployment scalability. We need to implement CI/CD improvements ASAP. Budget approved for Q1 implementation.',
      expectedCategory: 'QUALIFIED',
      reasoning: 'Large company (200 people), clear urgent need, budget signals, appropriate decision-maker'
    },
    
    followUp: {
      name: 'Michael Torres',
      company: 'StartupXYZ',
      message: 'Love your platform! We are a 12-person startup currently exploring options for next year when we expand to 50 people. Can you send documentation?',
      expectedCategory: 'FOLLOW_UP',
      reasoning: 'Interested but wrong timing, growth potential, small company with expansion plans'
    },
    
    unqualified: {
      name: 'Alex Kumar',
      company: 'SoloWorks',
      message: 'I am a solo developer working on a personal hobby project. Interested in your platform for learning purposes.',
      expectedCategory: 'UNQUALIFIED',
      reasoning: 'Solo developer (red flag), personal/hobby use (not business), no budget'
    },
    
    support: {
      name: 'Maria Santos',
      company: 'ExistingCustomer Inc',
      message: 'We are getting 404 errors when calling your API v2. Can your support team help us debug this issue?',
      expectedCategory: 'SUPPORT',
      reasoning: 'Technical issue, support request, existing customer - route to support team'
    }
  }
};

/**
 * Helper function to check if a lead matches red flags
 */
export function hasRedFlags(
  lead: { email: string; company?: string; message: string },
  config: typeof QUALIFICATION_CONFIG = QUALIFICATION_CONFIG
): { flagged: boolean; reason?: string } {
  const messageAndCompany = `${lead.message} ${lead.company || ''}`.toLowerCase();
  
  // Check competitor
  for (const competitor of config.redFlags.competitors) {
    if (messageAndCompany.includes(competitor.toLowerCase())) {
      return { flagged: true, reason: `Competitor detected: ${competitor}` };
    }
  }
  
  // Check excluded industries
  for (const industry of config.redFlags.excludedIndustries) {
    if (messageAndCompany.includes(industry.toLowerCase())) {
      return { flagged: true, reason: `Excluded industry: ${industry}` };
    }
  }
  
  // Check exclude keywords
  for (const keyword of config.redFlags.excludeKeywords) {
    if (messageAndCompany.includes(keyword.toLowerCase())) {
      return { flagged: true, reason: `Red flag keyword: ${keyword}` };
    }
  }
  
  return { flagged: false };
}

/**
 * Helper function to check if message contains support keywords
 */
export function isSupportRequest(
  message: string,
  config: typeof QUALIFICATION_CONFIG = QUALIFICATION_CONFIG
): boolean {
  const lowerMessage = message.toLowerCase();
  return config.supportKeywords.some(keyword =>
    lowerMessage.includes(keyword.toLowerCase())
  );
}

/**
 * Helper function to count quality signals in message
 */
export function countQualitySignals(
  message: string,
  config: typeof QUALIFICATION_CONFIG = QUALIFICATION_CONFIG
): {
  urgency: number;
  need: number;
  budget: number;
  decisionMaker: number;
  total: number;
} {
  const lowerMessage = message.toLowerCase();
  
  return {
    urgency: config.qualifiedSignals.urgencyKeywords.filter(k =>
      lowerMessage.includes(k.toLowerCase())
    ).length,
    need: config.qualifiedSignals.needKeywords.filter(k =>
      lowerMessage.includes(k.toLowerCase())
    ).length,
    budget: config.qualifiedSignals.budgetKeywords.filter(k =>
      lowerMessage.includes(k.toLowerCase())
    ).length,
    decisionMaker: config.qualifiedSignals.decisionsignal.filter(k =>
      lowerMessage.includes(k.toLowerCase())
    ).length,
    get total() {
      return this.urgency + this.need + this.budget + this.decisionMaker;
    }
  };
}
