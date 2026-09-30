import { getCalendars, getLocales } from 'expo-localization';

export type PrecisionKind = 'time' | 'day' | 'coarse';

export interface NetPrecision {
  id?: number;
  name?: string;
  abbrev?: string;
  description?: string;
}

export interface FormatPrefs {
  locale?: string;
  hour12?: boolean;
  timeZone?: string;
  now?: Date;
}

export function precisionKind(precision?: NetPrecision | null): PrecisionKind {
  const id = precision?.id;
  if (id === 0 || id === 1 || id === 2) return 'time';
  if (id === 3) return 'day';
  if (id != null && id >= 4 && id <= 7) return 'coarse';
  const name = `${precision?.name || ''} ${precision?.abbrev || ''}`.toLowerCase();
  if (/(second|minute|hour|\bsec\b|\bmin\b)/.test(name)) return 'time';
  if (/\bday\b/.test(name)) return 'day';
  if (/(month|quarter|half|year)/.test(name)) return 'coarse';
  return 'time';
}

export function deviceLocale(): string {
  return getLocales()[0]?.languageTag || 'en-US';
}

export function deviceHour12(): boolean | undefined {
  const calendar = getCalendars()[0];
  if (calendar && typeof calendar.uses24hourClock === 'boolean') {
    return !calendar.uses24hourClock;
  }
  return undefined;
}

function prefs(options?: FormatPrefs) {
  return {
    locale: options?.locale || deviceLocale(),
    hour12: options?.hour12 ?? deviceHour12(),
    timeZone: options?.timeZone,
    now: options?.now || new Date(),
  };
}

function parseInstant(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calendarDateParts(isoOrDay: string, timeZone?: string): { y: number; m: number; d: number } | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoOrDay);
  if (day) {
    return { y: Number(day[1]), m: Number(day[2]), d: Number(day[3]) };
  }
  const date = parseInstant(isoOrDay);
  if (!date) return null;
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(formatted);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

export function localDayKey(isoOrDay: string, timeZone?: string): string {
  const parts = calendarDateParts(isoOrDay, timeZone);
  if (!parts) return isoOrDay.slice(0, 10);
  const m = String(parts.m).padStart(2, '0');
  const d = String(parts.d).padStart(2, '0');
  return `${parts.y}-${m}-${d}`;
}

function monthYear(date: Date, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone }).format(date);
}

function dateLabel(date: Date, locale: string, timeZone?: string, weekday = true): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: weekday ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(date);
}

function timeLabel(date: Date, locale: string, hour12: boolean | undefined, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12,
    timeZone,
  }).format(date);
}

export function formatDateTime(
  iso: string,
  precision?: NetPrecision | null,
  options?: FormatPrefs
): string {
  const { locale, hour12, timeZone } = prefs(options);
  const kind = precisionKind(precision);
  const date = parseInstant(iso);
  if (!date) return 'Time TBD';
  if (kind === 'coarse') return `NET ${monthYear(date, locale, timeZone)}`;
  if (kind === 'day') return dateLabel(date, locale, timeZone);
  return `${dateLabel(date, locale, timeZone)} · ${timeLabel(date, locale, hour12, timeZone)}`;
}

export function formatTimeOnly(iso: string, options?: FormatPrefs): string {
  const { locale, hour12, timeZone } = prefs(options);
  const date = parseInstant(iso);
  if (!date) return '';
  return timeLabel(date, locale, hour12, timeZone);
}

export function formatRelative(iso: string, options?: FormatPrefs): string {
  const { locale, timeZone, now } = prefs(options);
  const date = parseInstant(iso);
  if (!date) return '';
  const target = calendarDateParts(iso, timeZone);
  const today = calendarDateParts(now.toISOString(), timeZone);
  if (target && today) {
    const targetUtc = Date.UTC(target.y, target.m - 1, target.d);
    const todayUtc = Date.UTC(today.y, today.m - 1, today.d);
    const dayDiff = Math.round((targetUtc - todayUtc) / 86400000);
    if (dayDiff === 0) {
      const minutes = Math.round((date.getTime() - now.getTime()) / 60000);
      if (Math.abs(minutes) < 60) {
        if (minutes === 0) return 'now';
        return formatRelativeUnit(minutes, 'minute', locale);
      }
      const hours = Math.round(minutes / 60);
      if (Math.abs(hours) < 24) return formatRelativeUnit(hours, 'hour', locale);
    }
    if (dayDiff === 1) return 'Tomorrow';
    if (dayDiff === -1) return 'Yesterday';
    if (Math.abs(dayDiff) < 60) return formatRelativeUnit(dayDiff, 'day', locale);
  }
  const minutes = Math.round((date.getTime() - now.getTime()) / 60000);
  const days = Math.round(minutes / 1440);
  return formatRelativeUnit(days, 'day', locale);
}

function formatRelativeUnit(
  value: number,
  unit: 'minute' | 'hour' | 'day',
  locale: string
): string {
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
  } catch {
    const abs = Math.abs(value);
    const noun = abs === 1 ? unit : `${unit}s`;
    return value < 0 ? `${abs} ${noun} ago` : `in ${abs} ${noun}`;
  }
}

export function formatDayHeading(isoOrDay: string, options?: FormatPrefs): string {
  const { locale, timeZone, now } = prefs(options);
  const target = calendarDateParts(isoOrDay, timeZone);
  const today = calendarDateParts(now.toISOString(), timeZone);
  if (target && today) {
    const dayDiff = Math.round(
      (Date.UTC(target.y, target.m - 1, target.d) - Date.UTC(today.y, today.m - 1, today.d)) / 86400000
    );
    if (dayDiff === 0) return 'Today';
    if (dayDiff === 1) return 'Tomorrow';
    if (dayDiff === -1) return 'Yesterday';
  }
  const date = /^\d{4}-\d{2}-\d{2}$/.test(isoOrDay)
    ? new Date(isoOrDay + 'T12:00:00Z')
    : parseInstant(isoOrDay);
  if (!date) return isoOrDay;
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: /^\d{4}-\d{2}-\d{2}$/.test(isoOrDay) ? 'UTC' : timeZone,
  }).format(date);
}

export function formatMonthHeading(year: number, monthIndex: number, locale?: string): string {
  const tag = locale || deviceLocale();
  return new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, monthIndex, 1))
  );
}

export function formatDuration(minutes: number): string {
  const abs = Math.abs(Math.round(minutes));
  if (abs % 1440 === 0) {
    const days = abs / 1440;
    return days === 1 ? '1 day' : `${days} days`;
  }
  if (abs % 60 === 0) {
    const hours = abs / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return abs === 1 ? '1 minute' : `${abs} minutes`;
}

export function formatUpdated(isoOrMs: string | number, options?: FormatPrefs): string {
  const { now } = prefs(options);
  const date = typeof isoOrMs === 'number' ? new Date(isoOrMs) : parseInstant(isoOrMs);
  if (!date) return '';
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${formatDuration(minutes)} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `Updated ${hours === 1 ? '1 hour' : `${hours} hours`} ago`;
  const days = Math.round(hours / 24);
  return `Updated ${days === 1 ? '1 day' : `${days} days`} ago`;
}

export function formatCountdownLabel(parts: { days: number; hours: number; minutes: number }): string {
  const chunks: string[] = [];
  if (parts.days > 0) chunks.push(`${parts.days} ${parts.days === 1 ? 'day' : 'days'}`);
  chunks.push(`${parts.hours} ${parts.hours === 1 ? 'hour' : 'hours'}`);
  chunks.push(`${parts.minutes} ${parts.minutes === 1 ? 'minute' : 'minutes'}`);
  return chunks.join(', ');
}

export function isHourConfirmed(precision?: NetPrecision | null): boolean {
  return precisionKind(precision) === 'time';
}

export function getCountdown(dateString: string, now = new Date()): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
} {
  const date = parseInstant(dateString);
  if (!date) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    isPast: false,
  };
}

export const formatLaunchDate = (dateString: string): string => formatDateTime(dateString);
export const formatLaunchDateShort = (dateString: string): string => {
  const date = parseInstant(dateString);
  if (!date) return dateString;
  return new Intl.DateTimeFormat(deviceLocale(), { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};
export const getTimeUntilLaunch = (dateString: string): string => formatRelative(dateString);
