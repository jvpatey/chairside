import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { useTheme, useThemedStyles } from '@/theme';

type ApplicantPostHeaderProps = {
  displayName: string;
  photoStoragePath?: string | null;
  /** Defaults to uppercase display name. */
  eyebrow?: string;
  title: string;
  detail?: string | null;
  accessory?: ReactNode;
  textFooter?: ReactNode;
  footer?: ReactNode;
  avatarSize?: number;
  stackedAccessory?: boolean;
};

export function ApplicantPostHeader({
  displayName,
  photoStoragePath,
  eyebrow,
  title,
  detail,
  accessory,
  textFooter,
  footer,
  avatarSize = 44,
  stackedAccessory = false,
}: ApplicantPostHeaderProps) {
  const photoUri = useWorkerPhotoUri(photoStoragePath);
  const { spacing } = useTheme();
  const footerInset = avatarSize + spacing.md;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    textBlock: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    textColumn: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    title: {
      ...typography.body,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    accessory: {
      flexShrink: 0,
      paddingTop: 2,
      alignItems: 'flex-end',
    },
    accessoryStack: {
      flexDirection: 'column',
      gap: spacing.xs,
    },
    textFooter: {
      marginTop: spacing.xs,
    },
    footer: {
      gap: spacing.sm,
    },
  }));

  const eyebrowLabel = eyebrow ?? displayName;

  return (
    <View style={styles.wrap}>
      <View style={styles.mainRow}>
        <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={avatarSize} />
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <View style={styles.textColumn}>
              <Text style={styles.eyebrow} numberOfLines={2}>
                {eyebrowLabel}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {detail ? (
                <Text style={styles.meta} numberOfLines={3}>
                  {detail}
                </Text>
              ) : null}
            </View>
            {accessory ? (
              <View style={[styles.accessory, stackedAccessory && styles.accessoryStack]}>
                {accessory}
              </View>
            ) : null}
          </View>
          {textFooter ? <View style={styles.textFooter}>{textFooter}</View> : null}
        </View>
      </View>
      {footer ? (
        <View style={[styles.footer, { paddingLeft: footerInset }]}>{footer}</View>
      ) : null}
    </View>
  );
}
