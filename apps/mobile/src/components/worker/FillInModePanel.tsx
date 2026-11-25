import {
  authUserHasVerifiedPhone,
  clearAuthPhoneBind,
  getAuthErrorMessage,
  requestAuthPhoneBind,
  verifyAuthPhoneBind,
} from '@chairside/api';
import { normalizePhoneForStorage, type FillInNotificationMode } from '@chairside/config';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FadeSwap } from '@/components/ui/FadeSwap';
import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import {
  getFillInTextAlertsHint,
  getFillInTextAlertsState,
  isFillInTextAlertsSwitchOn,
} from '@/lib/fillInTextAlerts';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { fontSemibold, radii, spacing, useTheme, useThemedStyles } from '@/theme';

type FillInModePanelProps = {
  showNotificationOptions?: boolean;
  hidePrimaryToggle?: boolean;
  variant?: 'card' | 'grouped';
  /**
   * textAlerts — single Text alerts hero + phone (settings hub).
   * default — available toggle + SMS (onboarding).
   */
  layout?: 'default' | 'textAlerts';
};

type PersistParams = {
  available: boolean;
  mode: FillInNotificationMode;
  sms: boolean;
  /** Normalized phone to save alongside the change. */
  phone?: string;
};

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
  layout = 'default',
}: FillInModePanelProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [shortNoticeAvailable, setShortNoticeAvailable] = useState(false);
  const [notificationMode, setNotificationMode] = useState<FillInNotificationMode>('off');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [phone, setPhone] = useState('');
  const [isFinishingTexts, setIsFinishingTexts] = useState(false);
  const [isChangingNumber, setIsChangingNumber] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [phoneBindE164, setPhoneBindE164] = useState<string | null>(null);
  const [phoneBindCode, setPhoneBindCode] = useState('');
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
    phoneSummary: {
      gap: 4,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    phoneSummaryTop: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
    },
    phoneSummaryLabel: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
    },
    phoneSummaryValue: {
      fontSize: 17,
      lineHeight: 22,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
    phoneActions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    changeLink: {
      ...webPointer(),
    },
    changeLinkText: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    removeLinkText: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.destructive,
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
    setPhoneBindE164(null);
    setPhoneBindCode('');
  };

  const persist = async ({ available, mode, sms, phone: phoneToSave }: PersistParams) => {
    // SMS requires a saved number: the one being saved now, or the one already on file.
    const phoneForSms = phoneToSave ?? savedPhone;
    setIsSaving(true);
    setSaveError(null);
    try {
      await save({
        short_notice_available: available,
        fill_in_notification_mode: available ? mode : 'off',
        fill_in_sms_opt_in: available && sms && Boolean(phoneForSms),
        // Outreach stays on with fill-ins — no separate toggle in the SMS-first UI.
        accepts_clinic_fill_in_outreach: available,
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
  });

  const handleToggle = async (value: boolean) => {
    // Outreach-first: text alerts always use province-wide matching (`all`), not schedule days.
    const mode: FillInNotificationMode =
      layout === 'textAlerts'
        ? value
          ? 'all'
          : 'off'
        : value && notificationMode === 'off'
          ? 'all'
          : notificationMode;
    const smsWhenOn = value && (smsOptIn || hasPhone);
    setShortNoticeAvailable(value);
    if (value) {
      setNotificationMode(mode === 'off' ? 'all' : mode);
      if (hasPhone) {
        setSmsOptIn(true);
      } else if (layout === 'textAlerts') {
        setIsFinishingTexts(true);
      }
    }
    if (!value) {
      setSmsOptIn(false);
      closePhoneEntry();
    }
    // Without a phone, wait for Save number before persisting SMS on.
    if (value && !hasPhone && layout === 'textAlerts') {
      await persist({
        available: true,
        mode: 'all',
        sms: false,
      });
      return;
    }
    await persist({
      available: value,
      mode: value ? (mode === 'off' ? 'all' : mode) : 'off',
      sms: smsWhenOn,
    });
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
    setSaveError(null);

    try {
      if (user?.id && !authUserHasVerifiedPhone(user, pendingPhone)) {
        if (!phoneBindE164) {
          const bind = await requestAuthPhoneBind(pendingPhone);
          if (bind.needsOtp) {
            setPhoneBindE164(bind.e164);
            setPhoneBindCode('');
            return;
          }
        } else {
          if (phoneBindCode.trim().length < 6) {
            setPhoneError('Enter the 6-digit code we texted you.');
            return;
          }
          await verifyAuthPhoneBind(user.id, phoneBindE164, phoneBindCode);
          setPhoneBindE164(null);
          setPhoneBindCode('');
        }
      }
    } catch (error) {
      setPhoneError(getAuthErrorMessage(error));
      return;
    }

    if (textState === 'finishing') {
      const ok = await persist({
        ...currentSettings(),
        available: true,
        mode: layout === 'textAlerts' ? 'all' : currentSettings().mode,
        sms: true,
        phone: pendingPhone,
      });
      if (ok) {
        setSmsOptIn(true);
        setShortNoticeAvailable(true);
        if (layout === 'textAlerts') {
          setNotificationMode('all');
        }
        closePhoneEntry();
      }
      return;
    }

    const ok = await persist({ ...currentSettings(), phone: pendingPhone });
    if (ok) closePhoneEntry();
  };

  const startChangingNumber = () => {
    setPhone(savedPhone ? formatPhoneNumber(savedPhone) : '');
    setPhoneError(null);
    setIsChangingNumber(true);
  };

  const runRemovePhone = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    setPhoneError(null);
    setSaveError(null);
    try {
      await clearAuthPhoneBind(user.id);
      setPhone('');
      setPhoneBindE164(null);
      setPhoneBindCode('');
      setSmsOptIn(false);
      setIsChangingNumber(false);
      // Keep the add-number form open so the section doesn’t go blank.
      setIsFinishingTexts(true);
      await refreshWorkerProfile();
    } catch (error) {
      setPhoneError(getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhone = () => {
    if (isSaving || !user?.id) return;
    showConfirmActionSheet({
      title: 'Remove mobile number?',
      message:
        'Text alerts and phone sign-in will stop until you add and verify a number again.',
      confirmLabel: 'Remove number',
      destructive: true,
      onConfirm: () => {
        void runRemovePhone();
      },
    });
  };

  const phoneEntry = phoneEntryOpen ? (
    <View style={styles.phoneBlock}>
      <AuthField
        label="Mobile phone"
        value={phone}
        onChangeText={(text) => {
          setPhone(formatPhoneNumber(text));
          setPhoneBindE164(null);
          setPhoneBindCode('');
          if (phoneError) setPhoneError(null);
        }}
        keyboardType="phone-pad"
        placeholder={PHONE_NUMBER_PLACEHOLDER}
        editable={!isSaving}
        invalid={Boolean(phoneError)}
        validated={Boolean(pendingPhone)}
        accent="primary"
      />
      {phoneBindE164 ? (
        <AuthField
          label="Verification code"
          value={phoneBindCode}
          onChangeText={setPhoneBindCode}
          keyboardType="number-pad"
          placeholder="6-digit code"
          editable={!isSaving}
          autoComplete="one-time-code"
          accent="primary"
        />
      ) : null}
      {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
      <OnboardingButton
        label={
          isSaving
            ? 'Saving…'
            : phoneBindE164
              ? 'Verify and save'
              : user?.id && pendingPhone && !authUserHasVerifiedPhone(user, pendingPhone)
                ? 'Send code'
                : 'Save number'
        }
        accent="primary"
        disabled={isSaving || !pendingPhone}
        onPress={() => void handleSubmitPhone()}
      />
      {textState === 'changing_number' ? (
        <Pressable accessibilityRole="button" onPress={closePhoneEntry} style={styles.cancelLink}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      ) : null}
      <Text style={styles.helper}>Message and data rates may apply.</Text>
    </View>
  ) : hasPhone ? (
    <View style={styles.phoneSummary}>
      <View style={styles.phoneSummaryTop}>
        <Text style={styles.phoneSummaryLabel}>Mobile</Text>
        <View style={styles.phoneActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change mobile number"
            disabled={isSaving}
            onPress={startChangingNumber}
            style={({ pressed, hovered }) => [
              styles.changeLink,
              webHover(hovered, pressed, { opacity: 0.85 }),
              pressed && { opacity: 0.75 },
            ]}>
            <Text style={styles.changeLinkText}>Change</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove mobile number"
            disabled={isSaving}
            onPress={handleRemovePhone}
            style={({ pressed, hovered }) => [
              styles.changeLink,
              webHover(hovered, pressed, { opacity: 0.85 }),
              pressed && { opacity: 0.75 },
            ]}>
            <Text style={styles.removeLinkText}>Remove</Text>
          </Pressable>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mobile number ${formatPhoneNumber(savedPhone!)}. Double tap to change.`}
        onPress={startChangingNumber}
        style={({ pressed, hovered }) => [
          webHover(hovered, pressed, { opacity: 0.9 }),
          pressed && { opacity: 0.8 },
        ]}>
        <Text style={styles.phoneSummaryValue}>{formatPhoneNumber(savedPhone!)}</Text>
      </Pressable>
    </View>
  ) : null;

  const textAlertsSection =
    showExpandedSettings && layout === 'default' ? (
      <>
        {hidePrimaryToggle ? null : <View style={styles.sectionDivider} />}
        <SettingsSection title="Text alerts" nested={useNestedSections} embedded={isGrouped}>
          <SettingsToggleRow
            prominence="primary"
            title="Fill-in text alerts"
            hint={getFillInTextAlertsHint(textState, savedPhone)}
            value={isFillInTextAlertsSwitchOn(textState, smsOptIn)}
            disabled={isSaving}
            bleedPadding={useNestedSections ? spacing.md : undefined}
            accentColor={colors.primary}
            onValueChange={(value) => void handleSmsToggle(value)}
          />
          <FadeSwap swapKey={phoneEntryOpen ? 'entry' : 'summary'} durationMs={220}>
            {phoneEntry}
          </FadeSwap>
        </SettingsSection>
      </>
    ) : null;

  const textAlertsPhoneOnly =
    layout === 'textAlerts' && shortNoticeAvailable ? (
      <SettingsSection nested={useNestedSections} embedded={isGrouped}>
        <Text style={styles.helper}>{getFillInTextAlertsHint(textState, savedPhone)}</Text>
        <FadeSwap swapKey={phoneEntryOpen ? 'entry' : 'summary'} durationMs={220}>
          {phoneEntry}
        </FadeSwap>
      </SettingsSection>
    ) : null;

  const primaryTitle = layout === 'textAlerts' ? 'Text alerts' : 'Available for fill-ins';
  const primaryHint =
    layout === 'textAlerts'
      ? shortNoticeAvailable
        ? 'We’ll text you when a fill-in opens nearby.'
        : 'Turn on to get fill-in opportunities by text.'
      : shortNoticeAvailable
        ? 'You appear open to short-notice fill-in opportunities.'
        : 'Turn on when you can cover urgent shifts.';

  return (
    <View style={isGrouped ? styles.grouped : styles.card}>
      {hidePrimaryToggle ? null : (
        <View style={styles.primarySection}>
          <SettingsToggleRow
            prominence="primary"
            title={primaryTitle}
            hint={primaryHint}
            value={shortNoticeAvailable}
            disabled={isSaving}
            accentColor={colors.primary}
            bleedPadding={isGrouped ? undefined : spacing.md}
            onValueChange={(value) => void handleToggle(value)}
          />
        </View>
      )}
      {layout === 'textAlerts' ? textAlertsPhoneOnly : null}
      {layout === 'default' ? (
        <FadeSwap
          swapKey={showExpandedSettings ? 'expanded' : 'collapsed'}
          style={isGrouped ? styles.grouped : undefined}>
          {textAlertsSection}
        </FadeSwap>
      ) : null}
      {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
    </View>
  );
}
