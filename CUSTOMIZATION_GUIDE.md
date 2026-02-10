# 🚀 Quick Start: How to Customize Lead Qualification for YOUR Business

This guide helps you customize the lead qualification system to match your actual business needs.

---

## Step 1: Define Your Ideal Customer Profile (ICP)

Open `lib/qualification-rules.ts` and update the `icp` section:

```typescript
export const QUALIFICATION_CONFIG = {
  icp: {
    minEmployees: 20,        // ← Change to your min company size
    maxEmployees: 5000,      // ← Change to your max company size
    
    targetIndustries: [
      'Software/SaaS',       // ← Update with your industries
      'Technology',
      'FinTech',
    ],
    
    minAnnualBudget: 50000,  // ← Change to your min budget
    maxAnnualBudget: 5000000, // ← Change to your max budget
    
    decisionMakerTitles: [   // ← Set who you want to reach
      'VP Engineering',
      'CTO',
      'Engineering Manager',
    ],
  },
};
```

### For Example SaaS Businesses:
- **Dev Tools (like this app)**: ICP is 20-5000 people, tech companies, $50K-$500K
- **HR Software**: ICP is 50-10000 people, all industries, $5K-$100K
- **Security Platform**: ICP is 100-50000 people, tech/finance, $100K-$2M
- **Design Tool**: ICP is 5-500 people, design/tech teams, $1K-$50K

---

## Step 2: Add Your Red Flags

```typescript
redFlags: {
  // Add your competitor companies
  competitors: [
    'competitor_1',
    'competitor_2',
    'your_industry_rival_inc'
  ],
  
  // Add industries you don't serve
  excludedIndustries: [
    'Government',
    'Insurance',
    'Healthcare',
  ],
  
  // Add terms that disqualify leads
  excludeKeywords: [
    'freelancer',
    'solo developer',
    'hobby',
    'student'
  ],
},
```

---

## Step 3: Update Support Keywords

Add customer support-related terms your team uses:

```typescript
supportKeywords: [
  'bug',
  'error',
  'ticket',
  'existing customer',
  'support',
  'integration issue',
  'onboarding',
  // Add your company-specific keywords
  'help with setup',
  'implementation',
  'training request'
],
```

---

## Step 4: Fine-Tune Qualification Signals

Update the signals that indicate a QUALIFIED lead:

```typescript
qualifiedSignals: {
  urgencyKeywords: [
    'urgent',
    'asap',
    'this week',
    'critical',
    'blocking',
    // Add your business signals
    'production down',
    'losing customers',
    'regulatory deadline'
  ],
  
  needKeywords: [
    'we need',
    'we are looking',
    'problem is',
    'scaling',
    // Add specific problems you solve
    'deployment failures',
    'slow performance',
    'manual processes'
  ],
  
  budgetKeywords: [
    'enterprise',
    'budget approved',
    'investment',
    // Add your budget signals
    'allocated',
    'committed',
    'purchase order'
  ],
},
```

---

## Step 5: Set Confidence Thresholds

Control how automated your system is:

```typescript
confidenceThresholds: {
  // 80+ = Auto-send emails (risky but fast)
  // 70-80 = Require human review (balanced)
  // <70 = Always require human (safe but slow)
  autoApprovalThreshold: 80,
  requireHumanReviewThreshold: 70,
},
```

For **conservative business**: Set `autoApprovalThreshold: 90`
For **aggressive growth**: Set `autoApprovalThreshold: 75`

---

## Step 6: Test Your Configuration

### Test Lead 1: Your Perfect Customer
Copy a lead you know converts well and add it to `QUALIFICATION_CONFIG.exampleLeads`:

```typescript
exampleLeads: {
  yourIdealCustomer: {
    name: 'John Doe',
    company: 'Large Tech Company',
    message: 'We have 500 engineers and $2M budget for platform tooling...',
    expectedCategory: 'QUALIFIED',
    reasoning: 'Matches all ICP criteria'
  },
}
```

### Test Lead 2: Your Typical Follow-up
```typescript
exampleLeads: {
  typicalFollowUp: {
    name: 'Sarah',
    company: 'Startup',
    message: 'Love your product. Were exploring for next year...',
    expectedCategory: 'FOLLOW_UP',
    reasoning: 'Interested but wrong timing'
  },
}
```

### Run Tests
Push test leads through the form and verify results.

---

## Step 7: Monitor & Iterate

After 1-2 weeks of real leads:

1. **Check Accuracy**: 
   - "How many QUALIFIED leads actually engage?" (should be >60%)
   - "Any good leads marked UNQUALIFIED?" (adjust rules)

2. **Update Rules**:
   - Add new competitors to red flags
   - Adjust company size ranges if wrong
   - Add industry-specific keywords

3. **Refine Prompts** (optional):
   - Edit the LLM system prompt in `qualify()` function
   - Add specific business context
   - Increase or decrease aggressiveness

---

## Business Logic Reference

### When does a lead get QUALIFIED?
✅ All of these → QUALIFIED:
- Company size within ICP range
- Industry in target list
- Clear business problem
- Budget signals present
- Urgency indicators
- Decision-maker level

### When does a lead get FOLLOW_UP?
🔄 Any of these → FOLLOW_UP:
- Interested but too small (startup growth potential)
- Right fit but wrong timing (budget next quarter)
- Perfect fit but needs more info (exploratory)
- Early-stage opportunity (Series A, expansion)

### When does a lead get UNQUALIFIED?
❌ Matched red flags OR:
- Outside ICP range (too small or too large)
- Wrong industry
- Freelancer/solo operator
- Budget-constrained under minimum
- Competitor research

### When does a lead get SUPPORT?
🛠️ Contains support keywords OR:
- Existing customer with issue
- Technical problem/bug report
- Partnership/vendor inquiry
- Onboarding request
- Press/media inquiry

---

## Common Customization Scenarios

### Scenario A: You're in Vertical SaaS (e.g., Real Estate Tech)
```typescript
icp: {
  minEmployees: 10,        // Smaller companies OK
  targetIndustries: ['Real Estate', 'Property Management'],
  minAnnualBudget: 5000,   // Lower budget
  decisionMakerTitles: ['Broker', 'Head of Technology', 'Property Manager'],
}
```

### Scenario B: You're PLG (Product-Led Growth)
```typescript
icp: {
  minEmployees: 1,         // Individual developers OK
  targetIndustries: ['All'],  // Broad
  minAnnualBudget: 0,      // Usage-based, freemium
  // Signals focus on feature adoption, not budget
}
```

### Scenario C: You're Enterprise B2B
```typescript
icp: {
  minEmployees: 500,       // Enterprise only
  targetIndustries: ['Finance', 'Healthcare', 'Fortune 500'],
  minAnnualBudget: 500000, // High budget
  decisionMakerTitles: ['CTO', 'Chief Digital Officer', 'VP Enterprise'],
  confidenceThresholds: {
    autoApprovalThreshold: 95, // Very conservative
  }
}
```

### Scenario D: You Have Multiple Products
Create separate `QUALIFICATION_CONFIG` per product:
```typescript
export const PRODUCT_A_CONFIG = { /* Product A ICP */ }
export const PRODUCT_B_CONFIG = { /* Product B ICP */ }

// In qualify function, choose based on message or company
```

---

## Troubleshooting

### Problem: Too many UNQUALIFIED leads
**Solution**: 
- Reduce min company size in ICP
- Remove unnecessary red flags
- Lower `requireHumanReviewThreshold` to 65

### Problem: False positives (bad leads marked QUALIFIED)
**Solution**:
- Increase `autoApprovalThreshold` to 85+
- Add more specific red flags
- Add budget minimum validation

### Problem: Too many FOLLOW_UP leads
**Solution**:
- Tighten the follow-up signals definition
- Require more budget/timeline signals for QUALIFIED
- Add company size filters

### Problem: Leads not classified correctly
**Solution**:
1. Check `LEAD_EXAMPLES_AND_TESTS.md` for test cases
2. Review the actual LLM reasoning (check logs)
3. Update system prompt in `qualify()` function in `services.ts`
4. Add more specific business context to the prompt

---

## Next Steps

1. ✅ Update ICP in `lib/qualification-rules.ts` (~5 min)
2. ✅ Add your red flags and keywords (~10 min)
3. ✅ Test with sample leads from `LEAD_EXAMPLES_AND_TESTS.md` (~15 min)
4. ✅ Run through your actual first 10-20 leads
5. ✅ Review results and adjust rules
6. ✅ Monitor for 2-4 weeks before major changes

**Typical setup time: 30-45 minutes**

---

## Key Files to Edit

1. **Main configuration**: `lib/qualification-rules.ts` - Update ICP, red flags, signals
2. **LLM system prompt**: `lib/services.ts` - Update AI qualification logic
3. **Examples for testing**: `LEAD_EXAMPLES_AND_TESTS.md` - Add your test leads
4. **Business documentation**: `LEAD_QUALIFICATION_FRAMEWORK.md` - Reference guide

---

## Questions?

Check the documentation:
- **What is a lead?** → `LEAD_QUALIFICATION_FRAMEWORK.md` Section 1
- **What are the categories?** → `LEAD_QUALIFICATION_FRAMEWORK.md` Section 2
- **How does it work?** → `LEAD_QUALIFICATION_FRAMEWORK.md` Section 4
- **Test scenarios?** → `LEAD_EXAMPLES_AND_TESTS.md`
