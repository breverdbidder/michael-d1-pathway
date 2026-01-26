/**
 * Michael D1 Pathway - Supabase Client
 * Connected to mocerqjnksmhcjzxrewo.supabase.co
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mocerqjnksmhcjzxrewo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for tables
export interface D1School {
  id: number;
  school_name: string;
  conference: string;
  state: string;
  division: string;
  cut_times_scy: Record<string, string>;
  cut_times_lcm: Record<string, string>;
  engineering_program: boolean;
  chabad_contact: string | null;
  roster_size: number;
  scholarship_count: number;
}

export interface MeetSchedule {
  id: number;
  meet_name: string;
  start_date: string;
  end_date: string;
  location: string;
  pool_type: 'SCY' | 'LCM';
  qualifying_meet: boolean;
  shabbat_conflict: boolean;
  notes: string | null;
}

export interface MelachaDate {
  id: number;
  date: string;
  type: 'Shabbat' | 'Yom Tov';
  name: string;
  candle_lighting: string;
  havdalah: string;
}

export interface KnowledgeBase {
  id: number;
  category: string;
  key: string;
  value: string;
  metadata: Record<string, unknown>;
}

/**
 * Query knowledge base
 */
export async function queryKnowledgeBase(category: string, key?: string) {
  let query = supabase
    .from('claude_knowledge_base')
    .select('*')
    .eq('category', category);
  
  if (key) {
    query = query.eq('key', key);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Knowledge base query error:', error);
    return [];
  }
  
  return data as KnowledgeBase[];
}

/**
 * Get D1 target schools
 */
export async function getD1Schools(filters?: {
  hasEngineering?: boolean;
  state?: string;
  conference?: string;
}) {
  let query = supabase.from('d1_target_schools').select('*');
  
  if (filters?.hasEngineering) {
    query = query.eq('engineering_program', true);
  }
  if (filters?.state) {
    query = query.eq('state', filters.state);
  }
  if (filters?.conference) {
    query = query.eq('conference', filters.conference);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('D1 schools query error:', error);
    return [];
  }
  
  return data as D1School[];
}

/**
 * Get Michael's meet schedule
 */
export async function getMeetSchedule(year?: number) {
  let query = supabase
    .from('michael_meet_schedule')
    .select('*')
    .order('start_date', { ascending: true });
  
  if (year) {
    query = query
      .gte('start_date', `${year}-01-01`)
      .lte('start_date', `${year}-12-31`);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Meet schedule query error:', error);
    return [];
  }
  
  return data as MeetSchedule[];
}

/**
 * Get Melacha (Shabbat/Yom Tov) dates
 */
export async function getMelachaDates(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('melacha_prohibited_dates')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  
  if (error) {
    console.error('Melacha dates query error:', error);
    return [];
  }
  
  return data as MelachaDate[];
}

/**
 * Check if a date range conflicts with Shabbat/Yom Tov
 */
export async function checkShabbatConflict(startDate: string, endDate: string) {
  const melachaDates = await getMelachaDates(startDate, endDate);
  
  if (melachaDates.length === 0) {
    return {
      hasConflict: false,
      conflicts: [],
      recommendation: 'No Shabbat or Yom Tov conflicts detected.',
    };
  }
  
  const conflicts = melachaDates.map((d) => ({
    date: d.date,
    type: d.type,
    name: d.name,
    candleLighting: d.candle_lighting,
    havdalah: d.havdalah,
  }));
  
  return {
    hasConflict: true,
    conflicts,
    recommendation: `${conflicts.length} conflict(s) detected. Review scheduling carefully.`,
  };
}

/**
 * Get schools matching Michael's times
 */
export async function getMatchingSchools(michaelTimes: Record<string, string>) {
  const schools = await getD1Schools();
  
  return schools.map((school) => {
    // Simple matching logic - compare times
    let matchScore = 0;
    let totalEvents = 0;
    
    for (const [event, time] of Object.entries(michaelTimes)) {
      const cutTime = school.cut_times_scy[event];
      if (cutTime) {
        totalEvents++;
        // Compare times (simplified - assumes format "MM:SS.ss" or "SS.ss")
        const michaelSeconds = timeToSeconds(time);
        const cutSeconds = timeToSeconds(cutTime);
        
        if (michaelSeconds <= cutSeconds) {
          matchScore++;
        }
      }
    }
    
    const matchPercentage = totalEvents > 0 ? (matchScore / totalEvents) * 100 : 0;
    
    return {
      ...school,
      matchPercentage,
      tier: matchPercentage >= 75 ? 'PRIMARY' : matchPercentage >= 50 ? 'SAFETY' : 'REACH',
    };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage);
}

/**
 * Convert time string to seconds
 */
function timeToSeconds(time: string): number {
  const parts = time.split(':');
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(time);
}
