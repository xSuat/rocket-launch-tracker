import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius, space, type } from '../../constants/theme';

interface ToastRequest {
  message: string;
  undo?: () => void;
}

interface ToastContextValue {
  showToast: (message: string, undo?: () => void) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastRequest | null>(null);
  const insets = useSafeAreaInsets();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, undo?: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, undo });
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.toast, { bottom: insets.bottom + 64 }]}
        >
          <Text style={styles.message}>{toast.message}</Text>
          {toast.undo ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Undo"
              onPress={() => {
                toast.undo?.();
                setToast(null);
              }}
              style={styles.undo}
            >
              <Text style={styles.undoLabel}>Undo</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space.s20,
    right: space.s20,
    minHeight: 44,
    backgroundColor: color.toastBg,
    borderRadius: radius.control,
    paddingHorizontal: space.s16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s12,
    zIndex: 20,
  },
  message: {
    ...type.body,
    color: color.toastText,
    flex: 1,
  },
  undo: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.s8,
  },
  undoLabel: {
    ...type.calloutStrong,
    color: color.toastText,
  },
});
