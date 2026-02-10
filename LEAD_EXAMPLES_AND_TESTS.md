# Lead Qualification Examples & Testing Guide

This document provides detailed test cases for each qualification category. Use these to validate your qualification system.

---

## 📋 How to Test

1. Fill out the lead form on your application with the test lead data
2. The system will:
   - Research the lead (if connected to real research tools)
   - Classify using the AI qualification logic
   - Send to Slack for approval
3. Verify the category matches the expected result
4. Adjust `lib/qualification-rules.ts` if results don't match expectations

---

## ✅ QUALIFIED LEADS (Ready for Sales)

### Example 1: Enterprise Company - Clear Urgent Need
```
Name: Sarah Chen
Email: sarah.chen@techcorp.com
Phone: +1-555-0123
Company: TechCorp Inc (500 employees)
Message: "Our 200-person engineering team is struggling with deployment 
scalability and DevOps efficiency. Leadership has approved budget for Q1 
for implementing CI/CD improvements. Can we schedule a demo this week?"

Expected Category: QUALIFIED ✅
Reasoning:
- ✓ Large company (500 employees) → High ICP match
- ✓ Clear business problem identified
- ✓ Appropriate decision-maker (likely CTO/VP)
- ✓ Budget explicitly approved
- ✓ Urgent timeline ("this week")
- ✓ Specific need (CI/CD deployment scaling)

Confidence: 95%
Action: Auto-draft email, send to Slack for approval
```

---

### Example 2: Growing Tech Company - Production Issue
```
Name: James Wilson
Email: james@innovatetech.io
Phone: +1-555-0456
Company: InnovateTech (150 employees)
Message: "We're experiencing performance issues with our current deployment 
platform and need to upgrade immediately. We have allocated budget and 
can make a decision within 2 weeks. What are your enterprise features?"

Expected Category: QUALIFIED ✅
Reasoning:
- ✓ mid-large company (150 people)
- ✓ Urgent need (production issues)
- ✓ Budget allocated
- ✓ Clear decision timeline
- ✓ Specific feature inquiry

Confidence: 92%
Action: Auto-draft email, send to Slack for approval
```

---

### Example 3: Fortune 500 Banking - Multi-team Integration
```
Name: Dr. Maria Garcia
Email: m.garcia@megabank.com
Phone: +1-555-0789
Company: MegaBank (5000+ employees)
Message: "Dr. Maria Garcia, VP Engineering here. We're evaluating modern 
deployment solutions for our 300-person engineering org. Enterprise-grade 
security and compliance are critical. Can you provide an enterprise proposal? 
We aim to decide by end of Q1."

Expected Category: QUALIFIED ✅
Reasoning:
- ✓ Fortune 500 company (5000+ employees)
- ✓ VP-level decision maker (high authority)
- ✓ Large team size (300 engineers)
- ✓ Enterprise requirements mentioned (security, compliance)
- ✓ Clear decision timeline
- ✓ Specific use case (multi-team integration)

Confidence: 98%
Action: Auto-draft email, send to Slack for approval
```

---

## 🔄 FOLLOW_UP LEADS (Interested but Timing Issues)

### Example 1: Startup - Growth Potential
```
Name: Michael Torres
Email: michael@startupxyz.io
Phone: +1-555-0111
Company: StartupXYZ (12 employees)
Message: "We absolutely love what you're building and see it being perfect 
for our scaling journey. Right now we're a small team, but we're raising 
Series A funding over the next 3 months. We'll need your solution when we 
grow to 50+ people. Can you send over documentation and pricing?"

Expected Category: FOLLOW_UP 🔄
Reasoning:
- ✓ Genuine interest expressed ("love what you're building")
- ✓ Wrong timing (currently too small, but will grow)
- ✓ Growth potential clear (Series A fundraising)
- ✓ Future need identified (when they scale)
- ✓ Exploratory phase (requesting documentation, not ready to buy)
- ✗ Too small for current ICP (12 people)

Confidence: 85%
Action: Send nurture email, add to growth-track, follow up in 3 months
```

---

### Example 2: Mid-market Company - Budget Cycle Timing
```
Name: Elizabeth Park
Email: elizabeth@industech.com
Phone: +1-555-0222
Company: IndusTech (180 employees)
Message: "This is exactly what we need for our engineering team. We're 
definitely interested in implementing this next fiscal year when our 2026 
budget is approved. Can you keep us informed about new features and pricing 
changes in the coming months?"

Expected Category: FOLLOW_UP 🔄
Reasoning:
- ✓ Good company size (180 employees) → ICP match
- ✓ Clear interest and need identified
- ✗ Wrong timing (budget approval in future, not now)
- ✓ Asks for ongoing communication (nurture signal)
- ✓ Not urgent (next fiscal year)

Confidence: 80%
Action: Send nurture email, add to quarterly follow-up sequence
```

---

### Example 3: Startup Exploring Options - Research Phase
```
Name: Alex Chen
Email: alex@techstartup.co
Phone: +1-555-0333
Company: TechStartup (8 employees)
Message: "We're exploring deployment platforms for our upcoming web project. 
Your platform looks promising. What's your pricing model? Do you offer 
startup discounts? We're not ready to commit yet but want to understand all 
options before making a decision in Q2."

Expected Category: FOLLOW_UP 🔄
Reasoning:
- ✓ Interested (exploring options)
- ✗ Not ready to buy (Q2 timeline, exploration phase)
- ✗ Too small (8 people) for standard ICP
- ✓ Asks for pricing (information gathering)
- ✓ Legitimate business need (web project)

Confidence: 78%
Action: Send nurture email with startup resources, follow up in 2 months
```

---

## ❌ UNQUALIFIED LEADS (Not a Fit)

### Example 1: Solo Developer - Personal Project
```
Name: David Smith
Email: david@email.com
Phone: +1-555-0444
Company: (none provided)
Message: "I'm a solo freelance developer working on personal hobby projects. 
I'm interested in learning your platform for personal development skills. 
Do you have a free tier?"

Expected Category: UNQUALIFIED ❌
Reasoning:
- ✗ Solo operator (red flag - below minimum ICP)
- ✗ Personal/hobby project (not business use)
- ✗ No company (freelancer)
- ✗ Looking for free tier (no budget)
- ✗ Learning focus, not business need

Confidence: 98%
Action: No email sent, log for analytics
Handoff: Could send to educational program if available
```

---

### Example 2: Competitor Company Research
```
Name: John Robertson
Email: j.robertson@competitor-platform.com
Phone: +1-555-0555
Company: CompetitorPlatform (200 employees)
Message: "Hi, I'm from CompetitorPlatform's product team. We're doing 
competitive analysis on your platform's features and pricing. What's your 
core differentiation compared to our product?"

Expected Category: UNQUALIFIED ❌
Reasoning:
- ✗ Competitor company (red flag - automatic UNQUALIFIED)
- ✗ Competitive reconnaissance (not genuine lead)
- ✗ Product team inquiry (not a customer)

Confidence: 100%
Action: No email sent, log for competitive intelligence
Handoff: Could route to marketing/product for response if desired
```

---

### Example 3: Wrong Industry - Government/Non-Tech
```
Name: Patricia Johnson
Email: patricia@citygovernment.gov
Phone: +1-555-0666
Company: City Government IT Department
Message: "We are evaluating software deployment solutions for our internal 
government systems. Are you able to work with government compliance and 
security requirements?"

Expected Category: UNQUALIFIED ❌
Reasoning:
- ✗ Government industry (excluded from ICP)
- ✗ No indication of budget availability
- ✗ Compliance requirements likely exceed platform features
- ✗ Sales cycle would be very long
- ✗ Different market/use case from target

Confidence: 90%
Action: No email sent, log for analytics
Note: Could be re-qualified if company expands into government segment
```

---

### Example 4: Education/Student User
```
Name: Thomas Anderson
Email: thomas.anderson@university.edu
Phone: +1-555-0777
Company: Springfield University
Message: "Hi! I'm a computer science student working on a class project about 
DevOps tools. Can I get a free account and trial to learn your platform for 
my studies?"

Expected Category: UNQUALIFIED ❌
Reasoning:
- ✗ Student/academic use (red flag)
- ✗ Educational institution (not target industry)
- ✗ No business need (class project)
- ✗ No budget/no budget authority

Confidence: 95%
Action: No email sent, route to educational program if available
```

---

## 🛠️ SUPPORT LEADS (Not Sales)

### Example 1: Existing Customer - Technical Issue
```
Name: Maria Santos
Email: maria@existingcustomer.com
Phone: +1-555-0888
Company: ExistingCustomer Inc
Message: "We are seeing 404 errors when calling your API v2 endpoints. 
Our integration is broken and affecting our production pipeline. Can your 
support team help troubleshoot this issue? Our ticket number is TICKET#89234"

Expected Category: SUPPORT 🛠️
Reasoning:
- ✓ Check: "404 errors", "API", "integration", "support team", "ticket"
- ✓ Keywords: error, ticket, support, technical issue
- ✓ Existing customer context
- ✓ Production impact (urgent for support, not sales)
- ✓ Has ticket number (formal support channel)

Confidence: 99%
Action: Route to Support Team, create/link to support ticket
Email: Do NOT send sales email
```

---

### Example 2: Existing Customer - Onboarding Help
```
Name: Jennifer Lee
Email: jennifer@client-company.com
Phone: +1-555-0999
Company: ClientCompany (300 employees)
Message: "We just signed up for your enterprise plan. Our team needs help 
with the initial onboarding and configuration. Can we schedule time with 
your onboarding specialist?"

Expected Category: SUPPORT 🛠️
Reasoning:
- ✓ Keyword: "onboarding" (support keyword)
- ✓ Context: Just signed up (existing customer)
- ✓ Requesting: onboarding help (support function)
- ✓ Looking for: specialist/training (support team)

Confidence: 98%
Action: Route to Onboarding/Success Team
Email: Do NOT send sales email
Response: Send to customer success team
```

---

### Example 3: Partnership Inquiry
```
Name: Robert Chang
Email: robert@partner-corp.com
Phone: +1-555-1111
Company: PartnerCorp (Integration Software)
Message: "Hi, we're interested in partnering with you to integrate our 
platform with yours. Would like to discuss a potential partnership or 
reseller agreement. Who should we contact in your business development team?"

Expected Category: SUPPORT 🛠️
Reasoning:
- ✓ Keywords: "partnership", "partner" (support keywords)
- ✓ Intent: Not buying for themselves (wrong department)
- ✓ Request: Introduction to BD/partnerships (not sales)
- ✓ Use case: Integration partnership

Confidence: 96%
Action: Route to Business Development Team
Email: Do NOT send sales email
Response: Team introduction to BD/partnerships contact
```

---

### Example 4: Press/Media Inquiry
```
Name: Susan Mitchell
Email: susan@techmedia.com
Phone: +1-555-2222
Company: TechMedia Publications
Message: "Hi! I'm a journalist researching deployment platforms for an 
upcoming article in TechMedia Weekly. Could you provide a company overview, 
key statistics, and an interview opportunity with your founder?"

Expected Category: SUPPORT 🛠️
Reasoning:
- ✓ Keywords: "press", "journalist", "article", "interview"
- ✓ Context: Media company, not buying
- ✓ Request: PR/communications function

Confidence: 97%
Action: Route to Communications/PR Team
Email: Do NOT send sales email
Response: Team introduction to PR/communications contact
```

---

## 📊 Summary Testing Matrix

| Lead Type | Category | Auto-Send Email | Route | Notes |
|-----------|----------|-----------------|-------|-------|
| Enterprise + Urgent | QUALIFIED ✅ | Yes | Sales | High priority |
| Startup + Growth | FOLLOW_UP 🔄 | Yes (nurture) | Sales nurture | 3-month follow-up |
| Solo Developer | UNQUALIFIED ❌ | No | Archive | Red flag |
| Competitor | UNQUALIFIED ❌ | No | Log | Competitive intel |
| Tech Issue | SUPPORT 🛠️ | No | Support | Priority urgent |
| Onboarding | SUPPORT 🛠️ | No | Success | Route to CSM |
| Partnership | SUPPORT 🛠️ | No | BD Team | New department |
| Press | SUPPORT 🛠️ | No | PR Team | Communications |

---

## 🧪 How to Run Tests

### Option 1: Manual Testing
1. Go to your lead form
2. Copy one of the test leads above
3. Fill in the form with that data
4. Submit
5. Check Slack for the result
6. Verify category matches "Expected Category"

### Option 2: Automated Testing (if you want to add unit tests)
```bash
# Create a test file and run qualification function directly
npm test -- lib/services.test.ts
```

---

## 🎯 Expected Outcomes

- **QUALIFIED**: Email drafted + Slack notification with "Approve" button
- **FOLLOW_UP**: Email drafted (nurture tone) + Slack notification  
- **UNQUALIFIED**: Logged in database, no action taken
- **SUPPORT**: Routed to support team, no sales email sent

---

## 📈 Tips for Optimization

1. **Track Results**: Log which leads actually convert to deals
2. **Adjust Thresholds**: Lower confidence threshold = more auto-sends (riskier)
3. **Refine Rules**: Update `QUALIFICATION_CONFIG` based on win/loss analysis
4. **Monitor False Positives**: Check UNQUALIFIED leads to ensure high-quality filtering
5. **Update Red Flags**: Add new competitor companies as they emerge
6. **Seasonal Adjustments**: Update timing signals for your business cycle

---

## Questions or Need Help?

See `LEAD_QUALIFICATION_FRAMEWORK.md` for complete business logic documentation.
