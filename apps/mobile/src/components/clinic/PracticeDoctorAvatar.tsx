import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type PracticeDoctorAvatarProps = {
  name: string;
  photoUri?: string | null;
  size?: number;
  isLoading?: boolean;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export function PracticeDoctorAvatar({
  name,
  photoUri,
  size = 44,
  isLoading = false,
}: PracticeDoctorAvatarProps) {
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.34);

  const styles = useThemedStyles(({ colors }) => ({
    wrap: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
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
      color: colors.labelSecondary,
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
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.image} accessibilityLabel={`${name} photo`} />
      ) : initials ? (
        <Text style={styles.initials}>{initials}</Text>
      ) : (
        <Ionicons name="person" size={Math.round(size * 0.42)} color="#8E8E93" />
      )}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}
