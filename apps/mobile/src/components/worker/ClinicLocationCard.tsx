import type { PublicClinicProfile } from '@chairside/api';
import { Platform, Pressable, Text, View } from 'react-native';

import { ClinicLocationMapPreview } from '@/components/worker/ClinicLocationMapPreview';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  FieldBlock,
  ProfileDetailStack,
  SectionPanel,
} from '@/components/profile/ProfileDetailBlocks';
import {
  formatPublicClinicAddress,
  formatPublicClinicAddressLine,
  hasMappablePublicClinicCoordinates,
} from '@/lib/clinicAddress';
import {
  openMapsDirections,
  shouldShowAppleMapsLink,
  shouldShowGoogleMapsLink,
  type MapsDestination,
} from '@/lib/mapsDirections';
import { useThemedStyles } from '@/theme';

type ClinicLocationCardProps = {
  profile: Pick<
    PublicClinicProfile,
    | 'address_line1'
    | 'address_line2'
    | 'city'
    | 'province'
    | 'postal_code'
    | 'latitude'
    | 'longitude'
  >;
};

function buildMapsDestination(
  profile: ClinicLocationCardProps['profile'],
  addressLine: string | null,
): MapsDestination {
  return {
    latitude: profile.latitude,
    longitude: profile.longitude,
    label: addressLine,
  };
}

export function ClinicLocationCard({ profile }: ClinicLocationCardProps) {
  const formattedAddress = formatPublicClinicAddress(profile);
  const addressLine = formatPublicClinicAddressLine(profile);
  const hasCoordinates = hasMappablePublicClinicCoordinates(profile);
  const destination = buildMapsDestination(profile, addressLine);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    address: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelPrimary,
    },
    mapWrap: {
      marginTop: spacing.sm,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionCell: {
      flex: 1,
      minWidth: 0,
    },
  }));

  if (!formattedAddress && !hasCoordinates) {
    return null;
  }

  const handleOpenMaps = (provider: 'apple' | 'google' | 'native') => {
    void openMapsDirections(destination, provider);
  };

  const showApple = shouldShowAppleMapsLink();
  const showGoogle = shouldShowGoogleMapsLink();
  const showBothLinks = showApple && showGoogle;

  return (
    <ProfileDetailStack>
      <SectionPanel icon="location-outline" title="Location">
        {formattedAddress ? (
          <FieldBlock label="Address">
            <Text style={styles.address}>{formattedAddress}</Text>
          </FieldBlock>
        ) : null}

        {hasCoordinates ? (
          <View style={styles.mapWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open directions in maps"
              onPress={() => handleOpenMaps('native')}>
              <ClinicLocationMapPreview
                latitude={profile.latitude!}
                longitude={profile.longitude!}
              />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.actions}>
          {showBothLinks ? (
            <View style={styles.actionRow}>
              {showApple ? (
                <View style={styles.actionCell}>
                  <OnboardingButton
                    label="Apple Maps"
                    variant="secondary"
                    onPress={() => handleOpenMaps('apple')}
                  />
                </View>
              ) : null}
              {showGoogle ? (
                <View style={styles.actionCell}>
                  <OnboardingButton
                    label="Google Maps"
                    variant="secondary"
                    onPress={() => handleOpenMaps('google')}
                  />
                </View>
              ) : null}
            </View>
          ) : (
            <OnboardingButton
              label={Platform.OS === 'ios' ? 'Open in Apple Maps' : 'Open in Google Maps'}
              variant="secondary"
              onPress={() => handleOpenMaps('native')}
            />
          )}
        </View>
      </SectionPanel>
    </ProfileDetailStack>
  );
}
