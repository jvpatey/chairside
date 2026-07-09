import type { ClinicProfile } from '@chairside/api';
import type { ClinicPlan } from '@chairside/config';
import { getProvinceLabel, SPECIALTY_OPTIONS } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountTypeBadge } from '@/components/account/AccountTypeBadge';
import { PlanTierBadge } from '@/components/billing/PlanTierBadge';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { getAccountTypeLabel } from '@/lib/profileHubSubtitles';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { getHeroBandGradient, useTheme, useThemedStyles } from '@/theme';

export type ClinicIdentityHeroCardProps = {
  clinicName: string;
  logoUri?: string | null;
  specialtyLabel: string | null;
  locationLabel: string | null;
  email?: string | null;
  editable?: boolean;
  isUploading?: boolean;
  onPickLogo?: () => void;
  showAccountBadge?: boolean;
  plan?: ClinicPlan | null;
  emptyMetaFallback?: string;
};

export function ClinicIdentityHeroCard({
  clinicName,
  logoUri,
  specialtyLabel,
  locationLabel,
  email,
  editable = false,
  isUploading = false,
  onPickLogo,
  showAccountBadge = false,
  plan,
  emptyMetaFallback,
}: ClinicIdentityHeroCardProps) {
  const { colors, isDark } = useTheme();
  const heroGradient = getHeroBandGradient(colors, isDark, 'primary');

  const metaLine =
    specialtyLabel && locationLabel
      ? `${specialtyLabel} · ${locationLabel}`
      : specialtyLabel ?? locationLabel ?? emptyMetaFallback ?? null;

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
    badgeRow: {
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
  }));

  const avatar = (
    <ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={72} isLoading={isUploading} />
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
              onPress={onPickLogo}>
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
          {clinicName}
        </Text>
        {email?.trim() ? <Text style={styles.email}>{email.trim()}</Text> : null}
        {metaLine ? <Text style={styles.meta}>{metaLine}</Text> : null}
        {showAccountBadge || plan ? (
          <View style={styles.badgeRow}>
            <BadgeRow>
              {showAccountBadge ? (
                <AccountTypeBadge label={getAccountTypeLabel('clinic')} inRow />
              ) : null}
              {plan ? <PlanTierBadge plan={plan} size="sm" /> : null}
            </BadgeRow>
          </View>
        ) : null}
      </View>
    </View>
  );
}

type ClinicProfileHeroProps = {
  email?: string | null;
  profile: ClinicProfile | null;
  editable?: boolean;
  plan?: ClinicPlan | null;
};

export function ClinicProfileHero({
  email,
  profile,
  editable = false,
  plan,
}: ClinicProfileHeroProps) {
  const { logoUri, isUploading, pickLogo } = useClinicLogo();
  const name = profile?.clinic_name?.trim() || 'Your practice';
  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === profile?.specialty)?.label ?? null;
  const locationLabel = [profile?.city, profile?.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');

  return (
    <ClinicIdentityHeroCard
      clinicName={name}
      logoUri={logoUri}
      specialtyLabel={specialtyLabel}
      locationLabel={locationLabel || null}
      email={email}
      editable={editable}
      isUploading={isUploading}
      onPickLogo={() => void pickLogo()}
      showAccountBadge
      plan={plan}
      emptyMetaFallback="Complete your clinic profile to get started"
    />
  );
}
