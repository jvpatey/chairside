import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type ClinicLogoAvatarProps = {
  clinicName?: string | null;
  logoUri?: string | null;
  size?: number;
  isLoading?: boolean;
};

function getInitials(name?: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export function ClinicLogoAvatar({
  clinicName,
  logoUri,
  size = 72,
  isLoading = false,
}: ClinicLogoAvatarProps) {
  const initials = getInitials(clinicName);
  const fontSize = Math.round(size * 0.36);

  const styles = useThemedStyles(({ colors }) => ({
    wrap: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: size,
      height: size,
    },
    initials: {
      fontSize,
      fontWeight: '700',
      color: colors.primaryOnPrimary,
      letterSpacing: 0.5,
    },
    loader: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
  }));

  return (
    <View style={styles.wrap}>
      {logoUri ? (
        <Image source={{ uri: logoUri }} style={styles.image} accessibilityLabel="Clinic logo" />
      ) : initials ? (
        <Text style={styles.initials}>{initials}</Text>
      ) : (
        <Ionicons name="business" size={Math.round(size * 0.4)} color="#FFFFFF" />
      )}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}
