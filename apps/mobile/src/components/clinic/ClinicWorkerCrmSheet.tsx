import {
  formatClinicWorkerCrmFollowUpLabel,
  getClinicWorkerCrmTagLabel,
  hasClinicWorkerCrmContent,
  isClinicWorkerCrmFollowUpDue,
} from '@chairside/config';
import { type ClinicWorkerCrmRecord } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ClinicWorkerCrmSheetBody,
  type ClinicWorkerCrmSheetProps,
} from '@/components/clinic/ClinicWorkerCrmSheetBody';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { PillBadge } from '@/components/ui/PillBadge';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

export type { ClinicWorkerCrmSheetProps };

export function ClinicWorkerCrmSheetBottom(props: ClinicWorkerCrmSheetProps) {
  const insets = useSafeAreaInsets();
  const { visible, onClose } = props;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      maxHeight: '92%',
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.sm,
    },
  }));

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close private notes editor"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ClinicWorkerCrmSheetBody {...props} variant="sheet" />
        </View>
      </View>
    </Modal>
  );
}

export function ClinicWorkerCrmSheet(props: ClinicWorkerCrmSheetProps) {
  if (Platform.OS === 'web') {
    const { ClinicWorkerCrmSheet: WebClinicWorkerCrmSheet } =
      require('./ClinicWorkerCrmSheet.web') as typeof import('./ClinicWorkerCrmSheet.web');
    return <WebClinicWorkerCrmSheet {...props} />;
  }

  return <ClinicWorkerCrmSheetBottom {...props} />;
}

type ClinicWorkerCrmBadgeColors = {
  color: string;
  backgroundColor: string;
  borderColor: string;
};

function getClinicWorkerCrmTagBadgeColors(
  tag: string,
  colors: ReturnType<typeof useTheme>['colors'],
): ClinicWorkerCrmBadgeColors {
  switch (tag) {
    case 'strong_candidate':
      return {
        color: colors.primary,
        backgroundColor: colors.primarySubtle,
        borderColor: colors.primary,
      };
    case 'follow_up_later':
      return {
        color: colors.secondary,
        backgroundColor: colors.secondarySubtle,
        borderColor: colors.secondary,
      };
    case 'worked_here_before':
      return {
        color: colors.labelPrimary,
        backgroundColor: colors.fillSubtle,
        borderColor: colors.separator,
      };
    default:
      return {
        color: colors.labelPrimary,
        backgroundColor: colors.fillSubtle,
        borderColor: colors.separator,
      };
  }
}

function getClinicWorkerCrmFollowUpBadgeColors(
  followUpDue: boolean,
  colors: ReturnType<typeof useTheme>['colors'],
): ClinicWorkerCrmBadgeColors {
  if (followUpDue) {
    return {
      color: colors.destructive,
      backgroundColor: `${colors.destructive}1A`,
      borderColor: colors.destructive,
    };
  }

  return {
    color: colors.primary,
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  };
}

type ClinicWorkerCrmBadgesProps = {
  record: ClinicWorkerCrmRecord | null;
  compact?: boolean;
};

export function ClinicWorkerCrmBadges({ record, compact = false }: ClinicWorkerCrmBadgesProps) {
  const { colors } = useTheme();

  if (!hasClinicWorkerCrmContent(record)) return null;

  const followUpLabel = formatClinicWorkerCrmFollowUpLabel(record?.follow_up_at);
  const followUpDue = isClinicWorkerCrmFollowUpDue(record?.follow_up_at);
  const followUpBadgeColors = followUpLabel
    ? getClinicWorkerCrmFollowUpBadgeColors(followUpDue, colors)
    : null;

  return (
    <BadgeRow>
      {(record?.tags ?? []).map((tag) => {
        const badgeColors = getClinicWorkerCrmTagBadgeColors(tag, colors);
        return (
          <PillBadge
            key={tag}
            label={getClinicWorkerCrmTagLabel(tag)}
            color={badgeColors.color}
            backgroundColor={badgeColors.backgroundColor}
            borderColor={badgeColors.borderColor}
            size={compact ? 'sm' : 'md'}
          />
        );
      })}
      {followUpLabel && followUpBadgeColors ? (
        <PillBadge
          label={followUpLabel}
          color={followUpBadgeColors.color}
          backgroundColor={followUpBadgeColors.backgroundColor}
          borderColor={followUpBadgeColors.borderColor}
          size={compact ? 'sm' : 'md'}
        />
      ) : null}
    </BadgeRow>
  );
}

type ClinicWorkerCrmSectionProps = {
  record: ClinicWorkerCrmRecord | null;
  onEdit: () => void;
};

export function ClinicWorkerCrmSection({ record, onEdit }: ClinicWorkerCrmSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
    },
    title: {
      ...typography.label,
      fontFamily: fontSemibold,
      fontSize: 13,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      flex: 1,
    },
    helper: {
      ...typography.subtitle,
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelTertiary,
      marginTop: spacing.xs,
    },
    notePanel: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      gap: spacing.sm,
      minHeight: 96,
    },
    note: {
      ...typography.body,
      color: colors.labelPrimary,
      lineHeight: 22,
    },
    empty: {
      ...typography.body,
      color: colors.labelTertiary,
      fontStyle: 'italic',
      lineHeight: 22,
    },
    metadata: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    editLink: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const note = record?.note?.trim();
  const hasContent = hasClinicWorkerCrmContent(record);
  const followUpLabel = formatClinicWorkerCrmFollowUpLabel(record?.follow_up_at);
  const followUpDue = isClinicWorkerCrmFollowUpDue(record?.follow_up_at);
  const followUpBadgeColors = followUpLabel
    ? getClinicWorkerCrmFollowUpBadgeColors(followUpDue, colors)
    : null;

  return (
    <>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={15} color={colors.primary} />
        </View>
        <Text style={styles.title}>Private notes</Text>
      </View>
      <Text style={styles.helper}>Visible only to your clinic · not shared with the applicant</Text>

      <View style={styles.notePanel}>
        {(record?.tags ?? []).length > 0 || followUpLabel ? (
          <View style={styles.metadata}>
            {(record?.tags ?? []).map((tag) => {
              const badgeColors = getClinicWorkerCrmTagBadgeColors(tag, colors);
              return (
                <PillBadge
                  key={tag}
                  label={getClinicWorkerCrmTagLabel(tag)}
                  color={badgeColors.color}
                  backgroundColor={badgeColors.backgroundColor}
                  borderColor={badgeColors.borderColor}
                  size="sm"
                />
              );
            })}
            {followUpLabel && followUpBadgeColors ? (
              <PillBadge
                label={followUpLabel}
                color={followUpBadgeColors.color}
                backgroundColor={followUpBadgeColors.backgroundColor}
                borderColor={followUpBadgeColors.borderColor}
                size="sm"
              />
            ) : null}
          </View>
        ) : null}

        {note ? (
          <Text style={styles.note}>{note}</Text>
        ) : (
          <Text style={styles.empty}>
            Add notes about this candidate for your team — tags, follow-up reminders, and context
            stay here.
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Text style={styles.editLink}>
            {hasContent ? 'Edit notes' : 'Add notes'}
          </Text>
        </Pressable>
      </View>
    </>
  );
}
