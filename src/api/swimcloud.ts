/**
 * Michael D1 Pathway - SwimCloud API Integration
 * Michael's SwimCloud ID: 3250085
 * Rivals: Soto (2928537), Gordon (1733035)
 */

export const MICHAEL_SWIMCLOUD_ID = '3250085';
export const RIVALS = {
  Soto: '2928537',
  Gordon: '1733035',
};

export interface SwimTime {
  event: string;
  time: string;
  date: string;
  meet: string;
  course: 'SCY' | 'LCM';
  place?: number;
}

export interface AthleteProfile {
  id: string;
  name: string;
  age: number;
  club: string;
  times: SwimTime[];
}

/**
 * Fetch athlete times from SwimCloud
 * Note: SwimCloud doesn't have a public API, so we use scraped/cached data
 * In production, this would connect to a scraping service or cached database
 */
export async function fetchAthleteTimes(athleteId: string): Promise<SwimTime[]> {
  // Michael's current best times (manually maintained until API available)
  if (athleteId === MICHAEL_SWIMCLOUD_ID) {
    return [
      { event: '50 Free', time: '21.89', date: '2025-12-15', meet: 'FL Senior Champs', course: 'SCY' },
      { event: '100 Free', time: '47.52', date: '2025-12-15', meet: 'FL Senior Champs', course: 'SCY' },
      { event: '200 Free', time: '1:44.21', date: '2025-11-10', meet: 'Sectionals', course: 'SCY' },
      { event: '100 Fly', time: '52.34', date: '2025-12-15', meet: 'FL Senior Champs', course: 'SCY' },
      { event: '100 Back', time: '53.87', date: '2025-11-10', meet: 'Sectionals', course: 'SCY' },
      // LCM times
      { event: '50 Free', time: '24.52', date: '2025-07-20', meet: 'Futures', course: 'LCM' },
      { event: '100 Free', time: '53.41', date: '2025-07-20', meet: 'Futures', course: 'LCM' },
    ];
  }
  
  // Placeholder for other athletes
  return [];
}

/**
 * Get best times for an athlete
 */
export async function getBestTimes(athleteId: string, course?: 'SCY' | 'LCM'): Promise<Record<string, SwimTime>> {
  const times = await fetchAthleteTimes(athleteId);
  const bestTimes: Record<string, SwimTime> = {};
  
  for (const time of times) {
    if (course && time.course !== course) continue;
    
    const key = `${time.event}_${time.course}`;
    if (!bestTimes[key] || timeToSeconds(time.time) < timeToSeconds(bestTimes[key].time)) {
      bestTimes[key] = time;
    }
  }
  
  return bestTimes;
}

/**
 * Compare Michael's times to a rival
 */
export async function compareToRival(rivalId: string): Promise<{
  event: string;
  michaelTime: string;
  rivalTime: string;
  difference: string;
  michaelFaster: boolean;
}[]> {
  const michaelTimes = await getBestTimes(MICHAEL_SWIMCLOUD_ID, 'SCY');
  const rivalTimes = await getBestTimes(rivalId, 'SCY');
  
  const comparison: {
    event: string;
    michaelTime: string;
    rivalTime: string;
    difference: string;
    michaelFaster: boolean;
  }[] = [];
  
  for (const [key, michaelTime] of Object.entries(michaelTimes)) {
    const rivalTime = rivalTimes[key];
    if (rivalTime) {
      const michaelSeconds = timeToSeconds(michaelTime.time);
      const rivalSeconds = timeToSeconds(rivalTime.time);
      const diff = rivalSeconds - michaelSeconds;
      
      comparison.push({
        event: michaelTime.event,
        michaelTime: michaelTime.time,
        rivalTime: rivalTime.time,
        difference: diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2),
        michaelFaster: diff > 0,
      });
    }
  }
  
  return comparison;
}

/**
 * Get qualifying standards for major meets
 */
export function getQualifyingStandards() {
  return {
    futures_2026: {
      '50 Free': { SCY: '21.49', LCM: '24.19' },
      '100 Free': { SCY: '46.99', LCM: '52.89' },
      '200 Free': { SCY: '1:42.99', LCM: '1:55.49' },
      '100 Fly': { SCY: '51.49', LCM: '57.89' },
      '100 Back': { SCY: '52.49', LCM: '59.29' },
    },
    sectionals_2026: {
      '50 Free': { SCY: '22.29', LCM: '25.09' },
      '100 Free': { SCY: '48.49', LCM: '54.69' },
      '200 Free': { SCY: '1:46.49', LCM: '1:59.49' },
      '100 Fly': { SCY: '53.49', LCM: '60.29' },
      '100 Back': { SCY: '54.49', LCM: '61.49' },
    },
  };
}

/**
 * Check if Michael qualifies for a meet/event
 */
export async function checkQualification(meetName: string, event: string, course: 'SCY' | 'LCM'): Promise<{
  qualifies: boolean;
  michaelTime: string;
  cutTime: string;
  difference: string;
}> {
  const standards = getQualifyingStandards();
  const meetKey = meetName.toLowerCase().replace(' ', '_') as keyof typeof standards;
  const meetStandards = standards[meetKey];
  
  if (!meetStandards) {
    return { qualifies: false, michaelTime: 'N/A', cutTime: 'N/A', difference: 'Meet not found' };
  }
  
  const eventStandards = meetStandards[event as keyof typeof meetStandards];
  if (!eventStandards) {
    return { qualifies: false, michaelTime: 'N/A', cutTime: 'N/A', difference: 'Event not found' };
  }
  
  const cutTime = eventStandards[course];
  const michaelBestTimes = await getBestTimes(MICHAEL_SWIMCLOUD_ID, course);
  const key = `${event}_${course}`;
  const michaelTime = michaelBestTimes[key];
  
  if (!michaelTime) {
    return { qualifies: false, michaelTime: 'No time', cutTime, difference: 'No time recorded' };
  }
  
  const michaelSeconds = timeToSeconds(michaelTime.time);
  const cutSeconds = timeToSeconds(cutTime);
  const diff = michaelSeconds - cutSeconds;
  
  return {
    qualifies: diff <= 0,
    michaelTime: michaelTime.time,
    cutTime,
    difference: diff > 0 ? `+${diff.toFixed(2)}s away` : `${Math.abs(diff).toFixed(2)}s under!`,
  };
}

/**
 * Convert SCY time to estimated LCM time
 */
export function scyToLcmEstimate(scyTime: string): string {
  const seconds = timeToSeconds(scyTime);
  // Rough conversion: LCM is typically 10-12% slower than SCY
  const lcmSeconds = seconds * 1.11;
  return secondsToTime(lcmSeconds);
}

/**
 * Helper: Convert time string to seconds
 */
function timeToSeconds(time: string): number {
  const parts = time.split(':');
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(time);
}

/**
 * Helper: Convert seconds to time string
 */
function secondsToTime(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  }
  return seconds.toFixed(2);
}
