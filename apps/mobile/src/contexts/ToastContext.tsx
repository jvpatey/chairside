import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontSemibold, useThemedStyles } from '@/theme';

type ToastVariant = 'default' | 'success' | 'destructive';

type ToastPayload = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const nextId = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToastTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'default') => {
      clearToastTimeout();
      nextId.current += 1;
      setToast({ id: nextId.current, message, variant });
      timeoutRef.current = setTimeout(() => {
        setToast(null);
      }, 3200);
    },
    [clearToastTimeout],
  );

  useEffect(() => clearToastTimeout, [clearToastTimeout]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  const styles = useThemedStyles(({ colors, spacing, radii, elevation, isDark }) => ({
    host: {
      position: 'absolute',
      top: insets.top + spacing.sm,
      left: spacing.lg,
      right: spacing.lg,
      zIndex: 9999,
      pointerEvents: 'box-none' as const,
    },
    banner: {
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
      borderWidth: Platform.OS === 'web' ? 1 : 0,
      borderColor: colors.separator,
      ...elevation('floating'),
    },
    bannerSuccess: {
      borderLeftWidth: 4,
      borderLeftColor: colors.success,
    },
    bannerDestructive: {
      borderLeftWidth: 4,
      borderLeftColor: colors.destructive,
    },
    bannerDefault: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
  }));

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.host} pointerEvents="box-none">
        {toast ? (
          <Animated.View
            key={toast.id}
            entering={FadeInDown.duration(220)}
            exiting={FadeOutUp.duration(180)}>
            <Pressable
              accessibilityRole="alert"
              onPress={() => setToast(null)}
              style={[
                styles.banner,
                toast.variant === 'success'
                  ? styles.bannerSuccess
                  : toast.variant === 'destructive'
                    ? styles.bannerDestructive
                    : styles.bannerDefault,
              ]}>
              <Text style={styles.message}>{toast.message}</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}
