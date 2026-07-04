import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatApplicantCountLabel } from '@/components/ui/CountBadge';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

export function formatViewApplicantsLabel(count: number): string {
  return `View ${formatApplicantCountLabel(count)}`;
}

type PostingCardActionButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary';
  /** Solid primary fill for unread/new emphasis (primary variant only). */
  highlighted?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PostingCardActionButton({
  label,
  variant = 'secondary',
  highlighted = false,
  onPress,
  disabled = false,
  fullWidth = false,
  style,
}: PostingCardActionButtonProps) {
  const isPrimary = variant === 'primary';

  const styles = useThemedStyles(({ colors, spacing }) => ({
    button: {
      ...(fullWidth ? { alignSelf: 'stretch' as const, flexGrow: 1, flexBasis: 0 } : { flex: 1 }),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor:
        isPrimary && highlighted
          ? `${colors.primary}55`
          : isPrimary
            ? `${colors.primary}55`
            : colors.separator,
      backgroundColor:
        isPrimary && highlighted
          ? colors.primary
          : isPrimary
            ? colors.primarySubtle
            : colors.surface,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      minHeight: 40,
      minWidth: 0,
      ...webPointer(disabled || !onPress ? 'default' : 'pointer'),
    },
    buttonDisabled: {
      opacity: 0.45,
    },
    buttonHovered: webListRowHoverStyles(colors),
    buttonPressed: {
      opacity: 0.88,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 18,
      textAlign: 'center',
      color:
        isPrimary && highlighted
          ? colors.primaryOnPrimary
          : isPrimary
            ? colors.primary
            : colors.labelPrimary,
      flexShrink: 1,
    },
  }));

  const labelNode = (
    <Text style={styles.label} numberOfLines={2}>
      {label}
    </Text>
  );

  if (!onPress || disabled) {
    return (
      <View style={[styles.button, styles.buttonDisabled, style]}>
        {labelNode}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={(event) => {
        event.stopPropagation?.();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed, hovered }) => [
        styles.button,
        webHover(hovered, pressed, styles.buttonHovered),
        pressed && styles.buttonPressed,
        style,
      ]}>
      {labelNode}
    </Pressable>
  );
}

type PostingCardActionRowProps = {
  onViewPost?: () => void;
  onViewApplicants?: () => void;
  applicantCount?: number;
};

export function PostingCardActionRow({
  onViewPost,
  onViewApplicants,
  applicantCount = 0,
}: PostingCardActionRowProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
  }));

  const hasApplicants = applicantCount > 0;
  const showApplicantsButton = hasApplicants && Boolean(onViewApplicants);

  return (
    <View style={styles.row}>
      <PostingCardActionButton
        label="View post"
        onPress={onViewPost}
        fullWidth={!showApplicantsButton}
      />
      {showApplicantsButton ? (
        <PostingCardActionButton
          label={formatViewApplicantsLabel(applicantCount)}
          variant="primary"
          onPress={onViewApplicants}
        />
      ) : null}
    </View>
  );
}
