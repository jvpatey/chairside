import type { ClinicProfile } from '@chairside/api';
import type { ClinicPlan } from '@chairside/config';
import { getProvinceLabel, SPECIALTY_OPTIONS } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountTypeBadge } from '@/components/account/AccountTypeBadge';
import { PlanTierBadge } from '@/components/billing/PlanTierBadge';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { getAccountTypeLabel } from '@/lib/profileHubSubtitles';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { getHeroBandGradient, useTheme, useThemedStyles } from '@/theme';

export type ClinicIdentityHeroCardProps = {
  clinicName: string;
  logoUri?: string | null;
  /** When set with avatarKind "person", shows a circular person avatar. */
  personName?: string | null;
  avatarKind?: 'clinic' | 'person';
  specialtyLabel: string | null;
  locationLabel: string | null;
  email?: string | null;
  /** Group chrome: "Name · Owner" / "Name · Manager". */
  identityLine?: string | null;
  /** When true, append identity on the group name line (phone). */
  identityInline?: boolean;
  editable?: boolean;
  isUploading?: boolean;
  onPickLogo?: () => void;
  avatarAccessibilityLabel?: string;
  showAccountBadge?: boolean;
  plan?: ClinicPlan | null;
  emptyMetaFallback?: string;
};

export function ClinicIdentityHeroCard({
  clinicName,
  logoUri,
  personName,
  avatarKind = 'clinic',
  specialtyLabel,
  locationLabel,
  email,
  identityLine,
  identityInline = false,
  editable = false,
  isUploading = false,
  onPickLogo,
  avatarAccessibilityLabel,
  showAccountBadge = false,
  plan,
  emptyMetaFallback,
}: ClinicIdentityHeroCardProps) {
  const { colors, isDark } = useTheme();
  const heroGradient = getHeroBandGradient(colors, isDark, 'primary');
  const trimmedIdentity = identityLine?.trim() || null;

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
    nameIdentity: {
      fontFamily: typography.subtitle.fontFamily,
      fontSize: 16,
      lineHeight: 30,
      fontWeight: '400',
      color: colors.labelSecondary,
    },
    email: {
      ...typography.subtitle,
      fontSize: 14,
      textAlign: 'center',
    },
    identityLine: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      textAlign: 'center',
      color: colors.labelSecondary,
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

  const avatar =
    avatarKind === 'person' ? (
      <WorkerProfileAvatar
        displayName={personName || clinicName}
        photoUri={logoUri}
        size={72}
        isLoading={isUploading}
      />
    ) : (
      <ClinicLogoAvatar
        clinicName={clinicName}
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
              accessibilityLabel={
                avatarAccessibilityLabel ??
                (avatarKind === 'person' ? 'Edit your profile' : 'Change clinic logo')
              }
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
          {identityInline && trimmedIdentity ? (
            <Text style={styles.nameIdentity}>{` · ${trimmedIdentity}`}</Text>
          ) : null}
        </Text>
        {!identityInline && trimmedIdentity ? (
          <Text style={styles.identityLine} numberOfLines={1}>
            {trimmedIdentity}
          </Text>
        ) : null}
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
  /** Overrides clinic_name when set (person name for groups, org name otherwise). */
  displayName?: string | null;
  identityLine?: string | null;
  identityInline?: boolean;
  editable?: boolean;
  plan?: ClinicPlan | null;
  /** Group: show member photo / person avatar instead of org logo. */
  memberPhotoUri?: string | null;
  memberDisplayName?: string | null;
  /** When set, overrides default avatar press (e.g. open Your profile). */
  onAvatarPress?: () => void;
  isUploadingAvatar?: boolean;
  /** Hide specialty/city meta (groups use role · group on identityLine). */
  hideClinicMeta?: boolean;
};

export function ClinicProfileHero({
  email,
  profile,
  displayName,
  identityLine,
  identityInline = false,
  editable = false,
  plan,
  memberPhotoUri,
  memberDisplayName,
  onAvatarPress,
  isUploadingAvatar,
  hideClinicMeta = false,
}: ClinicProfileHeroProps) {
  const { logoUri, isUploading, pickLogo } = useClinicLogo();
  const name =
    displayName?.trim() || profile?.clinic_name?.trim() || 'Your practice';
  const specialtyLabel = hideClinicMeta
    ? null
    : SPECIALTY_OPTIONS.find((item) => item.value === profile?.specialty)?.label ?? null;
  const locationLabel = hideClinicMeta
    ? null
    : [profile?.city, profile?.province ? getProvinceLabel(profile.province) : null]
        .filter(Boolean)
        .join(', ');

  const usePersonAvatar = Boolean(onAvatarPress) || Boolean(memberPhotoUri);
  // In person mode without a member photo, show initials — not the org logo.
  const avatarUri = memberPhotoUri ?? (usePersonAvatar ? null : logoUri);
  const handleAvatarPress = onAvatarPress ?? (() => void pickLogo());

  return (
    <ClinicIdentityHeroCard
      clinicName={name}
      logoUri={avatarUri}
      personName={memberDisplayName || name}
      avatarKind={usePersonAvatar ? 'person' : 'clinic'}
      specialtyLabel={specialtyLabel}
      locationLabel={locationLabel || null}
      email={email}
      identityLine={identityLine}
      identityInline={identityInline}
      editable={editable}
      isUploading={isUploadingAvatar ?? isUploading}
      onPickLogo={handleAvatarPress}
      avatarAccessibilityLabel={
        onAvatarPress
          ? 'Edit your profile'
          : usePersonAvatar
            ? 'Change profile photo'
            : 'Change clinic logo'
      }
      showAccountBadge
      plan={plan}
      emptyMetaFallback={
        hideClinicMeta ? undefined : 'Complete your clinic profile to get started'
      }
    />
  );
}
