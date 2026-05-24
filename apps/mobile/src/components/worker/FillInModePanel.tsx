import {
  FILL_IN_NOTIFICATION_MODE_OPTIONS,
  type FillInNotificationMode,
} from '@chairside/config';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';

import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useTheme, useThemedStyles } from '@/theme';

type FillInModePanelProps = {
  showNotificationOptions?: boolean;
};

export function FillInModePanel({ showNotificationOptions = true }: FillInModePanelProps) {
  const { colors } = useTheme();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [shortNoticeAvailable, setShortNoticeAvailable] = useState(false);
  const [notificationMode, setNotificationMode] = useState<FillInNotificationMode>('off');
  const [isSaving, setIsSaving] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: { gap: spacing.md },
    header: { gap: spacing.xs },
    title: { ...typography.body, fontWeight: '700', fontSize: 17 },
    subtitle: typography.subtitle,
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.md,
    },
    toggleText: { flex: 1, gap: 2 },
    toggleTitle: { ...typography.body, fontWeight: '600', color: colors.labelPrimary },
    toggleHint: { fontSize: 13, color: colors.labelSecondary },
    modeOption: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      backgroundColor: colors.surface,
    },
    modeOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    modeLabel: { ...typography.body, fontWeight: '600' },
    modeHint: { ...typography.subtitle, fontSize: 13, marginTop: spacing.xs },
  }));

  useEffect(() => {
    if (!workerProfile) return;
    setShortNoticeAvailable(workerProfile.short_notice_available ?? false);
    setNotificationMode(
      (workerProfile.fill_in_notification_mode as FillInNotificationMode) ?? 'off',
    );
  }, [workerProfile]);

  const persist = async (available: boolean, mode: FillInNotificationMode) => {
    setIsSaving(true);
    try {
      await save({
        short_notice_available: available,
        fill_in_notification_mode: available ? mode : 'off',
      });
      await refreshWorkerProfile();
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    setShortNoticeAvailable(value);
    await persist(value, value ? notificationMode : 'off');
  };

  const handleModeChange = async (mode: FillInNotificationMode) => {
    setNotificationMode(mode);
    if (shortNoticeAvailable) {
      await persist(true, mode);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Fill-in availability</Text>
        <Text style={styles.subtitle}>
          Turn this on when you are open to short-notice temp shifts in your area.
        </Text>
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>Available for fill-ins</Text>
          <Text style={styles.toggleHint}>
            {shortNoticeAvailable
              ? 'Clinics can reach you for urgent shifts.'
              : 'You are not receiving fill-in alerts. Browse shifts below when ready.'}
          </Text>
        </View>
        <Switch
          value={shortNoticeAvailable}
          disabled={isSaving}
          onValueChange={handleToggle}
          trackColor={{ false: colors.fillSubtle, true: colors.primary }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.fillSubtle}
        />
      </View>

      {showNotificationOptions && shortNoticeAvailable ? (
        <View style={{ gap: 8 }}>
          {FILL_IN_NOTIFICATION_MODE_OPTIONS.map((option) => {
            const selected = notificationMode === option.value;
            return (
              <Pressable
                key={option.value}
                disabled={isSaving}
                style={[styles.modeOption, selected && styles.modeOptionSelected]}
                onPress={() => handleModeChange(option.value)}>
                <Text style={styles.modeLabel}>{option.label}</Text>
                {option.value === 'available_days_only' ? (
                  <Text style={styles.modeHint}>
                    Only notify when the shift overlaps your weekly schedule.
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
