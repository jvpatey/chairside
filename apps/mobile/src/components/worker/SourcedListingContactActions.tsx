import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { copyToClipboard } from '@/lib/copyToClipboard';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

export type SourcedListingContact = {
  contact_phone?: string | null;
  contact_email?: string | null;
  external_url?: string | null;
};

export type SourcedContactSections = 'rows' | 'buttons' | 'all';

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

function ContactChannelRow({
  icon,
  label,
  value,
  accessibilityLabel,
  onPress,
  onCopied,
  density = 'default',
}: {
  icon: 'call-outline' | 'mail-outline';
  label: string;
  value: string;
  accessibilityLabel: string;
  onPress: () => void;
  onCopied?: () => void;
  /** inline = quiet icon + value for companion document layout. */
  density?: 'default' | 'inline';
}) {
  const { colors } = useTheme();
  const inline = density === 'inline';
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      position: 'relative' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: inline ? spacing.sm : spacing.md,
      minHeight: inline ? 44 : 56,
      paddingVertical: inline ? spacing.xs : spacing.sm,
      borderRadius: inline ? 0 : 10,
      overflow: 'hidden' as const,
    },
    iconWrap: {
      width: inline ? 22 : 40,
      height: inline ? 22 : 40,
      borderRadius: inline ? 0 : 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: inline ? 'transparent' : colors.primarySubtle,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: inline ? 0 : 2,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
      color: colors.labelTertiary,
    },
    value: {
      fontSize: inline ? 15 : 16,
      lineHeight: inline ? 20 : 22,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
  }));

  return (
    // Tap target is a sibling overlay (not a parent) so web never nests <button> in <button>
    // with the copy control.
    <View
      style={styles.row}
      {...PH_NO_CAPTURE}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed, hovered }) => [
          StyleSheet.absoluteFill,
          webPointer(),
          webHover(hovered, pressed, webListRowHoverStyles(colors)),
          pressed && { opacity: 0.92 },
          { zIndex: 0 },
        ]}
      />
      <View style={styles.iconWrap} pointerEvents="none">
        <Ionicons
          name={icon}
          size={18}
          color={inline ? colors.labelSecondary : colors.primary}
        />
      </View>
      <View style={styles.textBlock} pointerEvents="none">
        {inline ? null : <Text style={styles.label}>{label}</Text>}
        <Text style={styles.value} numberOfLines={2}>
          {value}
        </Text>
      </View>
      <View style={{ zIndex: 1 }}>
        <CopyIconButton
          value={value}
          accessibilityLabel={`Copy ${label.toLowerCase()}`}
          onCopied={onCopied}
        />
      </View>
    </View>
  );
}

/** True when phone or email is present (rows card should render). */
export function hasSourcedContactChannels(contact: SourcedListingContact): boolean {
  return Boolean(contact.contact_phone?.trim() || contact.contact_email?.trim());
}

export function SourcedListingContactActions({
  contact,
  compact = false,
  revealBeforeShow = false,
  sections = 'all',
  density = 'default',
  onContactTap,
  onContactReveal,
  onContactCopy,
}: {
  contact: SourcedListingContact;
  compact?: boolean;
  /** When true, hide phone/email until the user taps Show (public listing / PostHog). */
  revealBeforeShow?: boolean;
  /** rows = body card; buttons = footer CTAs; all = public sticky footer. */
  sections?: SourcedContactSections;
  /** inline = quiet icon rows for companion document layout. */
  density?: 'default' | 'inline';
  onContactTap?: (method: ContactMethod) => void;
  onContactReveal?: (method: 'phone' | 'email') => void;
  onContactCopy?: (method: 'phone' | 'email') => void;
}) {
  const inline = density === 'inline';
  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      gap: spacing.md,
    },
    details: {
      gap: 0,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      opacity: inline ? 0.5 : 0.6,
      marginLeft: inline ? 30 : 56,
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

  const showRows = sections === 'rows' || sections === 'all';
  const showButtons = sections === 'buttons' || sections === 'all';

  const rowsContent =
    showRows && (showPhoneValue || showEmailValue) ? (
      <View style={styles.details}>
        {showPhoneValue && phone ? (
          <ContactChannelRow
            icon="call-outline"
            label="Phone"
            value={phone}
            accessibilityLabel="Call clinic"
            onPress={openPhone}
            onCopied={() => onContactCopy?.('phone')}
            density={density}
          />
        ) : null}
        {showPhoneValue && showEmailValue ? <View style={styles.rowDivider} /> : null}
        {showEmailValue && email ? (
          <ContactChannelRow
            icon="mail-outline"
            label="Email"
            value={email}
            accessibilityLabel="Email clinic"
            onPress={openEmail}
            onCopied={() => onContactCopy?.('email')}
            density={density}
          />
        ) : null}
      </View>
    ) : null;

  const hasButtonContent =
    showPhoneRevealCta ||
    showPhoneValue ||
    showEmailRevealCta ||
    showEmailValue ||
    Boolean(url);

  const buttonsContent =
    showButtons && hasButtonContent ? (
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
    ) : null;

  if (!rowsContent && !buttonsContent) return null;

  return (
    <View style={styles.wrap}>
      {rowsContent}
      {buttonsContent}
    </View>
  );
}
