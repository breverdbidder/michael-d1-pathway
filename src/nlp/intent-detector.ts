/**
 * Michael D1 Pathway - Swimming-Specific Intent Detection
 * Detects 7 swimming intents + entity extraction
 */

export type IntentType =
  | 'SWIM_TIMES'
  | 'MEET_SCHEDULE'
  | 'SHABBAT_CHECK'
  | 'RECRUITING'
  | 'REPORT_GEN'
  | 'NUTRITION'
  | 'RIVAL_COMPARE'
  | 'TRAINING'
  | 'GENERAL';

export interface DetectedIntent {
  type: IntentType;
  confidence: number;
  entities: ExtractedEntities;
  originalMessage: string;
}

export interface ExtractedEntities {
  events: string[];
  meets: string[];
  schools: string[];
  dates: string[];
  rivals: string[];
  timeFormats: ('SCY' | 'LCM')[];
}

// Swimming event patterns
const EVENT_PATTERNS: Record<string, RegExp> = {
  '50 Free': /50\s*(free|freestyle|fr)/i,
  '100 Free': /100\s*(free|freestyle|fr)/i,
  '200 Free': /200\s*(free|freestyle|fr)/i,
  '100 Fly': /100\s*(fly|butterfly)/i,
  '100 Back': /100\s*(back|backstroke)/i,
};

// Meet patterns
const MEET_PATTERNS: Record<string, RegExp> = {
  'Futures': /futures|usa futures|junior futures/i,
  'Sectionals': /sectionals|sect/i,
  'FLAGS': /flags|florida age group/i,
  'Senior Champs': /senior champs|sr champs/i,
  'Winter Juniors': /winter juniors|wj/i,
};

// D1 School patterns
const SCHOOL_PATTERNS: Record<string, RegExp> = {
  'UF': /\b(uf|florida|gators|university of florida)\b/i,
  'FSU': /\b(fsu|florida state|seminoles)\b/i,
  'Miami': /\b(miami|hurricanes|um)\b/i,
  'FAU': /\b(fau|florida atlantic)\b/i,
  'UCF': /\b(ucf|central florida|knights)\b/i,
  'UGA': /\b(uga|georgia|bulldogs)\b/i,
  'Auburn': /\b(auburn|tigers)\b/i,
  'Texas': /\b(texas|longhorns|ut)\b/i,
  'Cal': /\b(cal|berkeley|golden bears)\b/i,
  'Stanford': /\b(stanford|cardinal)\b/i,
  'Michigan': /\b(michigan|wolverines)\b/i,
  'Indiana': /\b(indiana|hoosiers|iu)\b/i,
};

// Rival patterns (SwimCloud IDs)
const RIVAL_PATTERNS: Record<string, { pattern: RegExp; swimcloudId: string }> = {
  'Soto': { pattern: /soto/i, swimcloudId: '2928537' },
  'Gordon': { pattern: /gordon/i, swimcloudId: '1733035' },
};

// Intent detection patterns with confidence weights
const INTENT_PATTERNS: Record<IntentType, { patterns: RegExp[]; weight: number }> = {
  SWIM_TIMES: {
    patterns: [
      /what('s| is) my (pr|best time|time|personal record)/i,
      /my (pr|best time|time) (in|for)/i,
      /show (me )?my times/i,
      /how fast (am i|do i swim)/i,
      /\d{2,3}\s*(free|fly|back|breast)/i,
    ],
    weight: 0.9,
  },
  MEET_SCHEDULE: {
    patterns: [
      /when (is|are) (the )?(futures|sectionals|flags|meet)/i,
      /meet (schedule|calendar|dates)/i,
      /upcoming meets/i,
      /next (meet|competition)/i,
      /2026 (schedule|calendar)/i,
    ],
    weight: 0.85,
  },
  SHABBAT_CHECK: {
    patterns: [
      /shabbat|sabbath|shomer/i,
      /conflict.*(saturday|shabbos|shabbat)/i,
      /(saturday|shabbos).*(conflict|swim|race)/i,
      /can i (swim|race|compete).*(saturday|shabbat)/i,
      /finals.*(saturday|shabbat)/i,
    ],
    weight: 0.95,
  },
  RECRUITING: {
    patterns: [
      /recruiting|recruit/i,
      /d1 (schools|programs|teams)/i,
      /which (schools|colleges|programs) match/i,
      /college swimming/i,
      /(scholarship|offer|commit)/i,
      /cut times/i,
    ],
    weight: 0.85,
  },
  REPORT_GEN: {
    patterns: [
      /generate.*(report|pdf|document)/i,
      /create.*(report|summary)/i,
      /recruiting (report|packet|profile)/i,
      /download.*(report|profile)/i,
    ],
    weight: 0.9,
  },
  NUTRITION: {
    patterns: [
      /keto|ketogenic|diet/i,
      /what (should|can) i eat/i,
      /meal (plan|prep)/i,
      /nutrition|macros|carbs/i,
      /michael andrew.*(diet|eat)/i,
    ],
    weight: 0.8,
  },
  RIVAL_COMPARE: {
    patterns: [
      /compare.*(soto|gordon|rival)/i,
      /(soto|gordon).*(time|faster|slower)/i,
      /how do i compare/i,
      /rival|competition/i,
    ],
    weight: 0.85,
  },
  TRAINING: {
    patterns: [
      /training|practice|workout/i,
      /dryland|weights|gym/i,
      /yardage|sets/i,
      /coach|coaching/i,
    ],
    weight: 0.75,
  },
  GENERAL: {
    patterns: [/.*/],
    weight: 0.1,
  },
};

/**
 * Extract entities from message
 */
function extractEntities(message: string): ExtractedEntities {
  const entities: ExtractedEntities = {
    events: [],
    meets: [],
    schools: [],
    dates: [],
    rivals: [],
    timeFormats: [],
  };

  // Extract events
  for (const [event, pattern] of Object.entries(EVENT_PATTERNS)) {
    if (pattern.test(message)) {
      entities.events.push(event);
    }
  }

  // Extract meets
  for (const [meet, pattern] of Object.entries(MEET_PATTERNS)) {
    if (pattern.test(message)) {
      entities.meets.push(meet);
    }
  }

  // Extract schools
  for (const [school, pattern] of Object.entries(SCHOOL_PATTERNS)) {
    if (pattern.test(message)) {
      entities.schools.push(school);
    }
  }

  // Extract rivals
  for (const [rival, { pattern }] of Object.entries(RIVAL_PATTERNS)) {
    if (pattern.test(message)) {
      entities.rivals.push(rival);
    }
  }

  // Extract dates (basic patterns)
  const datePatterns = [
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
    /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/,
    /\b(jul|aug|sep|oct|nov|dec|jan|feb|mar|apr|may|jun)\s+\d{1,2}/i,
  ];
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      entities.dates.push(match[0]);
    }
  }

  // Extract time formats
  if (/\b(scy|short course yards|yards)\b/i.test(message)) {
    entities.timeFormats.push('SCY');
  }
  if (/\b(lcm|long course meters|meters)\b/i.test(message)) {
    entities.timeFormats.push('LCM');
  }

  return entities;
}

/**
 * Detect intent from user message
 */
export function detectIntent(message: string): DetectedIntent {
  const entities = extractEntities(message);
  let bestIntent: IntentType = 'GENERAL';
  let bestConfidence = 0;

  for (const [intent, { patterns, weight }] of Object.entries(INTENT_PATTERNS)) {
    if (intent === 'GENERAL') continue;

    for (const pattern of patterns) {
      if (pattern.test(message)) {
        const confidence = weight;
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestIntent = intent as IntentType;
        }
      }
    }
  }

  // Boost confidence if relevant entities found
  if (bestIntent === 'SWIM_TIMES' && entities.events.length > 0) {
    bestConfidence = Math.min(1, bestConfidence + 0.1);
  }
  if (bestIntent === 'MEET_SCHEDULE' && entities.meets.length > 0) {
    bestConfidence = Math.min(1, bestConfidence + 0.1);
  }
  if (bestIntent === 'RECRUITING' && entities.schools.length > 0) {
    bestConfidence = Math.min(1, bestConfidence + 0.1);
  }

  return {
    type: bestIntent,
    confidence: bestConfidence,
    entities,
    originalMessage: message,
  };
}

/**
 * Get rival SwimCloud ID
 */
export function getRivalSwimCloudId(rivalName: string): string | null {
  const rival = RIVAL_PATTERNS[rivalName];
  return rival?.swimcloudId || null;
}

export const MICHAEL_SWIMCLOUD_ID = '3250085';
