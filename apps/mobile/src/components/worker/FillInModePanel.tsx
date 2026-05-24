import {
  FILL_IN_NOTIFICATION_MODE_OPTIONS,
  normalizePhoneForStorage,
  type FillInNotificationMode,
} from '@chairside/config';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { useTheme, useThemedStyles } from '@/theme';

type FillInModePanelProps = {
  showNotificationOptions?: boolean;
};

const NOTIFICATION_MODE_OPTIONS = FILL_IN_NOTIFICATION_MODE_OPTIONS.filter(
  (option) => option.value !== 'off',
);

export function FillInModePanel({ showNotificationOptions = true }: FillInModePanelProps) {
  const { colors } = useTheme();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [shortNoticeAvailable, setShortNoticeAvailable] = useState(false);
  const [notificationMode, setNotificationMode] = useState<FillInNotificationMode>('off');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [phone, setPhone] = useState('');
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
    smsBlock: { gap: spacing.sm },
  }));

  useEffect(() => {
    if (!workerProfile) return;
    setShortNoticeAvailable(workerProfile.short_notice_available ?? false);
    setNotificationMode(
      (workerProfile.fill_in_notification_mode as FillInNotificationMode) ?? 'off',
    );
    setSmsOptIn(workerProfile.fill_in_sms_opt_in ?? false);
    setPhone(workerProfile.phone ? formatPhoneNumber(workerProfile.phone) : '');
  }, [workerProfile]);

  const resolveStoredPhone = () => {
    const fromInput = normalizePhoneForStorage(phone);
    if (fromInput) return fromInput;
    return workerProfile?.phone?.trim() || null;
  };

  const hasPhone = Boolean(resolveStoredPhone());
  const showPhoneField = smsOptIn || !hasPhone;

  const persist = async (
    available: boolean,
    mode: FillInNotificationMode,
    sms: boolean = smsOptIn,
    savePhone = false,
  ) => {
    const storedPhone = resolveStoredPhone();
    if (savePhone && phone.trim() && !storedPhone) {
      Alert.alert('Invalid phone', 'Enter a 10-digit phone number.');
      return;
    }

    setIsSaving(true);
    try {
      await save({
        short_notice_available: available,
        fill_in_notification_mode: available ? mode : 'off',
        fill_in_sms_opt_in: available && sms && Boolean(storedPhone),
        ...(savePhone ? { phone: storedPhone } : {}),
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
    const mode =
      value && notificationMode === 'off' ? ('all' as FillInNotificationMode) : notificationMode;
    setShortNoticeAvailable(value);
    if (value) setNotificationMode(mode);
    if (!value) setSmsOptIn(false);
    await persist(value, value ? mode : 'off', value ? smsOptIn : false);
  };

  const handleModeChange = async (mode: FillInNotificationMode) => {
    setNotificationMode(mode);
    if (shortNoticeAvailable) {
      await persist(true, mode);
    }
  };

  const handleSmsToggle = async (value: boolean) => {
    setSmsOptIn(value);
    if (!value) {
      if (shortNoticeAvailable) {
        await persist(true, notificationMode, false);
      }
      return;
    }

    const storedPhone = resolveStoredPhone();
    if (!storedPhone) return;

    if (shortNoticeAvailable) {
      await persist(true, notificationMode, true);
    }
  };

  const handlePhoneBlur = async () => {
    if (!phone.trim()) return;

    const storedPhone = normalizePhoneForStorage(phone);
    if (!storedPhone) {
      Alert.alert('Invalid phone', 'Enter a 10-digit phone number.');
      return;
    }

    if (shortNoticeAvailable && smsOptIn) {
      await persist(true, notificationMode, true, true);
      return;
    }

    setIsSaving(true);
    try {
      await save({ phone: storedPhone });
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
          {NOTIFICATION_MODE_OPTIONS.map((option) => {
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
          <View style={styles.smsBlock}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Text me for fill-ins</Text>
                <Text style={styles.toggleHint}>
                  {hasPhone
                    ? 'Optional SMS when a matching fill-in is posted. Standard message rates may apply.'
                    : 'Enter your mobile number below to enable SMS alerts.'}
                </Text>
              </View>
              <Switch
                value={smsOptIn}
                disabled={isSaving}
                onValueChange={handleSmsToggle}
                trackColor={{ false: colors.fillSubtle, true: colors.primary }}
                thumbColor={colors.surface}
                ios_backgroundColor={colors.fillSubtle}
              />
            </View>
            {showPhoneField ? (
              <AuthField
                label="Mobile phone"
                value={phone}
                onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                onBlur={() => void handlePhoneBlur()}
                keyboardType="phone-pad"
                placeholder={PHONE_NUMBER_PLACEHOLDER}
                editable={!isSaving}
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
