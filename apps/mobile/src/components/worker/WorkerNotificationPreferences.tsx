import { normalizePhoneForStorage } from '@chairside/config';
import { useEffect, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { useThemedStyles } from '@/theme';

export function WorkerNotificationPreferences() {
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [phone, setPhone] = useState('');
  const [jobOptIn, setJobOptIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    section: { gap: spacing.lg },
    block: { gap: spacing.md },
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
  }));

  useEffect(() => {
    if (!workerProfile) return;
    setPhone(workerProfile.phone ? formatPhoneNumber(workerProfile.phone) : '');
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

  const persistPhone = async () => {
    const stored = normalizePhoneForStorage(phone);
    if (phone.trim() && !stored) {
      Alert.alert('Invalid phone', 'Enter a 10-digit phone number.');
      return;
    }
    setIsSaving(true);
    try {
      await save({ phone: stored });
      await refreshWorkerProfile();
    } catch (error) {
      Alert.alert(
        'Could not save phone',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <FillInModePanel />

      <View style={styles.block}>
        <Text style={styles.title}>Contact for text alerts</Text>
        <Text style={styles.subtitle}>
          Optional. Used only for fill-in SMS when you enable texting below.
        </Text>
        <AuthField
          label="Mobile phone"
          value={phone}
          onChangeText={(text) => setPhone(formatPhoneNumber(text))}
          onBlur={() => void persistPhone()}
          keyboardType="phone-pad"
          placeholder={PHONE_NUMBER_PLACEHOLDER}
          editable={!isSaving}
        />
      </View>

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
