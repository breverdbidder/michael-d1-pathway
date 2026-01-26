/**
 * Michael D1 Pathway - Chat API Worker
 * Cloudflare Worker handling Claude API requests
 */

export interface Env {
  ANTHROPIC_API_KEY: string;
}

// Intent detection (simplified for worker)
function detectIntent(message: string): { type: string; confidence: number } {
  const intents: Record<string, { patterns: RegExp[]; weight: number }> = {
    SWIM_TIMES: {
      patterns: [/pr|best time|time|personal record/i, /\d{2,3}\s*(free|fly|back)/i],
      weight: 0.9,
    },
    MEET_SCHEDULE: {
      patterns: [/when.*(futures|sectionals|flags|meet)/i, /meet.*(schedule|calendar)/i],
      weight: 0.85,
    },
    SHABBAT_CHECK: {
      patterns: [/shabbat|sabbath|conflict.*saturday/i, /saturday.*conflict/i],
      weight: 0.95,
    },
    RECRUITING: {
      patterns: [/recruiting|d1 schools|college swimming|cut times/i],
      weight: 0.85,
    },
    NUTRITION: {
      patterns: [/keto|diet|what.*eat|meal|nutrition/i],
      weight: 0.8,
    },
  };

  for (const [intent, config] of Object.entries(intents)) {
    for (const pattern of config.patterns) {
      if (pattern.test(message)) {
        return { type: intent, confidence: config.weight };
      }
    }
  }
  return { type: 'GENERAL', confidence: 0.1 };
}

// Build context based on intent
function getContext(intentType: string): string {
  const contexts: Record<string, string> = {
    SWIM_TIMES: `Michael's SCY Best Times:
- 50 Free: 21.89 (FL Senior Champs, Dec 2025)
- 100 Free: 47.52 (FL Senior Champs, Dec 2025)
- 200 Free: 1:44.21 (Sectionals, Nov 2025)
- 100 Fly: 52.34 (FL Senior Champs, Dec 2025)
- 100 Back: 53.87 (Sectionals, Nov 2025)`,
    MEET_SCHEDULE: `2026 Key Meets:
- Sectionals: Feb 12-15, Orlando (SCY)
- Senior Champs: Mar 19-22, Gainesville (SCY)
- Sectionals: Jun 4-7, Jacksonville (LCM)
- Senior Champs: Jul 16-19, Sarasota (LCM)
- USA Futures: Jul 29 - Aug 1, Austin (LCM) - PRIMARY TARGET
- Winter Juniors: Dec 9-12, Greensboro (SCY) - CRITICAL`,
    SHABBAT_CHECK: `Shabbat Observance Rules:
- No swimming from Friday sunset until Saturday havdalah
- Check each meet for Saturday conflicts
- Michael is Orthodox and strictly observant`,
    RECRUITING: `D1 Recruiting Status:
- Class of 2027
- Primary events: 50/100/200 Free, 100 Fly, 100 Back
- Target schools: UF, FSU, Auburn, Georgia
- SwimCloud ID: 3250085`,
    NUTRITION: `Michael's Keto Diet (Michael Andrew style):
- Monday-Thursday: Strict keto (70% fat, 25% protein, 5% carbs)
- Friday-Sunday: Moderate carbs for Shabbat
- All meals strictly kosher`,
    GENERAL: `Michael Shapira - D1 Swimming Recruit
- SwimCloud ID: 3250085
- Class of 2027
- Events: 50/100/200 Free, 100 Fly, 100 Back
- Observance: Orthodox Jewish (Shabbat observant)`,
  };
  return contexts[intentType] || contexts.GENERAL;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { messages } = await request.json() as { messages: Array<{ role: string; content: string }> };
      const latestMessage = messages[messages.length - 1]?.content || '';
      const intent = detectIntent(latestMessage);
      const context = getContext(intent.type);

      const systemPrompt = `You are Michael D1 Pathway Assistant for Michael Shapira's D1 swimming recruiting journey.

ATHLETE PROFILE:
- Name: Michael Shapira
- SwimCloud ID: 3250085
- Class of 2027
- Events: 50/100/200 Free, 100 Fly, 100 Back
- Observance: Orthodox Jewish (Shabbat observant)

DETECTED INTENT: ${intent.type} (${Math.round(intent.confidence * 100)}% confidence)

RELEVANT CONTEXT:
${context}

Be helpful, encouraging, and knowledgeable about D1 swimming recruiting. Always respect Shabbat constraints.`;

      // Call Claude API with streaming
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });

      // Return streaming response
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
