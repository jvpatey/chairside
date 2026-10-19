import { Linking, View } from 'react-native';

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

export function SourcedListingContactActions({
  contact,
  compact = false,
}: {
  contact: SourcedListingContact;
  compact?: boolean;
}) {
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      gap: spacing.sm,
    },
  }));

  const phone = contact.contact_phone?.trim() || null;
  const email = contact.contact_email?.trim() || null;
  const url = contact.external_url?.trim() || null;

  if (!phone && !email && !url) return null;

  return (
    <View style={styles.row}>
      {phone ? (
        <OnboardingButton
          label={compact ? 'Call' : 'Call clinic'}
          onPress={() => void Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`)}
        />
      ) : null}
      {email ? (
        <OnboardingButton
          label={compact ? 'Email' : 'Email clinic'}
          variant="secondary"
          onPress={() => void Linking.openURL(`mailto:${email}`)}
        />
      ) : null}
      {url ? (
        <OnboardingButton
          label={compact ? 'Open link' : 'Open listing'}
          variant="secondary"
          onPress={() => void Linking.openURL(normalizeExternalUrl(url))}
        />
      ) : null}
    </View>
  );
}
