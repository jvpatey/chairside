import { useEffect, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';

import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useThemedStyles } from '@/theme';

export function WorkerNotificationPreferences() {
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [jobOptIn, setJobOptIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    section: { gap: spacing.lg },
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
      <FillInModePanel />

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>New job alerts</Text>
          <Text style={styles.toggleHint}>
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
          trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
        />
      </View>
    </View>
  );
}
