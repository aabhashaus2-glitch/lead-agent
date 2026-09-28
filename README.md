# Lead Agent — AI Inbound Lead Qualification

An AI agent that takes an inbound sales enquiry, verifies and researches the lead, decides whether it's worth a salesperson's time, drafts a personalised reply, and holds that reply in Slack until a human approves it.

Built as my individual capstone project for the Master of Business Analytics at Victoria University Sydney (Feb 2026).

> **Starting point:** this project extends Vercel's open-source [`lead-agent`](https://github.com/vercel-labs/lead-agent) reference architecture, which provides the Next.js app shell, the Workflow DevKit wiring and a basic Slack adapter with placeholder service functions. Everything listed under **What I built** below is my own work. The full split is visible in the commit history: template commits end in Dec 2025, mine start on 4 Feb 2026.

---

## What it does

```
Contact form submitted
      │
      ▼
Durable workflow starts (Workflow DevKit) ── user gets an instant response
      │
      ▼
1. Background verification ─ email domain, phone, company, decision-maker,
      │                        tech stack, financial health, risk
      ▼
2. Deep research analysis  ─ need, urgency, budget, fit, growth, main risk
      │
      ▼
3. Qualification           ─ QUALIFIED / FOLLOW_UP / UNQUALIFIED / SUPPORT
      │                        + confidence score, ICP score, key factors
      ▼
4. Personalised email      ─ tone chosen from the category
      │
      ▼
5. Slack approval          ─ full email + verification summary + reasoning,
                               approve / reject buttons; nothing is sent without a human
```

## What I built

**Background verification module** — [`lib/background-verification.ts`](lib/background-verification.ts) (~400 lines)
- Email validation that separates corporate domains from public ones (Gmail, Outlook and so on).
- Phone validation that catches fake and test numbers, such as `123456789`, repeated digits or runs of sequential digits.
- Company research through the Exa search API: industry, headcount, location, funding, website and LinkedIn.
- Decision-maker check: classifies the title (C-suite, VP/Director, Manager, IC) and looks for a matching LinkedIn profile.
- Tech-stack detection and a financial-health scan for red flags such as layoffs, bankruptcy or fraud news.
- An overall risk assessment with contributing factors and a recommendation.
- Tuned for the Exa free tier: sequential calls with 1-second spacing, a 3-second timeout on optional checks, and graceful fallbacks so one slow API never fails the whole lead.

**Qualification rules engine** — [`lib/qualification-rules.ts`](lib/qualification-rules.ts)
- An ideal-customer-profile (ICP) config covering company size, target industries, budget range, decision-maker titles, regions and growth stage.
- Red-flag rules that send competitors, excluded industries, "student / hobby project" enquiries and budgets under $5K to UNQUALIFIED.
- Support-keyword routing, so bug reports and billing questions go to SUPPORT instead of sales.
- Signal counting for urgency, need, budget and decision authority, plus nurture signals ("next quarter", "evaluating") for FOLLOW_UP.
- Confidence thresholds: auto-approve only at 80 or above, always require human review below 70, and log the 70–80 edge cases.

**AI services** — [`lib/services.ts`](lib/services.ts)
- `qualify()`: structured output through the AI SDK's `generateObject` with a Zod schema that returns the category, reasoning, confidence, ICP score and key factors.
- `deepResearch()`: a structured analysis across eight dimensions, ending in a STRONG / GOOD / UNCERTAIN / POOR fit recommendation.
- `writeEmail()`: tone chosen from the category. Qualified leads get a direct, sales-focused email; follow-ups get an exploratory, nurturing one.

**Slack human-in-the-loop** — [`lib/slack.ts`](lib/slack.ts)
- Notifications for every lead category with category-specific buttons.
- The full draft email plus a readable verification summary and the model's decision logic, so the reviewer sees why before approving.
- Fast acknowledgement of Slack actions to avoid payload timeouts, and Vercel KV for message state (optional in development).

**Production hardening:** a Node runtime for the Slack route, TypeScript build fixes for Vercel, parallel-then-sequential tuning of the verification tasks against serverless timeouts, and extra logging for Slack delivery failures.

**Documentation:** a product requirements document and a project knowledge document in [`docs/`](docs/), plus guides such as [`LEAD_QUALIFICATION_FRAMEWORK.md`](LEAD_QUALIFICATION_FRAMEWORK.md), [`CUSTOMIZATION_GUIDE.md`](CUSTOMIZATION_GUIDE.md) and [`ARCHITECTURE_DIAGRAM.md`](ARCHITECTURE_DIAGRAM.md).

## Tech stack

| Layer | Tools |
|---|---|
| App | Next.js 16 (App Router, API routes), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, React Hook Form |
| Durable execution | Workflow DevKit (`workflow`) |
| AI | Vercel AI SDK (`generateObject`, `generateText`) through the Vercel AI Gateway (`gpt-4o-mini`) |
| Validation | Zod |
| Research | Exa.ai |
| Human-in-the-loop | Slack Bolt with `@vercel/slack-bolt`, Block Kit |
| State and hosting | Vercel KV, Vercel |

## Running it locally

Requirements: Node.js 20+, pnpm, a Slack app (the manifest is in `manifest.json`), a Vercel AI Gateway key and an Exa API key.

```bash
git clone https://github.com/aabhashaus2-glitch/lead-agent.git
cd lead-agent
pnpm install
cp .env.example .env.local   # add AI_GATEWAY_API_KEY, EXA_API_KEY, SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_CHANNEL_ID
pnpm dev
```

Open http://localhost:3000 and submit a test lead. If the Slack variables are missing, the app still runs with the Slack step disabled.

## Project structure

```
app/api/submit/        form endpoint that starts the workflow
app/api/slack/         Slack events and button actions
workflows/inbound/     the durable workflow and its steps
lib/background-verification.ts   verification and risk checks (mine)
lib/qualification-rules.ts       ICP and qualification rules (mine)
lib/services.ts        qualify / research / email (extended)
lib/slack.ts           Slack messages and approval (extended)
docs/                  PRD and project knowledge document
```

## Credits

Base architecture: [vercel-labs/lead-agent](https://github.com/vercel-labs/lead-agent) (MIT). Extensions by **Aabhash Bhattacharya**: [aabhash.in](https://aabhash.in) · [LinkedIn](https://www.linkedin.com/in/aabhash-bhattacharya).

## License

MIT
