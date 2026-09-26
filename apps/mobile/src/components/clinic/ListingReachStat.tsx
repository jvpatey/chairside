import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

export function formatListingViewCountLabel(count: number): string {
  if (count <= 0) return 'No views yet';
  return count === 1 ? '1 view' : `${count.toLocaleString()} views`;
}

export function formatListingViewCountShort(count: number): string {
  if (count <= 0) return '0 views';
  return count === 1 ? '1 view' : `${count.toLocaleString()} views`;
}

type ListingReachStatProps = {
  viewCount: number;
  /** Hide entirely when zero (list cards). Detail screens use soft empty copy. */
  hideWhenZero?: boolean;
  /** Softer empty-state copy for detail ("No views yet"). */
  showEmptyLabel?: boolean;
  size?: 'sm' | 'md';
};

/** Compact eye + label chip for clinic listing reach. */
export function ListingReachStat({
  viewCount,
  hideWhenZero = false,
  showEmptyLabel = false,
  size = 'md',
}: ListingReachStatProps) {
  const { colors } = useTheme();
  const isEmpty = viewCount <= 0;
  if (isEmpty && hideWhenZero) return null;

  const label = isEmpty
    ? showEmptyLabel
      ? 'No views yet'
      : formatListingViewCountShort(0)
    : formatListingViewCountShort(viewCount);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      paddingVertical: size === 'sm' ? 2 : 4,
      paddingHorizontal: size === 'sm' ? 8 : 10,
      borderRadius: 999,
      backgroundColor: isEmpty ? colors.fillSubtle : colors.backgroundGrouped,
    },
    label: {
      fontFamily: fontSemibold,
      fontSize: size === 'sm' ? 12 : 13,
      lineHeight: size === 'sm' ? 16 : 18,
      color: isEmpty ? colors.labelTertiary : colors.labelSecondary,
      letterSpacing: -0.1,
    },
  }));

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={formatListingViewCountLabel(viewCount)}>
      <Ionicons
        name="eye-outline"
        size={size === 'sm' ? 13 : 15}
        color={isEmpty ? colors.labelTertiary : colors.labelSecondary}
      />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

type PostEngagementStripProps = {
  viewCount: number;
  applicantCount?: number;
  applicantNoun?: 'applicant' | 'request';
};

/** Detail-hero engagement row: views · applicants. */
export function PostEngagementStrip({
  viewCount,
  applicantCount,
  applicantNoun = 'applicant',
}: PostEngagementStripProps) {
  const { colors } = useTheme();
  const showApplicants = typeof applicantCount === 'number';
  const applicantLabel =
    applicantCount === 1
      ? `1 ${applicantNoun}`
      : `${(applicantCount ?? 0).toLocaleString()} ${applicantNoun}s`;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    label: {
      fontFamily: fontSemibold,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      letterSpacing: -0.1,
    },
    muted: {
      color: colors.labelTertiary,
    },
    divider: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.separator,
    },
  }));

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={[
        formatListingViewCountLabel(viewCount),
        showApplicants ? applicantLabel : null,
      ]
        .filter(Boolean)
        .join(', ')}>
      <View style={styles.item}>
        <Ionicons
          name="eye-outline"
          size={15}
          color={viewCount > 0 ? colors.labelSecondary : colors.labelTertiary}
        />
        <Text style={[styles.label, viewCount <= 0 && styles.muted]}>
          {viewCount > 0 ? formatListingViewCountShort(viewCount) : 'No views yet'}
        </Text>
      </View>
      {showApplicants ? (
        <>
          <View style={styles.divider} />
          <View style={styles.item}>
            <Ionicons
              name="people-outline"
              size={15}
              color={applicantCount && applicantCount > 0 ? colors.labelSecondary : colors.labelTertiary}
            />
            <Text style={[styles.label, !(applicantCount && applicantCount > 0) && styles.muted]}>
              {applicantLabel}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}
