import {
  FILL_IN_NOTIFICATION_MODE_OPTIONS,
  normalizePhoneForStorage,
  type FillInNotificationMode,
} from '@chairside/config';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FadeSwap } from '@/components/ui/FadeSwap';
import { SettingsRadioRow } from '@/components/ui/SettingsRadioRow';
import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import {
  getFillInTextAlertsHint,
  getFillInTextAlertsState,
  isFillInTextAlertsSwitchOn,
} from '@/lib/fillInTextAlerts';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { webPointer } from '@/lib/webPressableStyles';
import { radii, spacing, useTheme, useThemedStyles } from '@/theme';

type FillInModePanelProps = {
  showNotificationOptions?: boolean;
  hidePrimaryToggle?: boolean;
  variant?: 'card' | 'grouped';
};

type PersistParams = {
  available: boolean;
  mode: FillInNotificationMode;
  sms: boolean;
  outreach: boolean;
  /** Normalized phone to save alongside the change. */
  phone?: string;
};

const NOTIFICATION_MODE_OPTIONS = FILL_IN_NOTIFICATION_MODE_OPTIONS.filter(
  (option) => option.value !== 'off',
);

function SettingsSection({
  title,
  children,
  nested = false,
  embedded = false,
}: {
  title?: string;
  children: ReactNode;
  nested?: boolean;
  embedded?: boolean;
}) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: embedded
      ? {
          gap: spacing.xs,
        }
      : nested
        ? {
            marginBottom: spacing.sm,
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
  const { colors } = useTheme();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [shortNoticeAvailable, setShortNoticeAvailable] = useState(false);
  const [acceptsClinicOutreach, setAcceptsClinicOutreach] = useState(false);
  const [notificationMode, setNotificationMode] = useState<FillInNotificationMode>('off');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [phone, setPhone] = useState('');
  const [isFinishingTexts, setIsFinishingTexts] = useState(false);
  const [isChangingNumber, setIsChangingNumber] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
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
      gap: spacing.xs,
    },
    primarySection: {
      paddingHorizontal: isGrouped ? 0 : spacing.md,
      paddingVertical: isGrouped ? 0 : spacing.md,
    },
    phoneBlock: { gap: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.xs },
    helper: {
      ...typography.subtitle,
      fontSize: 12,
      lineHeight: 17,
      color: colors.labelTertiary,
    },
    errorText: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.destructive,
    },
    linkRow: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    linkText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.secondary,
    },
    cancelLink: {
      alignSelf: 'center',
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    cancelText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelSecondary,
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
    saveError: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.destructive,
      paddingTop: spacing.xs,
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
  }, [workerProfile]);

  const savedPhone = workerProfile?.phone?.trim() || null;
  const hasPhone = Boolean(savedPhone);
  const showExpandedSettings = showNotificationOptions && shortNoticeAvailable;
  const pendingPhone = normalizePhoneForStorage(phone);
  const textState = getFillInTextAlertsState({
    smsOptIn,
    savedPhone,
    isFinishing: isFinishingTexts,
    isChangingNumber,
  });
  const phoneEntryOpen = textState === 'finishing' || textState === 'changing_number';

  const closePhoneEntry = () => {
    setIsFinishingTexts(false);
    setIsChangingNumber(false);
    setPhone('');
    setPhoneError(null);
  };

  const persist = async ({ available, mode, sms, outreach, phone: phoneToSave }: PersistParams) => {
    // SMS requires a saved number: the one being saved now, or the one already on file.
    const phoneForSms = phoneToSave ?? savedPhone;
    setIsSaving(true);
    setSaveError(null);
    try {
      await save({
        short_notice_available: available,
        fill_in_notification_mode: available ? mode : 'off',
        fill_in_sms_opt_in: available && sms && Boolean(phoneForSms),
        accepts_clinic_fill_in_outreach: available && outreach,
        ...(phoneToSave ? { phone: phoneToSave } : {}),
      });
      await refreshWorkerProfile();
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save. Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const currentSettings = (): PersistParams => ({
    available: shortNoticeAvailable,
    mode: notificationMode,
    sms: smsOptIn,
    outreach: acceptsClinicOutreach,
  });

  const handleToggle = async (value: boolean) => {
    const mode =
      value && notificationMode === 'off' ? ('all' as FillInNotificationMode) : notificationMode;
    setShortNoticeAvailable(value);
    if (value) setNotificationMode(mode);
    if (!value) {
      setSmsOptIn(false);
      setAcceptsClinicOutreach(false);
      closePhoneEntry();
    }
    await persist({
      available: value,
      mode: value ? mode : 'off',
      sms: value ? smsOptIn : false,
      outreach: value ? acceptsClinicOutreach : false,
    });
  };

  const handleOutreachToggle = async (value: boolean) => {
    setAcceptsClinicOutreach(value);
    if (shortNoticeAvailable) {
      await persist({ ...currentSettings(), outreach: value });
    }
  };

  const handleModeChange = async (mode: FillInNotificationMode) => {
    setNotificationMode(mode);
    if (shortNoticeAvailable) {
      await persist({ ...currentSettings(), mode });
    }
  };

  const handleSmsToggle = async (value: boolean) => {
    setPhoneError(null);
    if (!value) {
      closePhoneEntry();
      if (smsOptIn) {
        setSmsOptIn(false);
        await persist({ ...currentSettings(), sms: false });
      }
      return;
    }

    if (hasPhone) {
      setIsChangingNumber(false);
      setSmsOptIn(true);
      const ok = await persist({ ...currentSettings(), sms: true });
      if (!ok) setSmsOptIn(false);
      return;
    }

    setIsFinishingTexts(true);
  };

  const handleSubmitPhone = async () => {
    if (!pendingPhone) {
      setPhoneError('Enter a 10-digit mobile number.');
      return;
    }
    setPhoneError(null);

    if (textState === 'finishing') {
      const ok = await persist({ ...currentSettings(), sms: true, phone: pendingPhone });
      if (ok) {
        setSmsOptIn(true);
        closePhoneEntry();
      }
      return;
    }

    const ok = await persist({ ...currentSettings(), phone: pendingPhone });
    if (ok) closePhoneEntry();
  };

  const phoneEntry = phoneEntryOpen ? (
    <View style={styles.phoneBlock}>
      <AuthField
        label="Mobile phone"
        value={phone}
        onChangeText={(text) => {
          setPhone(formatPhoneNumber(text));
          if (phoneError) setPhoneError(null);
        }}
        keyboardType="phone-pad"
        placeholder={PHONE_NUMBER_PLACEHOLDER}
        editable={!isSaving}
        invalid={Boolean(phoneError)}
        validated={Boolean(pendingPhone)}
        accent="secondary"
      />
      {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
      <OnboardingButton
        label={
          textState === 'finishing'
            ? isSaving
              ? 'Turning on…'
              : 'Turn on text alerts'
            : isSaving
              ? 'Saving…'
              : 'Save new number'
        }
        accent="secondary"
        disabled={isSaving || !pendingPhone}
        onPress={() => void handleSubmitPhone()}
      />
      {textState === 'changing_number' ? (
        <Pressable accessibilityRole="button" onPress={closePhoneEntry} style={styles.cancelLink}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      ) : null}
      <Text style={styles.helper}>
        Message and data rates may apply. You can turn texts off anytime.
      </Text>
    </View>
  ) : hasPhone ? (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        setPhone('');
        setPhoneError(null);
        setIsChangingNumber(true);
      }}
      style={styles.linkRow}>
      <Text style={styles.linkText}>Change number</Text>
    </Pressable>
  ) : null;

  const textAlertsSection = showExpandedSettings ? (
    <>
      {hidePrimaryToggle ? null : <View style={styles.sectionDivider} />}
      <SettingsSection title="Text alerts" nested={useNestedSections} embedded={isGrouped}>
        <SettingsToggleRow
          prominence="primary"
          title="Text me for fill-ins"
          hint={getFillInTextAlertsHint(textState, savedPhone)}
          value={isFillInTextAlertsSwitchOn(textState, smsOptIn)}
          disabled={isSaving}
          bleedPadding={useNestedSections ? spacing.md : undefined}
          accentColor={colors.secondary}
          onValueChange={(value) => void handleSmsToggle(value)}
        />
        <FadeSwap swapKey={phoneEntryOpen ? 'entry' : 'summary'} durationMs={220}>
          {phoneEntry}
        </FadeSwap>
      </SettingsSection>
    </>
  ) : null;

  const clinicOutreachSection = showExpandedSettings ? (
    <>
      <View style={styles.sectionDivider} />
      <SettingsSection nested={useNestedSections} embedded={isGrouped}>
        <SettingsToggleRow
          title="Let clinics reach out"
          hint="Clinics in your province can find you and message you about fill-ins."
          value={acceptsClinicOutreach}
          disabled={isSaving}
          bleedPadding={useNestedSections ? spacing.md : undefined}
          accentColor={colors.secondary}
          onValueChange={(value) => void handleOutreachToggle(value)}
        />
      </SettingsSection>
    </>
  ) : null;

  const postedFillInAlertsSection = showExpandedSettings ? (
    <>
      <View style={styles.sectionDivider} />
      <SettingsSection title="Posted fill-in alerts" nested={useNestedSections} embedded={isGrouped}>
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
                onPress={() => void handleModeChange(option.value)}
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
        <View style={styles.primarySection}>
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
            bleedPadding={isGrouped ? undefined : spacing.md}
            onValueChange={(value) => void handleToggle(value)}
          />
        </View>
      )}
      <FadeSwap
        swapKey={showExpandedSettings ? 'expanded' : 'collapsed'}
        style={isGrouped ? styles.grouped : undefined}>
        {textAlertsSection}
        {clinicOutreachSection}
        {postedFillInAlertsSection}
      </FadeSwap>
      {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
    </View>
  );
}
