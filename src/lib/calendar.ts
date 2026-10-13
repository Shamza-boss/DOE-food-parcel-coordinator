import type { Weekday } from "./types";

export interface Term {
  year: number;
  name: string;
  start: string;
  end: string;
}

export interface Holiday {
  date: string;
  name: string;
  kind: "public" | "school";
}

/**
 * Learner days from the 2026 DBE public-school calendar (Government Gazette,
 * Notice 5901). KwaZulu-Natal uses this national learner calendar.
 * 12–13 January and 10–11 December 2026 are educator days, so they are not feeding days.
 * 4 November 2026 was declared a public holiday for local government elections
 * after the school calendar was published, so it is excluded too.
 * 2027 dates follow the DBE summary published with that calendar. Parenthetical
 * dates are treated as educator days, matching the 2026 Western Cape circular.
 */
export const TERMS: Term[] = [
  { year: 2026, name: "Term 1", start: "2026-01-14", end: "2026-03-27" },
  { year: 2026, name: "Term 2", start: "2026-04-08", end: "2026-06-26" },
  { year: 2026, name: "Term 3", start: "2026-07-21", end: "2026-09-23" },
  { year: 2026, name: "Term 4", start: "2026-10-06", end: "2026-12-09" },
  { year: 2027, name: "Term 1", start: "2027-01-13", end: "2027-03-19" },
  { year: 2027, name: "Term 2", start: "2027-04-06", end: "2027-06-25" },
  { year: 2027, name: "Term 3", start: "2027-07-20", end: "2027-10-01" },
  { year: 2027, name: "Term 4", start: "2027-10-11", end: "2027-12-08" },
];

export const HOLIDAYS: Holiday[] = [
  { date: "2026-01-01", name: "New Year's Day", kind: "public" },
  { date: "2026-03-21", name: "Human Rights Day", kind: "public" },
  { date: "2026-04-03", name: "Good Friday", kind: "public" },
  { date: "2026-04-06", name: "Family Day", kind: "public" },
  { date: "2026-04-27", name: "Freedom Day", kind: "public" },
  { date: "2026-05-01", name: "Workers' Day", kind: "public" },
  { date: "2026-06-15", name: "Special school holiday", kind: "school" },
  { date: "2026-06-16", name: "Youth Day", kind: "public" },
  { date: "2026-08-09", name: "National Women's Day", kind: "public" },
  { date: "2026-08-10", name: "Women's Day observed", kind: "public" },
  { date: "2026-09-24", name: "Heritage Day", kind: "public" },
  { date: "2026-11-04", name: "Local government elections", kind: "public" },
  { date: "2026-12-16", name: "Day of Reconciliation", kind: "public" },
  { date: "2026-12-25", name: "Christmas Day", kind: "public" },
  { date: "2026-12-26", name: "Day of Goodwill", kind: "public" },
  { date: "2027-01-01", name: "New Year's Day", kind: "public" },
  { date: "2027-03-21", name: "Human Rights Day", kind: "public" },
  { date: "2027-03-22", name: "Human Rights Day observed", kind: "public" },
  { date: "2027-03-26", name: "Good Friday", kind: "public" },
  { date: "2027-03-29", name: "Family Day", kind: "public" },
  { date: "2027-04-26", name: "Special school holiday", kind: "school" },
  { date: "2027-04-27", name: "Freedom Day", kind: "public" },
  { date: "2027-05-01", name: "Workers' Day", kind: "public" },
  { date: "2027-06-16", name: "Youth Day", kind: "public" },
  { date: "2027-08-09", name: "National Women's Day", kind: "public" },
  { date: "2027-09-24", name: "Heritage Day", kind: "public" },
  { date: "2027-12-16", name: "Day of Reconciliation", kind: "public" },
  { date: "2027-12-25", name: "Christmas Day", kind: "public" },
  { date: "2027-12-26", name: "Day of Goodwill", kind: "public" },
  { date: "2027-12-27", name: "Day of Goodwill observed", kind: "public" },
];

export const WEEKDAY_ORDER: Weekday[] = ["mon", "tue", "wed", "thu", "fri"];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
};

const WEEKDAY_BY_UTC: Record<number, Weekday> = {
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
};

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function weekdayOf(iso: string): Weekday | null {
  return WEEKDAY_BY_UTC[parseISODate(iso).getUTCDay()] ?? null;
}

export function termOn(iso: string): Term | null {
  return TERMS.find((term) => iso >= term.start && iso <= term.end) ?? null;
}

export function holidayOn(iso: string): Holiday | null {
  return HOLIDAYS.find((holiday) => holiday.date === iso) ?? null;
}

export function isSchoolDay(iso: string): boolean {
  return weekdayOf(iso) !== null && termOn(iso) !== null && holidayOn(iso) === null;
}

export function monthDates(year: number, month: number): string[] {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dates: string[] = [];
  for (let day = 1; day <= last; day += 1) {
    dates.push(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return dates;
}

export function monthSchoolDays(year: number, month: number): string[] {
  return monthDates(year, month).filter(isSchoolDay);
}

export function emptyDayCounts(): Record<Weekday, number> {
  return { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 };
}

export function countWeekdays(dates: string[]): Record<Weekday, number> {
  const counts = emptyDayCounts();
  for (const iso of dates) {
    const key = weekdayOf(iso);
    if (key) counts[key] += 1;
  }
  return counts;
}

export function weekStart(iso: string): string {
  const date = parseISODate(iso);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return toISODate(date);
}

export type DayKind = "school" | "weekend" | "holiday" | "break";

export function dayKind(iso: string): { kind: DayKind; label?: string } {
  const holiday = holidayOn(iso);
  const weekday = weekdayOf(iso);
  if (!weekday) return { kind: "weekend" };
  if (holiday) return { kind: "holiday", label: holiday.name };
  if (termOn(iso)) return { kind: "school" };
  return { kind: "break" };
}

export function calendarYears(): number[] {
  return [...new Set(TERMS.map((term) => term.year))];
}
