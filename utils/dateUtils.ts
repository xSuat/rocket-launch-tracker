import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';

export const formatLaunchDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy • HH:mm zzz');
  } catch (error) {
    return dateString;
  }
};

export const formatLaunchDateShort = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    return dateString;
  }
};

export const getTimeUntilLaunch = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (isPast(date)) {
      return 'Launched';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return '';
  }
};

export const getCountdown = (dateString: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
} => {
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isPast: true,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      isPast: false,
    };
  } catch (error) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
    };
  }
};

