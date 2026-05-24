import {
  FILL_IN_NOTIFICATION_MODE_OPTIONS,
  normalizePhoneForStorage,
  type FillInNotificationMode,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primarySubtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    statusText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
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
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
    insetDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.md,
    },
    expanded: {
      padding: spacing.md,
      gap: spacing.md,
    },
    groupLabel: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    modeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    modeText: { flex: 1, gap: 2 },
    modeLabel: { ...typography.body, fontWeight: '600', fontSize: 15 },
    modeHint: { fontSize: 13, lineHeight: 18, color: colors.labelSecondary },
    phoneBlock: { gap: spacing.md },
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
    <View style={styles.card}>
      {shortNoticeAvailable ? (
        <View style={styles.statusBanner}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>You are open to fill-in shifts</Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Available for fill-ins</Text>
          <Text style={styles.rowHint}>
            {shortNoticeAvailable
              ? 'Clinics can reach you for urgent shifts.'
              : 'Turn on when you are open to short-notice temp work.'}
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

      {showExpandedSettings ? (
        <>
          <View style={styles.divider} />
          <View style={styles.expanded}>
            <Text style={styles.groupLabel}>Alert me for</Text>
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
                      size={22}
                      color={selected ? colors.primary : colors.labelTertiary}
                    />
                    <View style={styles.modeText}>
                      <Text style={styles.modeLabel}>{option.label}</Text>
                      {option.value === 'available_days_only' ? (
                        <Text style={styles.modeHint}>
                          Only when the shift overlaps your weekly schedule.
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                  {index < NOTIFICATION_MODE_OPTIONS.length - 1 ? (
                    <View style={styles.insetDivider} />
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Text me for fill-ins</Text>
              <Text style={styles.rowHint}>
                {hasPhone
                  ? 'Optional SMS when a matching fill-in is posted.'
                  : 'Add your mobile number below to enable SMS alerts.'}
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
            <View style={[styles.expanded, styles.phoneBlock]}>
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
        </>
      ) : null}
    </View>
  );
}
