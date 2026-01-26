'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  AlertTriangle,
  Star,
  Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getHebrewDate, 
  getShabbatTimes, 
  getMelachaProhibitedDates,
  checkMeetShabbatConflict,
  type HebrewDate,
  type ShabbatTime
} from '@/lib/hebrew-calendar';

// Meet data
interface SwimMeet {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  location: string;
  poolType: 'SCY' | 'LCM';
  priority: 'critical' | 'primary' | 'secondary';
  qualifying: boolean;
  notes?: string;
}

// 2026 Meet Schedule for Michael
const MICHAEL_MEETS_2026: SwimMeet[] = [
  {
    id: 'sectionals-feb',
    name: 'Sectionals',
    startDate: new Date(2026, 1, 12), // Feb 12
    endDate: new Date(2026, 1, 15),
    location: 'Orlando, FL',
    poolType: 'SCY',
    priority: 'primary',
    qualifying: true,
  },
  {
    id: 'sr-champs-mar',
    name: 'Senior Champs',
    startDate: new Date(2026, 2, 19), // Mar 19
    endDate: new Date(2026, 2, 22),
    location: 'Gainesville, FL',
    poolType: 'SCY',
    priority: 'primary',
    qualifying: true,
  },
  {
    id: 'sectionals-jun',
    name: 'Sectionals',
    startDate: new Date(2026, 5, 4), // Jun 4
    endDate: new Date(2026, 5, 7),
    location: 'Jacksonville, FL',
    poolType: 'LCM',
    priority: 'primary',
    qualifying: true,
  },
  {
    id: 'sr-champs-jul',
    name: 'Senior Champs',
    startDate: new Date(2026, 6, 16), // Jul 16
    endDate: new Date(2026, 6, 19),
    location: 'Sarasota, FL',
    poolType: 'LCM',
    priority: 'primary',
    qualifying: true,
  },
  {
    id: 'futures',
    name: 'USA Futures',
    startDate: new Date(2026, 6, 29), // Jul 29
    endDate: new Date(2026, 7, 1), // Aug 1
    location: 'Austin, TX',
    poolType: 'LCM',
    priority: 'critical',
    qualifying: true,
    notes: 'PRIMARY TARGET - Must qualify!',
  },
  {
    id: 'winter-juniors',
    name: 'Winter Juniors',
    startDate: new Date(2026, 11, 9), // Dec 9
    endDate: new Date(2026, 11, 12),
    location: 'Greensboro, NC',
    poolType: 'SCY',
    priority: 'critical',
    qualifying: true,
    notes: 'CRITICAL - D1 Recruiting visibility',
  },
];

interface ProhibitedDate {
  date: string;
  type: 'Shabbat' | 'Yom Tov';
  name: string;
  startTime: string;
  endTime: string;
}

export default function SwimMeetCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [hebrewDate, setHebrewDate] = useState<HebrewDate | null>(null);
  const [prohibitedDates, setProhibitedDates] = useState<ProhibitedDate[]>([]);
  const [shabbatTimes, setShabbatTimes] = useState<ShabbatTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Hebrew calendar data for the current month
  useEffect(() => {
    async function loadCalendarData() {
      setIsLoading(true);
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      try {
        const [prohibited, shabbat] = await Promise.all([
          getMelachaProhibitedDates(startOfMonth, endOfMonth),
          getShabbatTimes(startOfMonth, endOfMonth),
        ]);
        setProhibitedDates(prohibited);
        setShabbatTimes(shabbat);
      } catch (error) {
        console.error('Failed to load calendar data:', error);
      }
      setIsLoading(false);
    }
    
    loadCalendarData();
  }, [currentMonth]);

  // Load Hebrew date when selected date changes
  useEffect(() => {
    async function loadHebrewDate() {
      if (selectedDate) {
        const hd = await getHebrewDate(selectedDate);
        setHebrewDate(hd);
      }
    }
    loadHebrewDate();
  }, [selectedDate]);

  // Get meets for the current month
  const meetsThisMonth = useMemo(() => {
    return MICHAEL_MEETS_2026.filter((meet) => {
      const meetMonth = meet.startDate.getMonth();
      const meetYear = meet.startDate.getFullYear();
      return meetMonth === currentMonth.getMonth() && meetYear === currentMonth.getFullYear();
    });
  }, [currentMonth]);

  // Check if a date has a meet
  const getMeetForDate = (date: Date): SwimMeet | undefined => {
    return MICHAEL_MEETS_2026.find((meet) => {
      return date >= meet.startDate && date <= meet.endDate;
    });
  };

  // Check if a date is prohibited (Shabbat/Yom Tov)
  const isProhibitedDate = (date: Date): ProhibitedDate | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return prohibitedDates.find((p) => p.date === dateStr);
  };

  // Get conflict status for a meet
  const getMeetConflictStatus = (meet: SwimMeet) => {
    return checkMeetShabbatConflict(meet.startDate, meet.endDate);
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Custom day renderer
  const renderDay = (date: Date) => {
    const meet = getMeetForDate(date);
    const prohibited = isProhibitedDate(date);
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    const isToday = new Date().toDateString() === date.toDateString();

    return (
      <div
        className={cn(
          'relative w-full h-full min-h-[60px] p-1 border border-gray-100 cursor-pointer transition-colors',
          isSelected && 'ring-2 ring-blue-500',
          isToday && 'bg-blue-50',
          prohibited && 'bg-amber-50',
          meet?.priority === 'critical' && 'bg-red-50',
          meet?.priority === 'primary' && !meet?.priority && 'bg-green-50'
        )}
        onClick={() => setSelectedDate(date)}
      >
        <div className="flex justify-between items-start">
          <span className={cn(
            'text-sm font-medium',
            isToday && 'text-blue-600',
            prohibited && 'text-amber-700'
          )}>
            {date.getDate()}
          </span>
          {prohibited && (
            <span className="text-xs text-amber-600">🕎</span>
          )}
        </div>
        
        {meet && (
          <div className={cn(
            'mt-1 text-xs px-1 py-0.5 rounded truncate',
            meet.priority === 'critical' && 'bg-red-200 text-red-800',
            meet.priority === 'primary' && 'bg-green-200 text-green-800',
            meet.priority === 'secondary' && 'bg-gray-200 text-gray-800'
          )}>
            {meet.name}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Michael&apos;s Swim Calendar</h1>
            <p className="text-sm text-gray-500">2026 Meet Schedule with Shabbat/Yom Tov</p>
          </div>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[150px] text-center">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div 
                key={day} 
                className={cn(
                  'text-center text-sm font-medium py-2',
                  day === 'Sat' && 'text-amber-600'
                )}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {(() => {
              const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
              const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
              const days: React.ReactNode[] = [];
              
              // Add empty cells for days before first of month
              for (let i = 0; i < firstDay.getDay(); i++) {
                days.push(<div key={`empty-${i}`} className="min-h-[60px] bg-gray-50" />);
              }
              
              // Add days of month
              for (let d = 1; d <= lastDay.getDate(); d++) {
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
                days.push(
                  <div key={d}>
                    {renderDay(date)}
                  </div>
                );
              }
              
              return days;
            })()}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Date Info */}
          {selectedDate && (
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              {hebrewDate && (
                <p className="text-sm text-gray-600 mb-3">
                  🕎 {hebrewDate.hebrew}
                </p>
              )}
              
              {/* Meet info if present */}
              {getMeetForDate(selectedDate) && (
                <div className={cn(
                  'p-3 rounded-lg mb-3',
                  getMeetForDate(selectedDate)?.priority === 'critical' ? 'bg-red-50' : 'bg-green-50'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <Waves className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{getMeetForDate(selectedDate)?.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{getMeetForDate(selectedDate)?.location}</p>
                  <p className="text-sm text-gray-600">{getMeetForDate(selectedDate)?.poolType}</p>
                  {getMeetForDate(selectedDate)?.notes && (
                    <p className="text-sm text-amber-600 mt-1">{getMeetForDate(selectedDate)?.notes}</p>
                  )}
                </div>
              )}
              
              {/* Shabbat warning if applicable */}
              {isProhibitedDate(selectedDate) && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">{isProhibitedDate(selectedDate)?.type}</span>
                  </div>
                  <p className="text-sm text-amber-600 mt-1">
                    {isProhibitedDate(selectedDate)?.name}
                  </p>
                  <p className="text-xs text-amber-500 mt-1">
                    No swimming from candle lighting until havdalah
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Meets */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              2026 Key Meets
            </h3>
            <div className="space-y-3">
              {MICHAEL_MEETS_2026.map((meet) => {
                const conflict = getMeetConflictStatus(meet);
                return (
                  <div 
                    key={meet.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      meet.priority === 'critical' && 'border-red-200 bg-red-50',
                      meet.priority === 'primary' && 'border-green-200 bg-green-50',
                      meet.priority === 'secondary' && 'border-gray-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{meet.name}</span>
                      {meet.priority === 'critical' && (
                        <Star className="w-4 h-4 text-red-500 fill-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {meet.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                      {meet.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500">{meet.location} • {meet.poolType}</p>
                    {conflict.hasConflict && (
                      <div className="flex items-center gap-1 mt-1 text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-xs">Shabbat conflict</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-200 rounded" />
                <span>Critical Meet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 rounded" />
                <span>Primary Meet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-100 rounded" />
                <span>Shabbat/Yom Tov 🕎</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Scheduling Conflict</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
