import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  const focused = useIsFocused();

  useEffect(() => {
    if (!focused) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => setNow(new Date()), intervalMs);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(new Date());
        start();
      } else {
        stop();
      }
    });

    if (AppState.currentState === 'active') start();
    return () => {
      stop();
      sub.remove();
    };
  }, [focused, intervalMs]);

  return now;
}
