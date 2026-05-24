import { useEffect, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';

import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { WorkerSectionHeader } from '@/components/worker/WorkerCards';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useTheme, useThemedStyles } from '@/theme';

export function WorkerNotificationPreferences() {
  const { colors } = useTheme();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [jobOptIn, setJobOptIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    section: { gap: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      gap: spacing.md,
    },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { ...typography.body, fontWeight: '600', color: colors.labelPrimary },
    rowHint: { fontSize: 13, lineHeight: 18, color: colors.labelSecondary },
  }));

  useEffect(() => {
    if (!workerProfile) return;
    setJobOptIn(workerProfile.job_notification_opt_in ?? false);
  }, [workerProfile]);

  const persistJobOptIn = async (value: boolean) => {
    setIsSaving(true);
    try {
      await save({ job_notification_opt_in: value });
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

  return (
    <View style={styles.section}>
      <View>
        <WorkerSectionHeader title="Fill-in shifts" />
        <FillInModePanel />
      </View>

      <View>
        <WorkerSectionHeader title="Permanent roles" />
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>New job alerts</Text>
              <Text style={styles.rowHint}>
                Notify me when a clinic posts a live role matching my position.
              </Text>
            </View>
            <Switch
              value={jobOptIn}
              disabled={isSaving}
              onValueChange={(value) => {
                setJobOptIn(value);
                void persistJobOptIn(value);
              }}
              trackColor={{ false: colors.fillSubtle, true: colors.primary }}
              thumbColor={colors.surface}
              ios_backgroundColor={colors.fillSubtle}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
