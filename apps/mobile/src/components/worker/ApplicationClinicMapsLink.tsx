import AntDesign from '@expo/vector-icons/AntDesign';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, Text } from 'react-native';

import { ActionMenuSheet } from '@/components/ui/ActionMenuSheet';
import {
  openMapsDirections,
  shouldShowAppleMapsLink,
  shouldShowGoogleMapsLink,
  type MapsDestination,
} from '@/lib/mapsDirections';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ApplicationClinicMapsLinkProps = {
  destination: MapsDestination;
  label: string;
};

export function ApplicationClinicMapsLink({
  destination,
  label,
}: ApplicationClinicMapsLinkProps) {
  const { colors, isDark } = useTheme();
  const [directionsSheetVisible, setDirectionsSheetVisible] = useState(false);

  const styles = useThemedStyles(({ colors }) => ({
    linkPressable: {
      alignSelf: 'flex-start',
      borderRadius: 8,
      ...webPointer(),
    },
    linkHovered: webTextLinkHoverStyles(colors),
    link: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.primary,
      fontWeight: '600',
    },
  }));

  const showApple = shouldShowAppleMapsLink();
  const showGoogle = shouldShowGoogleMapsLink();
  const showBothLinks = showApple && showGoogle;

  const handleOpenMaps = (provider: 'apple' | 'google' | 'native') => {
    void openMapsDirections(destination, provider);
  };

  const handlePress = () => {
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

  return (
    <>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Open clinic location in maps: ${label}`}
        onPress={handlePress}
        style={({ pressed, hovered }) => [
          styles.linkPressable,
          webHover(hovered, pressed, styles.linkHovered),
          pressed && { opacity: 0.75 },
        ]}>
        <Text style={styles.link}>{label}</Text>
      </Pressable>

      <ActionMenuSheet
        visible={directionsSheetVisible}
        title="Open in maps"
        message={Platform.OS === 'web' ? 'Choose which maps app to open.' : undefined}
        actions={directionsActions}
        onClose={() => setDirectionsSheetVisible(false)}
      />
    </>
  );
}
