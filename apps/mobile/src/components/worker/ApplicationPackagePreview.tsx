import type { WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import {
  formatWorkerAddress,
  formatWorkerEducation,
  formatRoleTypesLabel,
  getSpecialtyLabel,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { fontSemibold, getHeroBandGradient, useTheme, useThemedStyles } from '@/theme';

const SECTION_ICON_SIZE = 30;

type ApplicationPackagePreviewProps = {
  profile: WorkerProfile;
  displayName?: string | null;
  photoUri?: string | null;
  showDefaultNote?: boolean;
};

type PreviewSectionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: ReactNode;
  showDivider?: boolean;
};

function PreviewSection({ icon, title, children, showDivider = false }: PreviewSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    section: {
      gap: spacing.sm,
      paddingTop: showDivider ? spacing.md : 0,
      borderTopWidth: showDivider ? StyleSheet.hairlineWidth : 0,
      borderTopColor: colors.separator,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: SECTION_ICON_SIZE,
      height: SECTION_ICON_SIZE,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
    },
    title: {
      ...typography.label,
      fontFamily: fontSemibold,
      fontSize: 13,
      letterSpacing: 0.35,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      flex: 1,
    },
    bodyRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    iconSpacer: {
      width: SECTION_ICON_SIZE,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
  }));

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.bodyRow}>
        <View style={styles.iconSpacer} />
        <View style={styles.body}>{children}</View>
      </View>
    </View>
  );
}

function PreviewDetailLine({
  label,
  value,
  emptyLabel,
  showDivider = false,
}: {
  label: string;
  value?: string | null;
  emptyLabel: string;
  showDivider?: boolean;
}) {
  const trimmed = value?.trim();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      gap: 4,
      paddingVertical: spacing.sm,
    },
    rowFirst: {
      paddingTop: 0,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    label: {
      fontSize: 11,
      fontFamily: fontSemibold,
      fontWeight: '600',
      letterSpacing: 0.35,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    value: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelPrimary,
    },
    valueEmpty: {
      color: colors.labelTertiary,
      fontStyle: 'italic',
      fontSize: 14,
    },
  }));

  return (
    <View style={[styles.row, showDivider && styles.divider, !showDivider && styles.rowFirst]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, !trimmed && styles.valueEmpty]}>{trimmed || emptyLabel}</Text>
    </View>
  );
}

export function ApplicationPackagePreview({
  profile,
  displayName,
  photoUri,
  showDefaultNote = true,
}: ApplicationPackagePreviewProps) {
  const { colors, isDark } = useTheme();
  const heroGradient = getHeroBandGradient(colors, isDark, 'secondary');

  const styles = useThemedStyles(({ colors, spacing, typography, radii, elevation, isDark }) => ({
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      ...elevation('subtle'),
    },
    heroGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    heroContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg + 6,
      paddingBottom: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    heroEyebrow: {
      fontSize: 11,
      fontFamily: fontSemibold,
      fontWeight: '700',
      letterSpacing: 0.55,
      textTransform: 'uppercase',
      color: colors.secondary,
      marginBottom: spacing.xs,
    },
    heroName: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.labelPrimary,
    },
    heroRole: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.labelPrimary,
    },
    heroMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingTop: spacing.xs,
    },
    heroMeta: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.labelSecondary,
      flexShrink: 1,
    },
    sections: {
      padding: spacing.md,
      gap: spacing.md,
    },
    quoteText: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 23,
      color: colors.labelPrimary,
      fontStyle: 'italic',
    },
    quoteEmpty: {
      color: colors.labelTertiary,
      fontStyle: 'italic',
    },
    documentTitle: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    documentMeta: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    documentEmpty: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelTertiary,
      fontStyle: 'italic',
    },
  }));

  const rolesLabel = formatRoleTypesLabel(getWorkerRoleTypes(profile)) || null;
  const locationLabel = formatWorkerAddress(profile);
  const experienceLabel =
    profile.years_of_experience != null ? `${profile.years_of_experience} years` : null;
  const educationLabel = formatWorkerEducation(profile);
  const softwareLabel = profile.software_used.length > 0 ? profile.software_used.join(', ') : null;
  const specialtiesLabel =
    profile.practice_types.length > 0
      ? profile.practice_types.map(getSpecialtyLabel).join(', ')
      : null;
  const coverNote = profile.default_cover_message?.trim();
  const resumeName = profile.resume_file_name ?? 'PDF attached';

  return (
    <View style={styles.previewCard}>
      <View>
        <LinearGradient
          colors={heroGradient}
          locations={[0, 0.35, 0.65, 0.85, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.heroGradient}
          pointerEvents="none"
        />
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>Candidate</Text>
          <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={72} />
          <Text style={styles.heroName} numberOfLines={2}>
            {displayName?.trim() || 'Your name'}
          </Text>
          <Text style={styles.heroRole} numberOfLines={2}>
            {rolesLabel || 'Add your roles in professional background'}
          </Text>
          <View style={styles.heroMetaRow}>
            <Ionicons name="location-outline" size={15} color={colors.labelSecondary} />
            <Text style={styles.heroMeta} numberOfLines={2}>
              {locationLabel || 'Add your location in professional background'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sections}>
        <PreviewSection icon="ribbon-outline" title="Experience">
          <PreviewDetailLine label="Years" value={experienceLabel} emptyLabel="Not added yet" />
          <PreviewDetailLine
            label="Education"
            value={educationLabel}
            emptyLabel="Not added yet"
            showDivider
          />
          <PreviewDetailLine
            label="Software"
            value={softwareLabel}
            emptyLabel="Not added yet"
            showDivider
          />
          <PreviewDetailLine
            label="Practice types"
            value={specialtiesLabel}
            emptyLabel="Not added yet"
            showDivider
          />
        </PreviewSection>

        {showDefaultNote ? (
          <PreviewSection icon="chatbubble-ellipses-outline" title="Cover note" showDivider>
            <Text style={[styles.quoteText, !coverNote && styles.quoteEmpty]}>
              {coverNote || 'No default note saved yet'}
            </Text>
          </PreviewSection>
        ) : null}

        <PreviewSection icon="document-text-outline" title="Resume" showDivider>
          {profile.resume_storage_path ? (
            <>
              <Text style={styles.documentTitle} numberOfLines={2}>
                {resumeName}
              </Text>
              <Text style={styles.documentMeta}>PDF resume attached</Text>
            </>
          ) : (
            <Text style={styles.documentEmpty}>No resume attached</Text>
          )}
        </PreviewSection>
      </View>
    </View>
  );
}
