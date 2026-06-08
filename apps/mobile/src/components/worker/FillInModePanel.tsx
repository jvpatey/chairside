import {
  FILL_IN_NOTIFICATION_MODE_OPTIONS,
  normalizePhoneForStorage,
  type FillInNotificationMode,
} from '@chairside/config';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { RowDivider } from '@/components/clinic/DetailCard';
import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SettingsRadioRow } from '@/components/ui/SettingsRadioRow';
import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { spacing, useThemedStyles } from '@/theme';

type FillInModePanelProps = {
  showNotificationOptions?: boolean;
  variant?: 'card' | 'grouped';
};

const NOTIFICATION_MODE_OPTIONS = FILL_IN_NOTIFICATION_MODE_OPTIONS.filter(
  (option) => option.value !== 'off',
);

export function FillInModePanel({
  showNotificationOptions = true,
  variant = 'card',
}: FillInModePanelProps) {
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [shortNoticeAvailable, setShortNoticeAvailable] = useState(false);
  const [notificationMode, setNotificationMode] = useState<FillInNotificationMode>('off');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    grouped: {},
    primaryBlock: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    primaryBlockExpanded: {
      paddingBottom: 0,
    },
    nestedGroupWrap: {
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    nestedGroup: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.md,
      overflow: 'visible',
    },
    groupLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    phoneBlock: { gap: spacing.md, paddingTop: spacing.xs },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      opacity: 0.7,
    },
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

  const savedPhone = workerProfile?.phone?.trim() || null;
  const hasPhone = Boolean(savedPhone);
  const showPhoneField = smsOptIn || !hasPhone;
  const showExpandedSettings = showNotificationOptions && shortNoticeAvailable;
  const pendingPhone = normalizePhoneForStorage(phone);
  const phoneNeedsSave = Boolean(phone.trim()) && pendingPhone !== savedPhone;
  const phoneIsSaved = Boolean(savedPhone) && pendingPhone === savedPhone;

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

  const handleSavePhone = async () => {
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
    <View style={variant === 'grouped' ? styles.grouped : styles.card}>
      <View
        style={[styles.primaryBlock, showExpandedSettings && styles.primaryBlockExpanded]}>
        <SettingsToggleRow
          prominence="primary"
          title="Available for fill-ins"
          hint={
            shortNoticeAvailable
              ? 'You are open to urgent shifts — clinics can reach you.'
              : 'Turn on when you are open to short-notice temp work.'
          }
          value={shortNoticeAvailable}
          disabled={isSaving}
          onValueChange={handleToggle}
        />
      </View>

      {showExpandedSettings ? (
        <View style={styles.nestedGroupWrap}>
          <View style={styles.nestedGroup}>
            <Text style={styles.groupLabel}>Notification preferences</Text>
            {NOTIFICATION_MODE_OPTIONS.map((option, index) => {
              const selected = notificationMode === option.value;
              return (
                <View key={option.value}>
                  <SettingsRadioRow
                    label={option.label}
                    hint={
                      option.value === 'available_days_only'
                        ? 'Only when the shift overlaps your weekly schedule.'
                        : undefined
                    }
                    selected={selected}
                    disabled={isSaving}
                    bleedPadding={spacing.md}
                    onPress={() => handleModeChange(option.value)}
                  />
                  {index < NOTIFICATION_MODE_OPTIONS.length - 1 ? (
                    <View style={styles.divider} />
                  ) : null}
                </View>
              );
            })}

            <RowDivider />

            <SettingsToggleRow
              title="Text me for fill-ins"
              hint={
                hasPhone
                  ? 'Optional SMS when a matching fill-in is posted.'
                  : 'Add your mobile number below to enable SMS alerts.'
              }
              value={smsOptIn}
              disabled={isSaving}
              onValueChange={handleSmsToggle}
            />

            {showPhoneField ? (
              <View style={styles.phoneBlock}>
                <AuthField
                  label="Mobile phone"
                  value={phone}
                  onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                  keyboardType="phone-pad"
                  placeholder={PHONE_NUMBER_PLACEHOLDER}
                  editable={!isSaving}
                  validated={phoneIsSaved}
                />
                {phoneNeedsSave ? (
                  <OnboardingButton
                    label="Save number"
                    disabled={isSaving || !pendingPhone}
                    onPress={() => void handleSavePhone()}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
