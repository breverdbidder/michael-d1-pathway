/**
 * Hebrew Calendar Integration using Hebcal API
 * Provides Shabbat times, holiday dates, and Hebrew date conversions
 */

export interface HebrewDate {
  hebrew: string;
  hebrewYear: number;
  hebrewMonth: string;
  hebrewDay: number;
}

export interface ShabbatTime {
  date: string;
  candleLighting: string;
  havdalah: string;
  parsha?: string;
}

export interface JewishHoliday {
  date: string;
  name: string;
  hebrewName: string;
  category: 'major' | 'minor' | 'fast' | 'modern';
  yomTov: boolean; // Work prohibited
  candleLighting?: string;
  havdalah?: string;
}

// Satellite Beach, FL coordinates
const LOCATION = {
  latitude: 28.1761,
  longitude: -80.5900,
  tzid: 'America/New_York',
  city: 'Satellite Beach',
};

/**
 * Convert Gregorian date to Hebrew date using Hebcal API
 */
export async function getHebrewDate(date: Date): Promise<HebrewDate> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  try {
    const response = await fetch(
      `https://www.hebcal.com/converter?cfg=json&gy=${year}&gm=${month}&gd=${day}&g2h=1`
    );
    const data = await response.json();
    
    return {
      hebrew: data.hebrew,
      hebrewYear: data.hy,
      hebrewMonth: data.hm,
      hebrewDay: data.hd,
    };
  } catch (error) {
    console.error('Hebrew date conversion error:', error);
    return {
      hebrew: '',
      hebrewYear: 0,
      hebrewMonth: '',
      hebrewDay: 0,
    };
  }
}

/**
 * Get Shabbat times for a specific date range
 */
export async function getShabbatTimes(
  startDate: Date,
  endDate: Date
): Promise<ShabbatTime[]> {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  
  try {
    const response = await fetch(
      `https://www.hebcal.com/shabbat?cfg=json&` +
      `geonameid=4174402&` + // Satellite Beach area
      `start=${start}&end=${end}&` +
      `M=on&b=18` // 18 minutes before sunset for candle lighting
    );
    const data = await response.json();
    
    const shabbatTimes: ShabbatTime[] = [];
    let currentShabbat: Partial<ShabbatTime> = {};
    
    for (const item of data.items || []) {
      if (item.category === 'candles') {
        currentShabbat = {
          date: item.date.split('T')[0],
          candleLighting: item.date,
        };
      } else if (item.category === 'havdalah') {
        currentShabbat.havdalah = item.date;
        if (currentShabbat.date) {
          shabbatTimes.push(currentShabbat as ShabbatTime);
        }
        currentShabbat = {};
      } else if (item.category === 'parashat') {
        currentShabbat.parsha = item.title;
      }
    }
    
    return shabbatTimes;
  } catch (error) {
    console.error('Shabbat times fetch error:', error);
    return [];
  }
}

/**
 * Get Jewish holidays for a year
 */
export async function getJewishHolidays(year: number): Promise<JewishHoliday[]> {
  try {
    const response = await fetch(
      `https://www.hebcal.com/hebcal?v=1&cfg=json&` +
      `year=${year}&` +
      `maj=on&min=on&mod=on&` + // major, minor, modern holidays
      `nx=on&` + // Rosh Chodesh
      `ss=on&` // Special Shabbatot
    );
    const data = await response.json();
    
    return (data.items || [])
      .filter((item: { category: string }) => 
        ['holiday', 'roshchodesh'].includes(item.category)
      )
      .map((item: { date: string; title: string; hebrew: string; subcat: string; yomtov: boolean }) => ({
        date: item.date.split('T')[0],
        name: item.title,
        hebrewName: item.hebrew || item.title,
        category: item.subcat || 'minor',
        yomTov: item.yomtov || false,
      }));
  } catch (error) {
    console.error('Jewish holidays fetch error:', error);
    return [];
  }
}

/**
 * Get all melacha-prohibited dates (Shabbat + Yom Tov) for a date range
 */
export async function getMelachaProhibitedDates(
  startDate: Date,
  endDate: Date
): Promise<{
  date: string;
  type: 'Shabbat' | 'Yom Tov';
  name: string;
  startTime: string;
  endTime: string;
}[]> {
  const results: {
    date: string;
    type: 'Shabbat' | 'Yom Tov';
    name: string;
    startTime: string;
    endTime: string;
  }[] = [];
  
  // Get Shabbat times
  const shabbatTimes = await getShabbatTimes(startDate, endDate);
  for (const shabbat of shabbatTimes) {
    results.push({
      date: shabbat.date,
      type: 'Shabbat',
      name: shabbat.parsha || 'Shabbat',
      startTime: shabbat.candleLighting,
      endTime: shabbat.havdalah,
    });
  }
  
  // Get Yom Tov dates
  const year = startDate.getFullYear();
  const holidays = await getJewishHolidays(year);
  const yomTovHolidays = holidays.filter((h) => h.yomTov);
  
  for (const holiday of yomTovHolidays) {
    const holidayDate = new Date(holiday.date);
    if (holidayDate >= startDate && holidayDate <= endDate) {
      results.push({
        date: holiday.date,
        type: 'Yom Tov',
        name: holiday.name,
        startTime: '', // Would need additional API call for exact times
        endTime: '',
      });
    }
  }
  
  return results.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Check if a specific date falls on Shabbat or Yom Tov
 */
export function isShabbat(date: Date): boolean {
  return date.getDay() === 6; // Saturday
}

/**
 * Check if a meet date conflicts with Shabbat
 * Returns true if any day of the meet falls on Friday evening through Saturday night
 */
export function checkMeetShabbatConflict(
  meetStartDate: Date,
  meetEndDate: Date
): { hasConflict: boolean; conflictDates: Date[] } {
  const conflictDates: Date[] = [];
  const current = new Date(meetStartDate);
  
  while (current <= meetEndDate) {
    // Check if it's Friday (potential Friday evening session)
    // or Saturday (Shabbat day)
    if (current.getDay() === 5 || current.getDay() === 6) {
      conflictDates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return {
    hasConflict: conflictDates.length > 0,
    conflictDates,
  };
}

/**
 * Format Hebrew date for display
 */
export function formatHebrewDate(hebrewDate: HebrewDate): string {
  if (!hebrewDate.hebrew) return '';
  return `${hebrewDate.hebrewDay} ${hebrewDate.hebrewMonth} ${hebrewDate.hebrewYear}`;
}

/**
 * Get the next Shabbat from a given date
 */
export function getNextShabbat(fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);
  const daysUntilSaturday = (6 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilSaturday);
  return date;
}
