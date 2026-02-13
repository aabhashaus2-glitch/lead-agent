# Real Research Verification: Quick Reference Guide

## 🔍 What Gets Checked: Visual Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEAD ARRIVES                                  │
│                    (Name, Email, Company,                        │
│                     Phone, Message)                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              PHASE 1: BACKGROUND VERIFICATION                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 1️⃣ EMAIL VALIDATION                                              │
│    Input: john@techcorp.com                                       │
│    ├─ Email format check ✓                                       │
│    ├─ Corporate vs personal domain (corporate ✓)                │
│    ├─ Domain reputation lookup (HIGH ✓)                         │
│    └─ Blocklist check (not temporary email ✓)                   │
│    Output: {valid: true, domain: "techcorp.com", ...}         │
│                                                                   │
│ 2️⃣ COMPANY RESEARCH                                              │
│    Input: "TechCorp Inc", domain: "techcorp.com"                 │
│    ├─ Search public records (Exa.ai)                            │
│    ├─ Extract company info from search results                  │
│    ├─ Find LinkedIn company page                                │
│    ├─ Parse employees, industry, location                       │
│    └─ Verify website                                            │
│    Output: {found: true, employees: "500+", industry: "SaaS"..}│
│                                                                   │
│ 3️⃣ DECISION-MAKER VERIFICATION                                   │
│    Input: "John Doe", Company: "TechCorp"                        │
│    ├─ Title authority level check (VP → VP/Director level ✓)   │
│    ├─ Search for LinkedIn profile                               │
│    ├─ Verify title matches LinkedIn                             │
│    └─ Extract LinkedIn URL                                      │
│    Output: {titleValid: true, titleLevel: "VP/Director", ...}  │
│                                                                   │
│ 4️⃣ TECH STACK ANALYSIS                                           │
│    Input: Company "TechCorp"                                      │
│    ├─ Search for tech stack mentions                            │
│    ├─ Scan for 18+ technology keywords:                         │
│    │  • Cloud: AWS, GCP, Azure, Cloudflare                     │
│    │  • Containers: Kubernetes, Docker, Terraform              │
│    │  • Languages: NodeJS, Python, Go                          │
│    │  • Databases: PostgreSQL, MongoDB, Redis                  │
│    │  • Tools: GitHub, GitLab, Jenkins                         │
│    ├─ Calculate compatibility score                             │
│    └─ Generate match analysis                                   │
│    Output: {primaryTechs: ["Kubernetes", "AWS"], compatibility: "HIGH"}
│                                                                   │
│ 5️⃣ FINANCIAL HEALTH CHECK                                        │
│    Input: Company "TechCorp"                                      │
│    ├─ Search for financial news                                 │
│    ├─ Scan for RED FLAGS:                                       │
│    │  • "bankruptcy" → Bankruptcy filing detected             │
│    │  • "layoff" → Recent layoffs reported                    │
│    │  • "fraud" → Fraud allegations found                     │
│    ├─ Detect positive signals:                                  │
│    │  • "funding" → Recent funding round                      │
│    │  • "acquisition" → Company acquisition announced         │
│    └─ Determine company status                                  │
│    Output: {status: "strong", redFlags: [], recentNews: [...]} │
│                                                                   │
│ 6️⃣ RISK ASSESSMENT                                               │
│    Input: All 5 verification results above                       │
│    ├─ Count risk factors:                                       │
│    │  • Corporate email? YES ✓                                 │
│    │  • Company found? YES ✓                                   │
│    │  • Valid decision-maker? YES ✓                            │
│    │  • Tech compatible? YES ✓                                 │
│    │  • No red flags? YES ✓                                    │
│    ├─ Determine risk level: LOW (0 risk factors)               │
│    └─ Generate recommendations                                  │
│    Output: {overall: "LOW", factors: [], recommendations: [...]}
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          PHASE 2: AI AGENT DEEP RESEARCH                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Agent uses tools to analyze:                                     │
│ ├─ search() → Find recent news & updates                        │
│ ├─ fetchUrl() → Read company website & blog                     │
│ ├─ crmSearch() → Check internal company history                 │
│ ├─ techStackAnalysis() → Detailed tech compatibility            │
│ └─ queryKnowledgeBase() → Company intelligence database         │
│                                                                   │
│ Produces: Comprehensive analysis (500+ words)                   │
│ Examples:                                                        │
│ • Company is in Series C, recently raised $50M                 │
│ • Hiring VP Engineering indicates scaling phase                │
│ • Recent AWS partnership shows ecosystem openness              │
│ • Market position suggests deployment challenges               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         PHASE 3: COMPLETE RESEARCH REPORT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Formatted markdown report including:                             │
│ • Lead profile summary                                           │
│ • All 6 verification sections (formatted)                       │
│ • Combined risk assessment                                      │
│ • AI agent analysis                                             │
│ • Timestamp and metadata                                        │
│                                                                   │
│ Total Length: 1500-3000 words                                    │
│ Ready for: Slack review + Qualification engine                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          QUALIFICATION ENGINE (lib/services.ts)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Uses research report + ICP rules to classify:                    │
│ ├─ QUALIFIED (high-fit, ready to engage)                        │
│ ├─ FOLLOW_UP (interested, wrong timing)                         │
│ ├─ UNQUALIFIED (poor fit)                                       │
│ └─ SUPPORT (not a sales lead)                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          HUMAN REVIEW IN SLACK                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Slack message includes:                                          │
│ • Qualification (QUALIFIED/FOLLOW_UP/etc)                       │
│ • AI reasoning and confidence score                              │
│ • Research summary (300 chars)                                  │
│ • Draft email (250 chars preview)                               │
│ • Approve/Reject buttons                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Verification Results: Example Output

### ✅ QUALIFIED Lead Example

```
LEAD: John Doe, john@techcorp.com, TechCorp Inc

📧 EMAIL: ✓ Corporate domain (techcorp.com)
   └─ Reputation: HIGH, Domain age: 5+ years

🏢 COMPANY: ✓ Found and verified
   └─ TechCorp Inc | 500+ employees | SaaS | San Francisco
   └─ Website: techcorp.com | LinkedIn: linkedin.com/company/techcorp

👤 DECISION-MAKER: ✓ Valid authority level
   └─ VP Engineering = VP/Director (buying authority)
   └─ LinkedIn verified with matching title

🛠️ TECH STACK: ✓ High compatibility
   └─ Kubernetes, Docker, AWS, PostgreSQL, GitHub (5 techs)
   └─ Compatibility: HIGH

💰 FINANCIAL: ✓ Strong health
   └─ Status: Strong | Red flags: NONE
   └─ Recent: Series C funding $50M, VP hire, AWS partnership

⚠️ RISK: ✓ LOW (0 risk factors)
   └─ All verification checks passed
   └─ Recommendation: HIGH-PRIORITY PROSPECT

═══════════════════════════════════════════════════════════════

OUTCOME: → QUALIFIED (92% confidence)
```

---

### 🔴 RISKY Lead Example

```
LEAD: Sarah Smith, sarah@gmail.com, Unknown Company

📧 EMAIL: ✗ Personal domain (gmail.com)
   └─ Reputation: MEDIUM, Not corporate

🏢 COMPANY: ✗ NOT FOUND
   └─ Search yielded no public records
   └─ Website: Unknown | LinkedIn: Not found

👤 DECISION-MAKER: ? Unable to verify
   └─ Title: (None provided) = Unknown authority level
   └─ LinkedIn: Not found

🛠️ TECH STACK: ? Unable to analyze
   └─ No company information to research
   └─ Compatibility: UNKNOWN

💰 FINANCIAL: ? No data available
   └─ Status: Unknown | Red flags: UNKNOWN
   └─ No recent news found

⚠️ RISK: ✗ HIGH (5 risk factors)
   └─ Personal email + Company not found + No decision-maker verification
   └─ Recommendation: MANUAL REVIEW REQUIRED

═══════════════════════════════════════════════════════════════

OUTCOME: → UNQUALIFIED or FOLLOW_UP (42% confidence)
REASON: Cannot verify company legitimacy. Request additional information.
```

---

## 🎯 What Each Verification Tells You

### Email Verification
**Why it matters:** Email domain indicates if person is really at the company they claim

- ✅ **Corporate email** (@techcorp.com) → Person verified with company
- ⚠️ **Personal email** (@gmail.com) → Could be decision-maker, but less official
- ❌ **Temp email** (@tempmail.xyz) → Likely spam or disposable

---

### Company Research
**Why it matters:** Confirms the company exists and is real

- ✅ **Company found** → Can verify size, industry, location, funding
- ⚠️ **Small company** → May have less budget/authority structure
- ❌ **Company not found** → Red flag - could be made-up or too obscure

---

### Decision-Maker Verification
**Why it matters:** Confirms person has authority to make purchasing decisions

- ✅ **C-Suite/VP** → Can approve budgets, make strategic decisions
- ✅ **Director/Manager** → Can influence or approve decisions
- ⚠️ **Manager/Team Lead** → Can recommend but may need approval
- ❌ **Individual Contributor** → Can't approve, only influence

---

### Tech Stack Analysis
**Why it matters:** Predicts if your product solves their actual problems

- ✅ **High compatibility** (5+ techs match) → Your product solves their problems
- ✅ **Medium compatibility** (2-4 techs match) → Possible fit
- ❌ **Low compatibility** (<2 techs match) → May not be a good fit

---

### Financial Health
**Why it matters:** Indicates if company can pay and has stability

- ✅ **Strong** → Recent funding, no red flags, hiring (growth phase)
- ⚠️ **Stable** → No major issues but no positive signals
- ❌ **Concerning** → Red flags like layoffs, bankruptcy, fraud

---

### Risk Assessment
**Why it matters:** Determines if lead is worth pursuing

- ✅ **LOW** (0-2 risk factors) → Pursue immediately
- ⚠️ **MEDIUM** (3-4 risk factors) → Verify further or manual review
- ❌ **HIGH** (5+ risk factors) → Likely not worth pursuing or needs investigation

---

## 🚀 Testing the Real Research

### Test Lead 1: High-Quality Prospect
```
Email: john.smith@microsoft.com
Name: John Smith
Company: Microsoft
Phone: +1-555-0100
Message: "We want to optimize our deployment infrastructure"

Expected Outcome:
✓ Will find rich company data
✓ Corporate email verified
✓ Large company with strong financials
✓ Tech stack highly compatible
✓ QUALIFIED or FOLLOW_UP
```

### Test Lead 2: Risky Lead
```
Email: info@temp-mail.xyz
Name: Bob Unknown
Company: ACME
Phone: Not provided
Message: "Just exploring"

Expected Outcome:
✗ Company not found
✗ Temporary email detected
✗ No decision-maker verification
✗ No tech signals
✓ UNQUALIFIED (high risk)
```

### Check Results in Slack
- Look for research report with all 6 verification sections
- Check if risk level matches your expectations
- Review AI agent analysis for accuracy

---

## 📈 How Verification Impacts Qualification

The `qualify()` function in `lib/services.ts` uses research findings:

```
RESEARCH INPUTS TO QUALIFICATION ENGINE:
├─ Email verification → Corporate credibility
├─ Company research → Company size/industry/ICP match
├─ Decision-maker → Authority to buy
├─ Tech stack → Product-market fit
├─ Financial health → Budget availability
└─ Risk factors → Overall trustworthiness

OUTPUT: QUALIFIED | FOLLOW_UP | UNQUALIFIED | SUPPORT
```

---

## 🔧 How to Customize Verification

### Edit Detected Technologies
```typescript
// lib/background-verification.ts
const techKeywords = [
  'kubernetes', 'docker', 'aws', // ... keep existing
  'your-product-name',           // ← Add your product
  'industry-specific-tool',      // ← Add your industry tools
];
```

### Add More Red Flags
```typescript
// lib/background-verification.ts → checkFinancialHealth()
if (text.includes('patent lawsuit')) {
  redFlags.push('Patent litigation detected');
}
if (text.includes('downtime') || text.includes('outage')) {
  redFlags.push('Recent service outage reported');
}
```

### Adjust Risk Scoring
```typescript
// lib/background-verification.ts → assessRiskFactors()
const overallRisk = 
  factors.length > 5 ? 'high' :    // ← Adjust threshold
  factors.length > 3 ? 'medium' :
  'low';
```

---

## 🐛 Troubleshooting

### Research takes too long
- **Problem:** Exa.ai searches timing out
- **Solution:** Reduce `numResults` in search calls (from 3 to 2)
- **Location:** `lib/background-verification.ts` → each research function

### Some fields say "Unknown"
- **Problem:** Company too small or too new for public data
- **Solution:** Add manual CRM lookup tool or request info from lead
- **Location:** Implement `crmSearch()` tool in `lib/services.ts`

### Research report seems inaccurate
- **Problem:** Exa.ai returned irrelevant results
- **Solution:** Refine search queries with more specific terms
- **Location:** `lib/background-verification.ts` → search query strings

---

## 📚 Related Documentation

- **REAL_RESEARCH_IMPLEMENTATION.md** ← Full technical details
- **CUSTOMIZATION_GUIDE.md** ← How to update ICP rules
- **LEAD_QUALIFICATION_FRAMEWORK.md** ← Business logic reference
- **DEBUG_GUIDE.md** ← How to debug the system

---

**Last Updated:** February 13, 2025  
**Quick Reference for:** Real Research & Background Verification
