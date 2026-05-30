import {
  FILL_IN_NOTIFICATION_MODE_OPTIONS,
  normalizePhoneForStorage,
  type FillInNotificationMode,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { RowDivider } from '@/components/clinic/DetailCard';
import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { useTheme, useThemedStyles } from '@/theme';

type FillInModePanelProps = {
  showNotificationOptions?: boolean;
  variant?: 'card' | 'grouped';
};

const NOTIFICATION_MODE_OPTIONS = FILL_IN_NOTIFICATION_MODE_OPTIONS.filter(
  (option) => option.value !== 'off',
);

type SettingsToggleRowProps = {
  title: string;
  hint: string;
  value: boolean;
  disabled?: boolean;
  prominence?: 'primary' | 'secondary';
  onValueChange: (value: boolean) => void;
};

function SettingsToggleRow({
  title,
  hint,
  value,
  disabled,
  prominence = 'secondary',
  onValueChange,
}: SettingsToggleRowProps) {
  const { colors } = useTheme();
  const isPrimary = prominence === 'primary';

  const styles = useThemedStyles(({ spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      minHeight: isPrimary ? 56 : 52,
      paddingVertical: isPrimary ? spacing.sm + 2 : spacing.sm,
    },
    rowText: { flex: 1, gap: spacing.xs },
    titlePrimary: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '700',
      lineHeight: 22,
    },
    titleSecondary: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 21,
    },
    hint: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    switchWrap: {
      paddingRight: isPrimary ? spacing.xs : 0,
    },
  }));

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={isPrimary ? styles.titlePrimary : styles.titleSecondary}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <View style={styles.switchWrap}>
        <Switch
          value={value}
          disabled={disabled}
          onValueChange={onValueChange}
          trackColor={{ false: colors.fillSubtle, true: colors.primary }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.fillSubtle}
        />
      </View>
    </View>
  );
}

export function FillInModePanel({
  showNotificationOptions = true,
  variant = 'card',
}: FillInModePanelProps) {
  const { colors } = useTheme();
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
    modeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      minHeight: 44,
    },
    modeText: { flex: 1, gap: 2 },
    modeLabel: { fontSize: 15, fontWeight: '500', lineHeight: 20 },
    modeLabelSelected: { fontWeight: '600', color: colors.labelPrimary },
    modeLabelUnselected: { color: colors.labelSecondary },
    modeHint: { fontSize: 13, lineHeight: 18, color: colors.labelTertiary },
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
                  <Pressable
                    disabled={isSaving}
                    style={styles.modeRow}
                    onPress={() => handleModeChange(option.value)}>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? colors.primary : colors.labelTertiary}
                    />
                    <View style={styles.modeText}>
                      <Text
                        style={[
                          styles.modeLabel,
                          selected ? styles.modeLabelSelected : styles.modeLabelUnselected,
                        ]}>
                        {option.label}
                      </Text>
                      {option.value === 'available_days_only' ? (
                        <Text style={styles.modeHint}>
                          Only when the shift overlaps your weekly schedule.
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
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
