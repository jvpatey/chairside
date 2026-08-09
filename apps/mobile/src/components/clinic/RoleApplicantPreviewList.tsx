import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { JobApplicantPreview } from '@/lib/dashboardAttention';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { cardShellRadii } from '@/components/ui/cardLayout';
import {
  webHover,
  webOnlyStyle,
  webPointer,
} from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';
import { radii } from '@/theme/tokens';

const ROW_MIN_HEIGHT = 48;
const LIST_MAX_HEIGHT = ROW_MIN_HEIGHT * 3 + 2;

type RoleApplicantPreviewListProps = {
  applicants: JobApplicantPreview[];
  onApplicantPress: (applicationId: string) => void;
};

function ApplicantPreviewRow({
  applicant,
  onPress,
}: {
  applicant: JobApplicantPreview;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const photoUri = useWorkerPhotoUri(applicant.photoPath);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: ROW_MIN_HEIGHT,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.sm,
      ...webPointer(),
      ...webOnlyStyle({
        transitionProperty: 'background-color, box-shadow',
        transitionDuration: '140ms',
      } as const),
    },
    name: {
      flex: 1,
      minWidth: 0,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    chevron: {
      flexShrink: 0,
      opacity: 0.45,
    },
    rowHovered: {
      backgroundColor: colors.surface,
      ...webOnlyStyle({
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      } as const),
    },
    rowPressed: {
      backgroundColor: colors.surface,
      opacity: 0.92,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Review ${applicant.name}`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, styles.rowHovered),
        pressed && styles.rowPressed,
      ]}>
      <WorkerProfileAvatar displayName={applicant.name} photoUri={photoUri} size={32} />
      <Text style={styles.name} numberOfLines={1}>
        {applicant.name}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} style={styles.chevron} />
    </Pressable>
  );
}

/** Scrollable applicant rows for dashboard role cards. */
export function RoleApplicantPreviewList({
  applicants,
  onApplicantPress,
}: RoleApplicantPreviewListProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      backgroundColor: colors.fillSubtle,
      borderRadius: cardShellRadii.inner,
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    headerLabel: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    scroll: {
      maxHeight: applicants.length > 3 ? LIST_MAX_HEIGHT : undefined,
    },
    scrollContent: {
      padding: spacing.xs,
      gap: spacing.xs,
    },
  }));

  if (applicants.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Applicants</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator={applicants.length > 3}>
        {applicants.map((applicant) => (
          <ApplicantPreviewRow
            key={applicant.id}
            applicant={applicant}
            onPress={() => onApplicantPress(applicant.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
