import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { copyToClipboard } from '@/lib/copyToClipboard';
import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

export type SourcedListingContact = {
  contact_phone?: string | null;
  contact_email?: string | null;
  external_url?: string | null;
};

type ContactMethod = 'phone' | 'email' | 'url';

const COPIED_FEEDBACK_MS = 1500;

/** PostHog session replay ignores nodes with this class on web. */
const PH_NO_CAPTURE =
  Platform.OS === 'web' ? ({ className: 'ph-no-capture' } as const) : undefined;

function normalizeExternalUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizePhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function normalizeMailtoHref(email: string): string {
  const trimmed = email.trim();
  return `mailto:${trimmed}`;
}

async function openExternalHref(href: string): Promise<void> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    // RN Web's Linking.openURL often no-ops for mailto:/tel: — use a real anchor click.
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return;
  }
  await Linking.openURL(href);
}

function CopyIconButton({
  value,
  accessibilityLabel,
  onCopied,
}: {
  value: string;
  accessibilityLabel: string;
  onCopied?: () => void;
}) {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    button: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginLeft: spacing.xs,
    },
    copiedLabel: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.tertiary,
    },
  }));

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(() => {
    void copyToClipboard(value).then(() => {
      onCopied?.();
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    });
  }, [onCopied, value]);

  return (
    <Pressable
      onPress={handleCopy}
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied' : accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [styles.button, webPointer(), pressed && { opacity: 0.7 }]}>
      {copied ? (
        <Text style={styles.copiedLabel}>Copied</Text>
      ) : (
        <Ionicons name="copy-outline" size={18} color={colors.primary} />
      )}
    </Pressable>
  );
}

export function SourcedListingContactActions({
  contact,
  compact = false,
  revealBeforeShow = false,
  onContactTap,
  onContactReveal,
  onContactCopy,
}: {
  contact: SourcedListingContact;
  compact?: boolean;
  /** When true, hide phone/email until the user taps Show (public listing / PostHog). */
  revealBeforeShow?: boolean;
  onContactTap?: (method: ContactMethod) => void;
  onContactReveal?: (method: 'phone' | 'email') => void;
  onContactCopy?: (method: 'phone' | 'email') => void;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.md,
    },
    details: {
      gap: spacing.sm,
    },
    detailRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    detailLabel: {
      ...typography.label,
      fontSize: 13,
      color: colors.labelSecondary,
      minWidth: 52,
    },
    valueRow: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flexWrap: 'wrap' as const,
      minWidth: 0,
    },
    detailValue: {
      ...typography.body,
      fontSize: 16,
      color: colors.primary,
      textDecorationLine: 'underline' as const,
      flexShrink: 1,
    },
    buttons: {
      gap: spacing.sm,
    },
  }));

  const phone = contact.contact_phone?.trim() || null;
  const email = contact.contact_email?.trim() || null;
  const url = contact.external_url?.trim() || null;

  const [phoneRevealed, setPhoneRevealed] = useState(!revealBeforeShow);
  const [emailRevealed, setEmailRevealed] = useState(!revealBeforeShow);

  if (!phone && !email && !url) return null;

  const openPhone = () => {
    if (!phone) return;
    onContactTap?.('phone');
    void openExternalHref(normalizePhoneHref(phone));
  };

  const openEmail = () => {
    if (!email) return;
    onContactTap?.('email');
    void openExternalHref(normalizeMailtoHref(email));
  };

  const openUrl = () => {
    if (!url) return;
    onContactTap?.('url');
    void openExternalHref(normalizeExternalUrl(url));
  };

  const revealPhone = () => {
    if (!phone || phoneRevealed) return;
    setPhoneRevealed(true);
    onContactReveal?.('phone');
  };

  const revealEmail = () => {
    if (!email || emailRevealed) return;
    setEmailRevealed(true);
    onContactReveal?.('email');
  };

  const showPhoneValue = Boolean(phone && phoneRevealed);
  const showEmailValue = Boolean(email && emailRevealed);
  const showPhoneRevealCta = Boolean(phone && revealBeforeShow && !phoneRevealed);
  const showEmailRevealCta = Boolean(email && revealBeforeShow && !emailRevealed);

  return (
    <View style={styles.wrap}>
      {showPhoneValue || showEmailValue ? (
        <View style={styles.details}>
          {showPhoneValue && phone ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <View style={styles.valueRow} {...PH_NO_CAPTURE}>
                <Pressable
                  onPress={openPhone}
                  accessibilityRole="link"
                  accessibilityLabel="Call clinic"
                  style={webPointer()}>
                  <Text style={styles.detailValue} selectable>
                    {phone}
                  </Text>
                </Pressable>
                <CopyIconButton
                  value={phone}
                  accessibilityLabel="Copy phone number"
                  onCopied={() => onContactCopy?.('phone')}
                />
              </View>
            </View>
          ) : null}
          {showEmailValue && email ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <View style={styles.valueRow} {...PH_NO_CAPTURE}>
                <Pressable
                  onPress={openEmail}
                  accessibilityRole="link"
                  accessibilityLabel="Email clinic"
                  style={webPointer()}>
                  <Text style={styles.detailValue} selectable>
                    {email}
                  </Text>
                </Pressable>
                <CopyIconButton
                  value={email}
                  accessibilityLabel="Copy email address"
                  onCopied={() => onContactCopy?.('email')}
                />
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.buttons}>
        {showPhoneRevealCta ? (
          <OnboardingButton label="Show phone" onPress={revealPhone} />
        ) : null}
        {showPhoneValue ? (
          <OnboardingButton
            label={compact ? 'Call' : 'Call clinic'}
            onPress={openPhone}
          />
        ) : null}
        {showEmailRevealCta ? (
          <OnboardingButton
            label="Show email"
            variant="secondary"
            onPress={revealEmail}
          />
        ) : null}
        {showEmailValue ? (
          <OnboardingButton
            label={compact ? 'Email' : 'Email clinic'}
            variant="secondary"
            onPress={openEmail}
          />
        ) : null}
        {url ? (
          <OnboardingButton
            label={compact ? 'Open link' : 'Open listing'}
            variant="secondary"
            onPress={openUrl}
          />
        ) : null}
      </View>
    </View>
  );
}
