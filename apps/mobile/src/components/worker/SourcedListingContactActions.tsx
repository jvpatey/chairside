import { Linking, Platform, Pressable, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useThemedStyles } from '@/theme';

export type SourcedListingContact = {
  contact_phone?: string | null;
  contact_email?: string | null;
  external_url?: string | null;
};

function normalizeExternalUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizePhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function normalizeMailtoHref(email: string): string {
  // Keep @ unescaped; encode only unsafe characters in local/domain parts if needed.
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

export function SourcedListingContactActions({
  contact,
  compact = false,
  onContactTap,
}: {
  contact: SourcedListingContact;
  compact?: boolean;
  onContactTap?: (method: 'phone' | 'email' | 'url') => void;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.md,
    },
    details: {
      gap: spacing.xs,
    },
    detailRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'baseline' as const,
      gap: spacing.xs,
    },
    detailLabel: {
      ...typography.label,
      fontSize: 13,
      color: colors.labelSecondary,
    },
    detailValue: {
      ...typography.body,
      fontSize: 16,
      color: colors.primary,
      textDecorationLine: 'underline' as const,
    },
    buttons: {
      gap: spacing.sm,
    },
  }));

  const phone = contact.contact_phone?.trim() || null;
  const email = contact.contact_email?.trim() || null;
  const url = contact.external_url?.trim() || null;

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

  return (
    <View style={styles.wrap}>
      {phone || email ? (
        <View style={styles.details}>
          {phone ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Pressable onPress={openPhone} accessibilityRole="link" accessibilityLabel={`Call ${phone}`}>
                <Text style={styles.detailValue} selectable>
                  {phone}
                </Text>
              </Pressable>
            </View>
          ) : null}
          {email ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Pressable onPress={openEmail} accessibilityRole="link" accessibilityLabel={`Email ${email}`}>
                <Text style={styles.detailValue} selectable>
                  {email}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.buttons}>
        {phone ? (
          <OnboardingButton
            label={compact ? 'Call' : 'Call clinic'}
            onPress={openPhone}
          />
        ) : null}
        {email ? (
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
