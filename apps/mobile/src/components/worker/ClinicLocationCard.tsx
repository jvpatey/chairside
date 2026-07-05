import type { PublicClinicProfile } from '@chairside/api';
import { getSpecialtyLabel } from '@chairside/config';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ActionMenuSheet } from '@/components/ui/ActionMenuSheet';
import { ClinicLocationMapCallout } from '@/components/worker/ClinicLocationMapCallout';
import { ClinicLocationMapPreview } from '@/components/worker/ClinicLocationMapPreview';
import {
  FieldBlock,
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
import { useTheme, useThemedStyles } from '@/theme';

type ClinicLocationCardProps = {
  profile: Pick<
    PublicClinicProfile,
    | 'clinic_name'
    | 'specialty'
    | 'address_line1'
    | 'address_line2'
    | 'city'
    | 'province'
    | 'postal_code'
    | 'latitude'
    | 'longitude'
  >;
  stepNumber?: number;
  stepAccent?: 'primary' | 'secondary';
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

export function ClinicLocationCard({
  profile,
  stepNumber,
  stepAccent = 'primary',
}: ClinicLocationCardProps) {
  const { colors, isDark } = useTheme();
  const [directionsSheetVisible, setDirectionsSheetVisible] = useState(false);
  const [calloutVisible, setCalloutVisible] = useState(false);
  const formattedAddress = formatPublicClinicAddress(profile);
  const addressLine = formatPublicClinicAddressLine(profile);
  const specialtyLabel = getSpecialtyLabel(profile.specialty);
  const hasCoordinates = hasMappablePublicClinicCoordinates(profile);
  const destination = buildMapsDestination(profile, addressLine);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    address: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelPrimary,
    },
    mapShell: {
      marginTop: spacing.sm,
      position: 'relative',
      borderRadius: 12,
    },
    mapTapTarget: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 12,
    },
    calloutOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      padding: spacing.sm,
      pointerEvents: 'box-none',
    },
    directionsButton: {
      marginTop: spacing.sm,
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

  const handleDirectionsPress = () => {
    setCalloutVisible(false);

    if (showBothLinks) {
      setDirectionsSheetVisible(true);
      return;
    }

    handleOpenMaps('native');
  };

  const directionsActions = [
    ...(showApple
      ? [
          {
            label: 'Apple Maps',
            icon: (
              <Ionicons
                name="logo-apple"
                size={20}
                color={isDark ? colors.labelPrimary : '#000000'}
              />
            ),
            onPress: () => handleOpenMaps('apple'),
          },
        ]
      : []),
    ...(showGoogle
      ? [
          {
            label: 'Google Maps',
            icon: <AntDesign name="google" size={20} color="#4285F4" />,
            onPress: () => handleOpenMaps('google'),
          },
        ]
      : []),
  ];

  const panel = (
    <SectionPanel
      icon="location-outline"
      stepNumber={stepNumber}
      stepAccent={stepAccent}
      title="Location">
      {formattedAddress ? (
        <FieldBlock label="Address">
          <Text style={styles.address}>{formattedAddress}</Text>
        </FieldBlock>
      ) : null}

      {hasCoordinates ? (
        <View style={styles.mapShell}>
          <ClinicLocationMapPreview
            latitude={profile.latitude!}
            longitude={profile.longitude!}
            selected={calloutVisible}
          />
          {calloutVisible ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hide clinic location details"
                onPress={() => setCalloutVisible(false)}
                style={styles.mapTapTarget}
              />
              <View style={styles.calloutOverlay}>
                <ClinicLocationMapCallout
                  clinicName={profile.clinic_name}
                  address={addressLine}
                  specialtyLabel={specialtyLabel}
                  onGetDirections={handleDirectionsPress}
                />
              </View>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show clinic location details"
              onPress={() => setCalloutVisible(true)}
              style={styles.mapTapTarget}
            />
          )}
        </View>
      ) : null}

      <View style={styles.directionsButton}>
        <OnboardingButton
          label="Get directions"
          variant="secondary"
          onPress={handleDirectionsPress}
        />
      </View>
    </SectionPanel>
  );

  return (
    <>
      {panel}

      <ActionMenuSheet
        visible={directionsSheetVisible}
        title="Get directions"
        message={
          Platform.OS === 'web'
            ? 'Choose which maps app to open.'
            : undefined
        }
        actions={directionsActions}
        onClose={() => setDirectionsSheetVisible(false)}
      />
    </>
  );
}
