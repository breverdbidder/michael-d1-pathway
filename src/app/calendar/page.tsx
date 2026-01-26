import SwimMeetCalendar from '@/components/SwimMeetCalendar';

export const metadata = {
  title: "Michael's Swim Calendar | D1 Pathway",
  description: "2026 swim meet schedule with Shabbat/Yom Tov conflict detection",
};

export default function CalendarPage() {
  return <SwimMeetCalendar />;
}
