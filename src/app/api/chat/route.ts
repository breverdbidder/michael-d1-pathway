/**
 * Michael D1 Pathway - Chat API Route
 * POST /api/chat
 */

import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { detectIntent } from '@/nlp/intent-detector';
import { routeIntent } from '@/nlp/intent-router';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the latest user message
  const latestMessage = messages[messages.length - 1];
  const userContent = latestMessage?.content || '';

  // Detect intent from user message
  const detectedIntent = detectIntent(userContent);

  // Route intent and get context
  const routeResult = await routeIntent(detectedIntent);

  // Build system prompt with context
  const systemPrompt = `You are Michael D1 Pathway Assistant, an AI helper for Michael Shapira's D1 swimming recruiting journey.

ATHLETE PROFILE:
- Name: Michael Shapira
- SwimCloud ID: 3250085
- Class of 2027
- Height: 6'4" | Weight: 215 lbs
- Events: 50/100/200 Free, 100 Fly, 100 Back
- Club: Satellite Beach Swim Team (FL)
- School: Satellite Beach High School
- Religious Observance: Orthodox Jewish (Shabbat observant - no swimming from Friday sunset to Saturday havdalah)

RIVALS:
- Soto (SwimCloud: 2928537)
- Gordon (SwimCloud: 1733035)

DIETARY APPROACH:
- Keto diet Monday-Thursday (following Michael Andrew's approach)
- Moderate carbs Friday-Sunday for Shabbat
- Strictly kosher

2026 KEY MEETS:
- Winter Juniors (December) - CRITICAL
- Sectionals (February & June)
- Senior Champs (March & July)
- Futures (July 29 - August 1) - PRIMARY TARGET

DETECTED INTENT: ${detectedIntent.type} (Confidence: ${(detectedIntent.confidence * 100).toFixed(0)}%)
EXTRACTED ENTITIES: ${JSON.stringify(detectedIntent.entities)}

RELEVANT CONTEXT:
${routeResult.context}

INSTRUCTIONS:
1. Be helpful, encouraging, and knowledgeable about D1 swimming recruiting
2. Always respect Shabbat scheduling constraints
3. Use the provided context data to give accurate, specific answers
4. For recruiting questions, consider Michael's times vs school cut times
5. For Shabbat conflicts, clearly identify problematic dates
6. Keep responses concise but informative
7. Use emojis sparingly for swim-related topics (🏊‍♂️ ⏱️ 🎓)`;

  // Stream response from Claude
  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
