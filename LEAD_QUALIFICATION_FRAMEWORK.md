# Lead Qualification Framework

## Overview
This document defines the complete lead qualification system that powers the automated lead routing and engagement pipeline.

---

## 1. WHAT IS A LEAD?

A **lead** is any inbound person/company showing interest in your product/service through:
- Web form submission
- Email inquiry
- Phone request
- Social media message

Each lead contains:
- **Name** - Person's full name
- **Email** - Contact email
- **Phone** - Phone number (optional)
- **Company** - Company name (optional)
- **Message** - Inquiry/interest description (10-500 chars)

### Lead Data Example
```json
{
  "name": "John Smith",
  "email": "john@techcorp.com",
  "phone": "+1-555-0123",
  "company": "TechCorp Inc",
  "message": "We're interested in your platform for scaling our dev team. Can you tell us about pricing and enterprise features?"
}
```

---

## 2. THE 4 QUALIFICATION CATEGORIES

### **QUALIFIED** ✅ Sales Ready
**Definition:** High-fit leads ready for immediate sales engagement.

**Characteristics:**
- Clear business need matching your product
- Appropriate company size for your ideal customer profile (ICP)
- Budget/authority signals present
- Urgent timeline or immediate need
- Decision-maker or influencer in conversation
- Relevant industry/use case

**Decision Made By:** AI/LLM analysis with business rules validation

**Action:** 
- ✅ Email drafted by AI
- ✅ Sent to Slack for human approval/approval
- ✅ Sales team priority outreach

**Example:**
```
Lead: Sarah Chen from Fortune 500 fintech company
Message: "Our 200-person dev team needs to improve deployment speed. 
Enterprise ready. Can we schedule a demo this week?"
→ QUALIFIED - Clear need, large company, urgency, budget signals
```

---

### **FOLLOW_UP** 🔄 Nurture & Timing
**Definition:** Interested leads with wrong timing or incomplete information.

**Characteristics:**
- Genuine interest in the product
- Wrong timing (evaluating competitors, budget next quarter)
- Missing information (need to ask questions)
- Small company that may grow
- Exploratory stage (not yet ready to buy)
- Seasonal needs (hiring pending, etc.)

**Decision Made By:** AI/LLM analysis of interest level + timeline signals

**Action:**
- ✅ Email drafted by AI (nurture/exploratory tone)
- ✅ Sent to Slack for human approval
- ✅ Added to nurture sequence
- ✅ Follow-up scheduled for 2-4 weeks

**Example:**
```
Lead: Michael Torres from startup (8-person team)
Message: "Love what you're doing. We're exploring options for next year 
when we expand to 50 people. Can you send documentation?"
→ FOLLOW_UP - Interested but wrong timing, growth potential
```

---

### **UNQUALIFIED** ❌ Not a Fit
**Definition:** Leads that don't match business criteria.

**Characteristics:**
- Wrong industry/use case
- Too small for your ICP (insufficient company size/budget)
- Competitor (should not engage)
- Just researching (no genuine need)
- Budget constraints that don't fit your pricing
- Geographic/market mismatch

**Decision Made By:** AI/LLM analysis against business rules

**Action:**
- ❌ No email sent
- ❌ No Slack notification
- ❌ Logged for analytics
- ❌ Can optionally add to low-priority email list

**Example:**
```
Lead: Alex Kumar from competitor company
Message: "What's your tech stack and pricing model?"
→ UNQUALIFIED - Competitor reconnaissance, not a genuine lead

Lead: Small freelancer with no team
Message: "I'm a solo dev, interested in your enterprise platform"
→ UNQUALIFIED - Wrong ICP (solo dev, not enterprise team)
```

---

### **SUPPORT** 🛠️ Not a Sales Lead
**Definition:** Inquiry that needs support/operations, not sales.

**Characteristics:**
- Existing customer with technical question
- Bug report or integration issue
- Partnership/vendor inquiry
- Refund/billing request
- Onboarding/training request
- Press/media inquiry
- Wrong contact (meant for support not sales)

**Decision Made By:** Content analysis for support keywords/patterns

**Action:**
- ❌ No sales email sent
- ⚙️ Routed to Support/Operations team
- ⚙️ Creates support ticket
- ⚙️ Skips sales pipeline entirely

**Example:**
```
Lead: Maria Santos from existing customer
Message: "We're getting 404 errors integrating with your API. 
Can your support team help? Ticket #12345"
→ SUPPORT - Existing customer, technical issue

Lead: Events team inquiry
Message: "Interested in sponsoring DevCon 2026. Who should we contact?"
→ SUPPORT - Partnership/vendor inquiry, route to BD team
```

---

## 3. DECISION TREE & DIFFERENTIATION LOGIC

```
INPUT: Lead Form Data
           ↓
    [ANALYZE WITH LLM]
           ↓
    ┌─────┴─────────────────────────┐
    ↓                               ↓
IS IT A SUPPORT ISSUE?    IS IT A GENUINE SALES LEAD?
(Bug, existing customer,   (Shows interest, asks questions)
 partnership, press)              ↓
    ↓ YES                    ↓ YES          ↓ NO
   SUPPORT          ┌─────────┴────────┐  UNQUALIFIED
  (Route to ops)    ↓                  ↓
              QUALIFIED        FOLLOW_UP
              (Ready to buy)   (Interested, timing issue)
                   ↓                 ↓
              Draft Email       Draft Email
              (Sales tone)      (Nurture tone)
                   ↓                 ↓
              Send to Slack   Send to Slack
             for approval    for approval
```

---

## 4. IMPLEMENTATION APPROACH

### **Decision Maker: AI/LLM**
- **Primary Logic:** Claude AI (via generateObject) analyzes lead against business rules
- **Inputs:** Lead data + company research + business configuration
- **Outputs:** Category + confidence + reasoning

### **Business Rules Engine**
Configuration stored in `lib/qualification-rules.ts`:
```typescript
Business ICP (Ideal Customer Profile):
- Company size: 20-5000 employees
- Industry: Technology, Finance, SaaS
- Budget indicator: $10K-$500K+ annually
- Use case: Development, DevOps, Infrastructure

Red flags:
- Competitor companies (list maintained)
- Freelancers/Solo operators
- Non-tech companies evaluating for personal use
- Budget <$1K annually

Support keywords:
- "error", "bug", "ticket", "integration issue"
- "existing customer", "onboarding"
- "sponsorship", "partnership", "press"
```

### **Confidence Scoring**
Each qualification includes confidence (0-100):
- **95-100%:** Clear signals, proceed with confidence
- **80-94%:** Strong signals, minor ambiguity
- **70-79%:** Moderate signals, human review recommended
- **<70%:** Ambiguous, human should decide

---

## 5. TESTING SCENARIOS

### Test Leads
1. **QUALIFIED Lead:** Large company, clear need, Enterprise ask
2. **FOLLOW_UP Lead:** Startup, interested, wrong timing
3. **UNQUALIFIED Lead:** Solo dev or competitor
4. **SUPPORT Lead:** Bug report or existing customer issue

See `LEAD_QUALIFICATION_EXAMPLES.md` for detailed test cases.

---

## 6. BUSINESS CONFIGURATION

### Default Configuration (SaaS Dev Platform)
```
ICP Profile:
- Target: Engineering teams (5+ developers)
- Industry: Tech, Web3, Fintech, SaaS
- Company Size: 20-5000
- Budget Range: $50K-$500K annually

Qualification Rules:
- QUALIFIED if: (Large company OR High urgency) + Clear need + Budget signals
- FOLLOW_UP if: (Interested + Wrong timing) OR (Small growth-potential company)
- UNQUALIFIED if: Solo operator OR Wrong industry OR Competitor OR Budget <$5K
- SUPPORT if: Keywords match support patterns OR Existing customer

Confidence Threshold: 75%
```

---

## 7. NEXT STEPS FOR CUSTOMIZATION

To adapt this framework for YOUR business:

1. **Update ICP** in `lib/qualification-rules.ts`:
   - Target company size
   - Relevant industries
   - Budget range
   - Decision-maker titles

2. **Define Red Flags**:
   - Competitor companies list
   - Unsuitable industries
   - Geographic restrictions

3. **Add Company Research**:
   - Pass company size, industry from research
   - Include tech stack relevance
   - Add funding/budget signals

4. **Adjust Confidence Threshold**:
   - Lower = more auto-approvals (riskier)
   - Higher = more manual reviews (safer)

5. **Monitor & Iterate**:
   - Track which leads convert
   - Adjust rules based on win/loss analysis
   - Refine LLM prompts quarterly

---

## 8. METRICS TO TRACK

- Qualification accuracy (% that convert by category)
- False positive rate (QUALIFIED that don't engage)
- False negative rate (UNQUALIFIED that would've converted)
- Average time to first response (by category)
- Win rate by category (revenue closed)

This helps optimize the system over time.
