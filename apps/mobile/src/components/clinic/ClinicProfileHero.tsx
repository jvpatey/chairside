import type { ClinicProfile } from '@chairside/api';
import { getProvinceLabel, SPECIALTY_OPTIONS } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountTypeBadge } from '@/components/account/AccountTypeBadge';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { getAccountTypeLabel } from '@/lib/profileHubSubtitles';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { getHeroBandGradient, useTheme, useThemedStyles } from '@/theme';

type ClinicProfileHeroProps = {
  email?: string | null;
  profile: ClinicProfile | null;
  editable?: boolean;
};

export function ClinicProfileHero({
  email,
  profile,
  editable = false,
}: ClinicProfileHeroProps) {
  const { colors, isDark } = useTheme();
  const { logoUri, isUploading, pickLogo } = useClinicLogo();
  const name = profile?.clinic_name?.trim() || 'Your practice';
  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === profile?.specialty)?.label ?? null;
  const location = [profile?.city, profile?.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');

  const metaLine =
    specialtyLabel && location
      ? `${specialtyLabel} · ${location}`
      : specialtyLabel ?? location ?? 'Complete your clinic profile to get started';

  const heroGradient = getHeroBandGradient(colors, isDark, 'primary');

  const styles = useThemedStyles(({ colors, spacing, typography, radii, elevation, isDark }) => ({
    card: {
      borderRadius: radii.hero,
      overflow: 'hidden',
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.separator,
      position: 'relative',
      ...elevation('subtle'),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    avatarWrap: {
      marginBottom: spacing.xs,
      position: 'relative' as const,
    },
    editBadge: {
      position: 'absolute' as const,
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    name: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 30,
      textAlign: 'center',
    },
    email: {
      ...typography.subtitle,
      fontSize: 14,
      textAlign: 'center',
    },
    meta: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  }));

  const avatar = (
    <ClinicLogoAvatar
      clinicName={profile?.clinic_name}
      logoUri={logoUri}
      size={72}
      isLoading={isUploading}
    />
  );

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={heroGradient}
        locations={[0, 0.35, 0.65, 0.85, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          {editable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change clinic logo"
              disabled={isUploading}
              onPress={() => void pickLogo()}>
              {avatar}
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={14} color={colors.primaryOnPrimary} />
              </View>
            </Pressable>
          ) : (
            avatar
          )}
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        {email?.trim() ? <Text style={styles.email}>{email.trim()}</Text> : null}
        <Text style={styles.meta}>{metaLine}</Text>
        <AccountTypeBadge label={getAccountTypeLabel('clinic')} />
      </View>
    </View>
  );
}
