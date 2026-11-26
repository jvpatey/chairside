import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { AnalyticsEvents } from '@/lib/analytics/events';
import { captureAnalyticsEvent } from '@/lib/analytics/posthog';
import { CLINIC_PROFILE_LOCATIONS } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

export const ADD_CLINIC_NUDGE_DISMISS_KEY = 'chairside.clinic.addClinicNudgeDismissed';

type AddClinicNudgeProps = {
  /** Owner with a complete profile and fewer than two active clinics. */
  visible: boolean;
};

/**
 * Dashboard nudge for single-clinic owners. Dismissal is remembered on device
 * so it does not reappear on every visit.
 */
export function AddClinicNudge({ visible }: AddClinicNudgeProps) {
  const { colors } = useTheme();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const value = await AsyncStorage.getItem(ADD_CLINIC_NUDGE_DISMISS_KEY);
        if (!cancelled) setDismissed(value === 'true');
      } catch {
        if (!cancelled) setDismissed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    actions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    primary: {
      ...typography.subtitle,
      fontWeight: '700' as const,
      color: colors.primary,
    },
    secondary: {
      ...typography.subtitle,
      color: colors.labelSecondary,
    },
  }));

  if (!visible || dismissed !== false) return null;

  const handleDismiss = () => {
    setDismissed(true);
    captureAnalyticsEvent(AnalyticsEvents.clinicAddClinicNudgeDismissed);
    void AsyncStorage.setItem(ADD_CLINIC_NUDGE_DISMISS_KEY, 'true');
  };

  const handleAdd = () => {
    captureAnalyticsEvent(AnalyticsEvents.clinicAddClinicNudgeTapped);
    router.push(CLINIC_PROFILE_LOCATIONS);
  };

  return (
    <CardInfoPanel variant="info" icon="business-outline" title="Have more locations?">
      <CardInfoPanelText>
        Add another clinic to manage every site from one account.
      </CardInfoPanelText>
      <View style={styles.actions}>
        <Pressable onPress={handleAdd} accessibilityRole="button">
          <Text style={styles.primary}>Add a clinic</Text>
        </Pressable>
        <Pressable onPress={handleDismiss} accessibilityRole="button">
          <Text style={styles.secondary}>Not now</Text>
        </Pressable>
      </View>
    </CardInfoPanel>
  );
}
