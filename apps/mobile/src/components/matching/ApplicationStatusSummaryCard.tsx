import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import {
  getApplicationStatusSummary,
  type ApplicationStatusSummaryAudience,
  type ApplicationStatusSummaryInput,
} from '@/lib/applicationStatusSummary';
import { fontSemibold, getHeroBandGradient, useTheme, useThemedStyles } from '@/theme';

type ApplicationStatusSummaryCardProps = ApplicationStatusSummaryInput & {
  audience: ApplicationStatusSummaryAudience;
  isHighlighted?: boolean;
};

export function ApplicationStatusSummaryCard({
  audience,
  isHighlighted = false,
  status,
  postType,
  applicationKitRequestedAt,
  applicationKitSubmittedAt,
  interviewProposedAt,
  statusNote,
  statusClosedBy,
  workerAccountDeleted,
  clinicAccountDeleted,
}: ApplicationStatusSummaryCardProps) {
  const { colors, isDark } = useTheme();
  const summary = getApplicationStatusSummary(
    {
      status,
      postType,
      applicationKitRequestedAt,
      applicationKitSubmittedAt,
      interviewProposedAt,
      statusNote,
      statusClosedBy,
      workerAccountDeleted,
      clinicAccountDeleted,
    },
    audience,
    { isHighlighted },
  );

  const gradientColors = getHeroBandGradient(colors, isDark, 'primary');

  const styles = useThemedStyles(({ colors, spacing, typography, radii, elevation, isDark }) => ({
    card: {
      borderRadius: radii.lg,
      overflow: 'hidden',
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      ...elevation('subtle'),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 30,
      height: 30,
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
    headline: {
      ...typography.body,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    body: {
      gap: spacing.xs,
    },
    description: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 21,
      color: colors.labelPrimary,
    },
    nextStep: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 21,
      color: colors.labelSecondary,
    },
  }));

  if (!summary) return null;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.35, 0.65, 0.85, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="pulse-outline" size={16} color={colors.primary} />
          </View>
          <Text style={styles.title}>Application status</Text>
        </View>
        <Text style={styles.headline}>{summary.headline}</Text>
        <View style={styles.body}>
          <Text style={styles.description}>{summary.description}</Text>
          {summary.nextStep ? <Text style={styles.nextStep}>{summary.nextStep}</Text> : null}
        </View>
      </View>
    </View>
  );
}
