import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { spacing, useThemedStyles } from '@/theme';

export function WorkerJobNotificationPreferences() {
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [jobOptIn, setJobOptIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
      paddingHorizontal: spacing.md,
    },
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
    <View style={styles.card}>
      <SettingsToggleRow
        title="Job post alerts"
        hint="Get notified when a clinic posts a live role matching your position. Turn off push separately above if you only want in-app alerts."
        value={jobOptIn}
        disabled={isSaving}
        bleedPadding={spacing.md}
        onValueChange={(value) => {
          setJobOptIn(value);
          void persistJobOptIn(value);
        }}
      />
    </View>
  );
}
