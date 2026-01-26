# 🏊‍♂️ Michael D1 Pathway

AI-powered chatbot for Michael Shapira's D1 swimming recruiting journey.

## Features

- **Swimming Times**: Track PRs and best times across events
- **Meet Schedule**: 2026 calendar with Futures, Sectionals, FLAGS
- **Shabbat Conflict Detection**: Automatically flags meets conflicting with Shabbat/Yom Tov
- **D1 Recruiting**: Match times against school cut standards
- **Rival Comparison**: Compare against Soto and Gordon
- **Nutrition**: Kosher-adapted keto diet plan

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS
- **AI**: Claude Sonnet 4.5 via Anthropic API
- **Database**: Supabase (Postgres)
- **NLP**: Custom intent detection (7 swimming-specific intents)
- **Deployment**: Cloudflare Pages

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://mocerqjnksmhcjzxrewo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
ANTHROPIC_API_KEY=your_anthropic_key
SWIMCLOUD_ATHLETE_ID=3250085
```

## Intent Detection

| Intent | Example |
|--------|---------|
| SWIM_TIMES | "What's my 100 Free PR?" |
| MEET_SCHEDULE | "When is Futures 2026?" |
| SHABBAT_CHECK | "Does Sectionals conflict with Shabbat?" |
| RECRUITING | "Which D1 schools match my times?" |
| NUTRITION | "What should I eat on keto?" |
| RIVAL_COMPARE | "Compare me to Soto" |
| TRAINING | "What's my weekly schedule?" |

## Athlete Profile

- **Name**: Michael Shapira
- **SwimCloud ID**: 3250085
- **Class**: 2027
- **Events**: 50/100/200 Free, 100 Fly, 100 Back
- **Observance**: Orthodox Jewish (Shabbat observant)

---

Built with ❤️ for Michael's D1 journey | Everest Capital USA
