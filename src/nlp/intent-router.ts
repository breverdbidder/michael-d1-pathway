/**
 * Michael D1 Pathway - Intent Router
 * Routes detected intents to appropriate handlers and generates context for Claude
 */

import { DetectedIntent, IntentType } from '../nlp/intent-detector';
import {
  getD1Schools,
  getMeetSchedule,
  checkShabbatConflict,
  queryKnowledgeBase,
  getMatchingSchools,
} from '../lib/supabase';
import {
  fetchAthleteTimes,
  getBestTimes,
  compareToRival,
  checkQualification,
  getQualifyingStandards,
  MICHAEL_SWIMCLOUD_ID,
  RIVALS,
} from '../api/swimcloud';

export interface RouteResult {
  intent: IntentType;
  context: string;
  data: Record<string, unknown>;
  suggestedResponse?: string;
}

/**
 * Route intent to appropriate handler
 */
export async function routeIntent(intent: DetectedIntent): Promise<RouteResult> {
  switch (intent.type) {
    case 'SWIM_TIMES':
      return handleSwimTimes(intent);
    case 'MEET_SCHEDULE':
      return handleMeetSchedule(intent);
    case 'SHABBAT_CHECK':
      return handleShabbatCheck(intent);
    case 'RECRUITING':
      return handleRecruiting(intent);
    case 'NUTRITION':
      return handleNutrition(intent);
    case 'RIVAL_COMPARE':
      return handleRivalCompare(intent);
    case 'TRAINING':
      return handleTraining(intent);
    case 'REPORT_GEN':
      return handleReportGen(intent);
    default:
      return handleGeneral(intent);
  }
}

/**
 * Handle SWIM_TIMES intent
 */
async function handleSwimTimes(intent: DetectedIntent): Promise<RouteResult> {
  const times = await fetchAthleteTimes(MICHAEL_SWIMCLOUD_ID);
  const bestTimes = await getBestTimes(MICHAEL_SWIMCLOUD_ID);
  
  // Filter by requested events if specified
  let filteredTimes = times;
  if (intent.entities.events.length > 0) {
    filteredTimes = times.filter((t) =>
      intent.entities.events.some((e) => t.event.toLowerCase().includes(e.toLowerCase()))
    );
  }
  
  // Filter by course if specified
  if (intent.entities.timeFormats.length > 0) {
    filteredTimes = filteredTimes.filter((t) =>
      intent.entities.timeFormats.includes(t.course)
    );
  }
  
  const timesTable = filteredTimes
    .map((t) => `${t.event} (${t.course}): ${t.time} - ${t.meet} (${t.date})`)
    .join('\n');
  
  return {
    intent: 'SWIM_TIMES',
    context: `Michael Shapira's swimming times (SwimCloud ID: ${MICHAEL_SWIMCLOUD_ID}):\n${timesTable}`,
    data: { times: filteredTimes, bestTimes },
    suggestedResponse: filteredTimes.length > 0
      ? `Here are Michael's times:\n${timesTable}`
      : 'No times found for the specified criteria.',
  };
}

/**
 * Handle MEET_SCHEDULE intent
 */
async function handleMeetSchedule(intent: DetectedIntent): Promise<RouteResult> {
  const schedule = await getMeetSchedule(2026);
  
  // Filter by meet name if specified
  let filteredSchedule = schedule;
  if (intent.entities.meets.length > 0) {
    filteredSchedule = schedule.filter((m) =>
      intent.entities.meets.some((meet) =>
        m.meet_name.toLowerCase().includes(meet.toLowerCase())
      )
    );
  }
  
  const scheduleTable = filteredSchedule
    .map((m) => `${m.meet_name}: ${m.start_date} to ${m.end_date} @ ${m.location} (${m.pool_type})${m.shabbat_conflict ? ' ⚠️ SHABBAT CONFLICT' : ''}`)
    .join('\n');
  
  return {
    intent: 'MEET_SCHEDULE',
    context: `Michael's 2026 Meet Schedule:\n${scheduleTable}`,
    data: { schedule: filteredSchedule },
    suggestedResponse: `Here's the 2026 meet schedule:\n${scheduleTable}`,
  };
}

/**
 * Handle SHABBAT_CHECK intent
 */
async function handleShabbatCheck(intent: DetectedIntent): Promise<RouteResult> {
  // Get meet schedule and check for conflicts
  const schedule = await getMeetSchedule(2026);
  
  const conflictResults: {
    meetName: string;
    dates: string;
    hasConflict: boolean;
    conflictDates: string[];
  }[] = [];
  
  for (const meet of schedule) {
    const result = await checkShabbatConflict(meet.start_date, meet.end_date);
    conflictResults.push({
      meetName: meet.meet_name,
      dates: `${meet.start_date} to ${meet.end_date}`,
      hasConflict: result.hasConflict,
      conflictDates: result.conflicts.map((c) => `${c.date} (${c.name})`),
    });
  }
  
  const conflictMeets = conflictResults.filter((r) => r.hasConflict);
  const safeMeets = conflictResults.filter((r) => !r.hasConflict);
  
  let context = 'Shabbat Conflict Analysis for 2026 Meets:\n\n';
  
  if (conflictMeets.length > 0) {
    context += '⚠️ MEETS WITH SHABBAT CONFLICTS:\n';
    for (const meet of conflictMeets) {
      context += `- ${meet.meetName} (${meet.dates}): ${meet.conflictDates.join(', ')}\n`;
    }
    context += '\n';
  }
  
  if (safeMeets.length > 0) {
    context += '✅ MEETS WITHOUT CONFLICTS:\n';
    for (const meet of safeMeets) {
      context += `- ${meet.meetName} (${meet.dates})\n`;
    }
  }
  
  return {
    intent: 'SHABBAT_CHECK',
    context,
    data: { conflictResults, conflictMeets, safeMeets },
    suggestedResponse: context,
  };
}

/**
 * Handle RECRUITING intent
 */
async function handleRecruiting(intent: DetectedIntent): Promise<RouteResult> {
  const schools = await getD1Schools();
  
  // Get Michael's best SCY times for matching
  const michaelTimes = await getBestTimes(MICHAEL_SWIMCLOUD_ID, 'SCY');
  const timesForMatching: Record<string, string> = {};
  for (const [key, time] of Object.entries(michaelTimes)) {
    const event = key.replace('_SCY', '');
    timesForMatching[event] = time.time;
  }
  
  // Get qualifying standards
  const standards = getQualifyingStandards();
  
  // Filter by requested schools if specified
  let filteredSchools = schools;
  if (intent.entities.schools.length > 0) {
    filteredSchools = schools.filter((s) =>
      intent.entities.schools.some((school) =>
        s.school_name.toLowerCase().includes(school.toLowerCase())
      )
    );
  }
  
  const schoolsInfo = filteredSchools
    .map((s) => `${s.school_name} (${s.conference}): ${s.engineering_program ? '🎓 Has Engineering' : ''} ${s.chabad_contact ? '✡️ Chabad nearby' : ''}`)
    .join('\n');
  
  return {
    intent: 'RECRUITING',
    context: `D1 Recruiting Information:\n\nMichael's Best SCY Times:\n${JSON.stringify(timesForMatching, null, 2)}\n\nTarget Schools:\n${schoolsInfo}\n\nFutures 2026 Standards:\n${JSON.stringify(standards.futures_2026, null, 2)}`,
    data: { schools: filteredSchools, michaelTimes: timesForMatching, standards },
    suggestedResponse: `Here's the recruiting analysis:\n${schoolsInfo}`,
  };
}

/**
 * Handle NUTRITION intent
 */
async function handleNutrition(intent: DetectedIntent): Promise<RouteResult> {
  // Michael follows keto M-Th, moderate carbs F-Su for Shabbat
  const nutritionPlan = {
    weekday: {
      name: 'Keto (Monday-Thursday)',
      macros: { fat: '70%', protein: '25%', carbs: '5%' },
      meals: [
        'Breakfast: Eggs with avocado and cheese',
        'Lunch: Grilled chicken salad with olive oil',
        'Dinner: Salmon with asparagus and butter',
        'Snacks: Nuts, cheese, hard-boiled eggs',
      ],
    },
    shabbat: {
      name: 'Moderate Carbs (Friday-Sunday)',
      macros: { fat: '40%', protein: '30%', carbs: '30%' },
      meals: [
        'Shabbat dinner: Challah, chicken, vegetables',
        'Shabbat lunch: Cholent, kugel',
        'Sunday recovery: Balanced meals with complex carbs',
      ],
    },
    preMeet: {
      name: 'Pre-Competition',
      notes: 'Carb loading 24-48 hours before major meets for optimal glycogen stores',
    },
  };
  
  return {
    intent: 'NUTRITION',
    context: `Michael's Kosher-Adapted Keto Diet Plan (Michael Andrew Style):\n\nWeekday Plan: ${nutritionPlan.weekday.name}\nMacros: ${JSON.stringify(nutritionPlan.weekday.macros)}\nMeals:\n${nutritionPlan.weekday.meals.join('\n')}\n\nShabbat Plan: ${nutritionPlan.shabbat.name}\nMeals:\n${nutritionPlan.shabbat.meals.join('\n')}\n\nPre-Competition: ${nutritionPlan.preMeet.notes}`,
    data: { nutritionPlan },
    suggestedResponse: `Here's Michael's nutrition plan based on Michael Andrew's keto approach, adapted for kosher observance.`,
  };
}

/**
 * Handle RIVAL_COMPARE intent
 */
async function handleRivalCompare(intent: DetectedIntent): Promise<RouteResult> {
  const comparisons: Record<string, unknown>[] = [];
  
  // Compare to specified rivals or all if none specified
  const rivalsToCompare = intent.entities.rivals.length > 0
    ? intent.entities.rivals
    : Object.keys(RIVALS);
  
  for (const rivalName of rivalsToCompare) {
    const rivalId = RIVALS[rivalName as keyof typeof RIVALS];
    if (rivalId) {
      const comparison = await compareToRival(rivalId);
      comparisons.push({
        rivalName,
        rivalId,
        comparison,
      });
    }
  }
  
  let context = 'Rival Comparison Analysis:\n\n';
  for (const comp of comparisons) {
    context += `vs ${comp.rivalName} (SwimCloud: ${comp.rivalId}):\n`;
    for (const c of comp.comparison as { event: string; michaelTime: string; rivalTime: string; difference: string; michaelFaster: boolean }[]) {
      context += `  ${c.event}: Michael ${c.michaelTime} vs ${c.rivalTime} (${c.difference}) ${c.michaelFaster ? '✅' : '❌'}\n`;
    }
    context += '\n';
  }
  
  return {
    intent: 'RIVAL_COMPARE',
    context,
    data: { comparisons },
    suggestedResponse: context,
  };
}

/**
 * Handle TRAINING intent
 */
async function handleTraining(intent: DetectedIntent): Promise<RouteResult> {
  const trainingInfo = {
    weeklyYardage: '40,000-50,000 yards',
    practicesPerWeek: 9,
    drylandPerWeek: 3,
    schedule: {
      monday: 'AM: 6,000y sprint | PM: 5,000y threshold',
      tuesday: 'AM: 5,500y technique | PM: Dryland',
      wednesday: 'AM: 6,500y distance | PM: 5,000y IM',
      thursday: 'AM: 5,000y race pace | PM: Dryland',
      friday: 'AM: 4,000y easy (pre-Shabbat)',
      saturday: 'REST (Shabbat)',
      sunday: 'AM: 6,000y test set',
    },
    restrictions: 'No swimming from Friday sunset to Saturday havdalah',
  };
  
  return {
    intent: 'TRAINING',
    context: `Michael's Training Schedule:\n\nWeekly Yardage: ${trainingInfo.weeklyYardage}\nPractices/Week: ${trainingInfo.practicesPerWeek}\nDryland/Week: ${trainingInfo.drylandPerWeek}\n\nWeekly Schedule:\n${Object.entries(trainingInfo.schedule).map(([day, workout]) => `${day}: ${workout}`).join('\n')}\n\n⚠️ ${trainingInfo.restrictions}`,
    data: { trainingInfo },
    suggestedResponse: `Here's Michael's training schedule. Note: No swimming on Shabbat.`,
  };
}

/**
 * Handle REPORT_GEN intent
 */
async function handleReportGen(intent: DetectedIntent): Promise<RouteResult> {
  return {
    intent: 'REPORT_GEN',
    context: 'Report generation requested. This will create a 6-page DOCX recruiting report including:\n1. Athlete Profile\n2. Best Times & Progression\n3. Meet Schedule\n4. D1 School Matches\n5. Recruiting Timeline\n6. Contact Information',
    data: { reportType: 'recruiting' },
    suggestedResponse: 'I can generate a recruiting report for Michael. Would you like me to create the DOCX now?',
  };
}

/**
 * Handle GENERAL intent
 */
async function handleGeneral(intent: DetectedIntent): Promise<RouteResult> {
  return {
    intent: 'GENERAL',
    context: `Michael Shapira - D1 Swimming Recruit
SwimCloud ID: 3250085
Class of 2027 | 6'4" 215 lbs
Events: 50/100/200 Free, 100 Fly, 100 Back
Club: Satellite Beach Swim Team
Observance: Orthodox (Shabbat observant)`,
    data: {},
    suggestedResponse: undefined,
  };
}
