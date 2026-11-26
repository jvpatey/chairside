import type { OtpChannel } from '@chairside/api';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

/** Matches Supabase Auth email max frequency (1 minute). */
const OTP_RESEND_COOLDOWN_SECONDS = 60;

type WorkerOtpAuthFormProps = {
  mode: 'sign-up' | 'sign-in';
  step: 'contact' | 'code';
  channel: OtpChannel;
  onChannelChange: (channel: OtpChannel) => void;
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  code: string;
  onCodeChange: (value: string) => void;
  editable: boolean;
  onChangeContact?: () => void;
  onResendCode?: () => void | Promise<void>;
  /** When false (clinic signup), hide first/last name fields. Default true. */
  showPersonName?: boolean;
};

export function WorkerOtpAuthForm({
  mode,
  step,
  channel,
  onChannelChange,
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  code,
  onCodeChange,
  editable,
  onChangeContact,
  onResendCode,
  showPersonName = true,
}: WorkerOtpAuthFormProps) {
  const [resendCooldown, setResendCooldown] = useState(OTP_RESEND_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (step !== 'code') {
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      setIsResending(false);
      return;
    }
    setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
  }, [step, channel]);

  useEffect(() => {
    if (step !== 'code' || resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, resendCooldown]);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: {
      gap: spacing.md,
    },
    channelRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    channelChip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      ...webPointer(),
    },
    channelChipActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}14`,
    },
    channelChipLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
    },
    channelChipLabelActive: {
      color: colors.primary,
    },
    hint: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
    codeActions: {
      gap: spacing.xs,
    },
    changeContact: {
      alignSelf: 'flex-start' as const,
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    changeContactHovered: webTextLinkHoverStyles(colors),
    changeContactLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    resendDisabledLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
    },
  }));

  if (step === 'code') {
    const destination = channel === 'email' ? email.trim() : formatPhoneNumber(phone);
    const canResend = Boolean(onResendCode) && editable && !isResending && resendCooldown <= 0;
    const resendLabel = isResending
      ? 'Sending…'
      : resendCooldown > 0
        ? `Resend code in ${resendCooldown}s`
        : 'Resend code';

    return (
      <View style={styles.form}>
        <Text style={styles.hint}>Enter the code we sent to {destination}.</Text>
        <AuthField
          label="Verification code"
          placeholder="6-digit code"
          keyboardType="number-pad"
          value={code}
          onChangeText={onCodeChange}
          editable={editable}
        />
        <View style={styles.codeActions}>
          {onResendCode ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canResend }}
              disabled={!canResend}
              onPress={() => {
                void (async () => {
                  if (!canResend || !onResendCode) return;
                  setIsResending(true);
                  try {
                    await onResendCode();
                    setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
                  } finally {
                    setIsResending(false);
                  }
                })();
              }}
              style={({ pressed, hovered }) => [
                styles.changeContact,
                canResend && webHover(hovered, pressed, styles.changeContactHovered),
                pressed && canResend && { opacity: 0.75 },
              ]}>
              <Text
                style={canResend ? styles.changeContactLabel : styles.resendDisabledLabel}>
                {resendLabel}
              </Text>
            </Pressable>
          ) : null}
          {onChangeContact ? (
            <Pressable
              accessibilityRole="button"
              onPress={onChangeContact}
              style={({ pressed, hovered }) => [
                styles.changeContact,
                webHover(hovered, pressed, styles.changeContactHovered),
                pressed && { opacity: 0.75 },
              ]}>
              <Text style={styles.changeContactLabel}>Use a different {channel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      {mode === 'sign-up' && showPersonName ? (
        <>
          <AuthField
            label="First name"
            placeholder="First name"
            autoCapitalize="words"
            autoComplete="given-name"
            value={firstName}
            onChangeText={onFirstNameChange}
            editable={editable}
          />
          <AuthField
            label="Last name"
            placeholder="Last name"
            autoCapitalize="words"
            autoComplete="family-name"
            value={lastName}
            onChangeText={onLastNameChange}
            editable={editable}
          />
        </>
      ) : null}

      <View style={styles.channelRow}>
        {(
          [
            { id: 'phone' as const, label: 'Phone' },
            { id: 'email' as const, label: 'Email' },
          ] as const
        ).map((option) => {
          const active = channel === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChannelChange(option.id)}
              style={({ pressed }) => [
                styles.channelChip,
                active && styles.channelChipActive,
                pressed && { opacity: 0.85 },
              ]}>
              <Text
                style={[styles.channelChipLabel, active && styles.channelChipLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {channel === 'email' ? (
        <AuthField
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={onEmailChange}
          editable={editable}
        />
      ) : (
        <AuthField
          label="Mobile phone"
          placeholder={PHONE_NUMBER_PLACEHOLDER}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(text) => onPhoneChange(formatPhoneNumber(text))}
          editable={editable}
        />
      )}
    </View>
  );
}
