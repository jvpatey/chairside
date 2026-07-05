import {
  FILL_IN_NOTIFICATION_MODE_OPTIONS,
  normalizePhoneForStorage,
  type FillInNotificationMode,
} from '@chairside/config';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SettingsRadioRow } from '@/components/ui/SettingsRadioRow';
import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { FILL_IN_HERO_GRADIENT_LOCATIONS, getFillInHeroGradient, radii, spacing, useTheme, useThemedStyles } from '@/theme';

type FillInModePanelProps = {
  showNotificationOptions?: boolean;
  hidePrimaryToggle?: boolean;
  variant?: 'card' | 'grouped';
};

const NOTIFICATION_MODE_OPTIONS = FILL_IN_NOTIFICATION_MODE_OPTIONS.filter(
  (option) => option.value !== 'off',
);

function SettingsSection({
  title,
  children,
  nested = false,
}: {
  title?: string;
  children: ReactNode;
  nested?: boolean;
}) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: nested
      ? {
          marginHorizontal: spacing.md,
          marginBottom: spacing.md,
        }
      : {
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
          gap: spacing.xs,
        },
    panel: nested
      ? {
          backgroundColor: colors.fillSubtle,
          borderRadius: 12,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          gap: spacing.xs,
          overflow: 'visible',
        }
      : {
          gap: spacing.xs,
        },
    title: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
      paddingBottom: spacing.xs,
    },
    body: {
      gap: spacing.xs,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      opacity: 0.7,
      marginVertical: spacing.xs,
    },
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.panel}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <View style={styles.body}>{children}</View>
      </View>
    </View>
  );
}

export function FillInModePanel({
  showNotificationOptions = true,
  hidePrimaryToggle = false,
  variant = 'card',
}: FillInModePanelProps) {
  const { colors, isDark } = useTheme();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [shortNoticeAvailable, setShortNoticeAvailable] = useState(false);
  const [acceptsClinicOutreach, setAcceptsClinicOutreach] = useState(false);
  const [notificationMode, setNotificationMode] = useState<FillInNotificationMode>('off');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isGrouped = variant === 'grouped';
  const useNestedSections = !isGrouped;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    grouped: {
      overflow: 'hidden',
    },
    primaryHero: {
      position: 'relative',
      overflow: 'hidden',
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    primaryGradient: {
      ...StyleSheet.absoluteFillObject,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
    },
    phoneBlock: { gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.xs },
    phoneHelper: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      opacity: 0.7,
    },
    radioDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      opacity: 0.7,
    },
  }));

  useEffect(() => {
    if (!workerProfile) return;
    setShortNoticeAvailable(workerProfile.short_notice_available ?? false);
    setAcceptsClinicOutreach(workerProfile.accepts_clinic_fill_in_outreach ?? false);
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
  const showPhoneField = smsOptIn || !hasPhone || Boolean(phone.trim());
  const showExpandedSettings = showNotificationOptions && shortNoticeAvailable;
  const pendingPhone = normalizePhoneForStorage(phone);
  const phoneNeedsSave = Boolean(phone.trim()) && pendingPhone !== savedPhone;
  const phoneIsSaved = Boolean(savedPhone) && pendingPhone === savedPhone;
  const phoneSaveLabel = hasPhone ? 'Update number' : 'Save number';
  const fillInHeroGradient = getFillInHeroGradient(colors, isDark);

  const persist = async (
    available: boolean,
    mode: FillInNotificationMode,
    sms: boolean = smsOptIn,
    savePhone = false,
    outreach: boolean = acceptsClinicOutreach,
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
        fill_in_sms_opt_in: available && sms && Boolean(storedPhone) && !phoneNeedsSave,
        accepts_clinic_fill_in_outreach: available && outreach,
        ...(savePhone ? { phone: storedPhone } : {}),
      });
      await refreshWorkerProfile();
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    const mode =
      value && notificationMode === 'off' ? ('all' as FillInNotificationMode) : notificationMode;
    setShortNoticeAvailable(value);
    if (value) setNotificationMode(mode);
    if (!value) {
      setSmsOptIn(false);
      setAcceptsClinicOutreach(false);
    }
    await persist(
      value,
      value ? mode : 'off',
      value ? smsOptIn : false,
      false,
      value ? acceptsClinicOutreach : false,
    );
  };

  const handleOutreachToggle = async (value: boolean) => {
    setAcceptsClinicOutreach(value);
    if (shortNoticeAvailable) {
      await persist(true, notificationMode, smsOptIn, false, value);
    }
  };

  const handleModeChange = async (mode: FillInNotificationMode) => {
    setNotificationMode(mode);
    if (shortNoticeAvailable) {
      await persist(true, mode);
    }
  };

  const handleSmsToggle = async (value: boolean) => {
    if (value) {
      if (!savedPhone || phoneNeedsSave) {
        Alert.alert(
          'Save your number',
          'Enter and save your mobile number before enabling text alerts.',
        );
        return;
      }
    }

    setSmsOptIn(value);
    if (!value) {
      if (shortNoticeAvailable) {
        await persist(true, notificationMode, false);
      }
      return;
    }

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

  const phoneField = showPhoneField ? (
    <View style={styles.phoneBlock}>
      <AuthField
        label="Mobile phone"
        value={phone}
        onChangeText={(text) => setPhone(formatPhoneNumber(text))}
        keyboardType="phone-pad"
        placeholder={PHONE_NUMBER_PLACEHOLDER}
        editable={!isSaving}
        validated={phoneIsSaved && !phoneNeedsSave}
      />
      {phoneNeedsSave ? (
        <>
          <Text style={styles.phoneHelper}>
            {hasPhone
              ? 'Tap update to confirm your new number.'
              : 'Tap save to confirm your number before enabling texts.'}
          </Text>
          <OnboardingButton
            label={phoneSaveLabel}
            disabled={isSaving || !pendingPhone}
            onPress={() => void handleSavePhone()}
          />
        </>
      ) : null}
    </View>
  ) : null;

  const clinicOutreachSection = showExpandedSettings ? (
    <>
      <View style={styles.sectionDivider} />
      <SettingsSection nested={useNestedSections}>
        <SettingsToggleRow
          title="Let clinics reach out"
          hint="Clinics in your province can find you and message you about fill-ins."
          value={acceptsClinicOutreach}
          disabled={isSaving}
          bleedPadding={useNestedSections ? spacing.md : undefined}
          accentColor={colors.secondary}
          onValueChange={handleOutreachToggle}
        />
        <View style={styles.radioDivider} />
        <SettingsToggleRow
          title="Text me for fill-ins"
          hint={
            hasPhone && phoneIsSaved
              ? 'SMS for posted fill-ins and urgent clinic outreach.'
              : 'Add and save your mobile number.'
          }
          value={smsOptIn}
          disabled={isSaving || phoneNeedsSave}
          bleedPadding={useNestedSections ? spacing.md : undefined}
          accentColor={colors.secondary}
          onValueChange={handleSmsToggle}
        />
        {phoneField}
      </SettingsSection>
    </>
  ) : null;

  const postedFillInAlertsSection = showExpandedSettings ? (
    <>
      <View style={styles.sectionDivider} />
      <SettingsSection title="Posted fill-in alerts" nested={useNestedSections}>
        {NOTIFICATION_MODE_OPTIONS.map((option, index) => {
          const selected = notificationMode === option.value;
          return (
            <View key={option.value}>
              <SettingsRadioRow
                label={option.label}
                hint={
                  option.value === 'available_days_only'
                    ? 'When the shift matches your schedule.'
                    : undefined
                }
                selected={selected}
                disabled={isSaving}
                bleedPadding={useNestedSections ? spacing.md : undefined}
                accent="secondary"
                onPress={() => handleModeChange(option.value)}
              />
              {index < NOTIFICATION_MODE_OPTIONS.length - 1 ? (
                <View style={styles.radioDivider} />
              ) : null}
            </View>
          );
        })}
      </SettingsSection>
    </>
  ) : null;

  return (
    <View style={isGrouped ? styles.grouped : styles.card}>
      {hidePrimaryToggle ? null : (
        <View style={styles.primaryHero}>
          <LinearGradient
            colors={fillInHeroGradient}
            locations={FILL_IN_HERO_GRADIENT_LOCATIONS}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryGradient}
            pointerEvents="none"
          />
          <SettingsToggleRow
            prominence="primary"
            title="Available for fill-ins"
            hint={
              shortNoticeAvailable
                ? 'You appear open to short-notice fill-in opportunities.'
                : 'Turn on when you can cover urgent shifts.'
            }
            value={shortNoticeAvailable}
            disabled={isSaving}
            accentColor={colors.secondary}
            onValueChange={handleToggle}
          />
        </View>
      )}
      {clinicOutreachSection}
      {postedFillInAlertsSection}
    </View>
  );
}
