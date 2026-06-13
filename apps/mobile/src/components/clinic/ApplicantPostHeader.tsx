import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { CardContentSection, CardSectionDivider } from '@/components/ui/CardTitleSection';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

type ApplicantPostHeaderProps = {
  displayName: string;
  photoStoragePath?: string | null;
  /** Small caps label above the title. Omit to default to display name. */
  eyebrow?: string;
  title: string;
  location?: string | null;
  detail?: string | null;
  postedLabel?: string | null;
  accessory?: ReactNode;
  textFooter?: ReactNode;
  /** Renders on the right of the split details block, vertically centered. */
  detailAccessory?: ReactNode;
  footer?: ReactNode;
  avatarSize?: number;
  stackedAccessory?: boolean;
  layout?: 'stacked' | 'split';
};

export function ApplicantPostHeader({
  displayName,
  photoStoragePath,
  eyebrow,
  title,
  location,
  detail,
  postedLabel,
  accessory,
  textFooter,
  detailAccessory,
  footer,
  avatarSize = 44,
  stackedAccessory = false,
  layout = 'stacked',
}: ApplicantPostHeaderProps) {
  const photoUri = useWorkerPhotoUri(photoStoragePath);
  const { spacing } = useTheme();
  const footerInset = avatarSize + spacing.md;
  const isSplit = layout === 'split';
  const eyebrowLabel = eyebrow !== undefined ? eyebrow : displayName;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: isSplit ? spacing.md : spacing.sm,
    },
    mainRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    textBlock: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    textColumn: {
      flex: 1,
      gap: isSplit ? spacing.xs : 2,
      minWidth: 0,
    },
    eyebrow: {
      fontSize: 11,
      fontFamily: fontSemibold,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    title: {
      ...typography.body,
      fontSize: isSplit ? 18 : 20,
      lineHeight: isSplit ? 23 : 26,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: colors.labelPrimary,
    },
    location: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      color: colors.labelSecondary,
    },
    meta: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    posted: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
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
    metaFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      minWidth: 0,
    },
    metaFooterLabel: {
      flex: 1,
      minWidth: 0,
    },
    metaFooterAccessory: {
      flexShrink: 0,
      alignItems: 'flex-end',
    },
    footer: {
      gap: spacing.sm,
    },
    detailsBlock: {
      gap: spacing.xs,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    detailsColumn: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    detailAccessoryCol: {
      flexShrink: 0,
      alignSelf: 'center',
      alignItems: 'flex-end',
    },
  }));

  const identityBlock = (
    <View style={styles.mainRow}>
      <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={avatarSize} />
      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          <View style={styles.textColumn}>
            {eyebrowLabel ? (
              <Text style={styles.eyebrow} numberOfLines={2}>
                {eyebrowLabel}
              </Text>
            ) : null}
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {location ? (
              <Text style={styles.location} numberOfLines={2}>
                {location}
              </Text>
            ) : null}
            {!isSplit && detail ? (
              <Text style={styles.meta} numberOfLines={3}>
                {detail}
              </Text>
            ) : null}
            {!isSplit && postedLabel ? (
              <Text style={styles.posted} numberOfLines={1}>
                {postedLabel}
              </Text>
            ) : null}
          </View>
          {accessory ? (
            <View style={[styles.accessory, stackedAccessory && styles.accessoryStack]}>
              {accessory}
            </View>
          ) : null}
        </View>
        {!isSplit && textFooter ? <View style={styles.textFooter}>{textFooter}</View> : null}
      </View>
    </View>
  );

  const detailsColumnContent = (
    <>
      {detail ? (
        <Text style={styles.meta} numberOfLines={3}>
          {detail}
        </Text>
      ) : null}
      {postedLabel && textFooter && !detailAccessory ? (
        <View style={styles.metaFooterRow}>
          <Text style={[styles.posted, styles.metaFooterLabel]} numberOfLines={1}>
            {postedLabel}
          </Text>
          <View style={styles.metaFooterAccessory}>{textFooter}</View>
        </View>
      ) : postedLabel ? (
        <Text style={styles.posted} numberOfLines={1}>
          {postedLabel}
        </Text>
      ) : textFooter && !detailAccessory ? (
        <View style={styles.textFooter}>{textFooter}</View>
      ) : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </>
  );

  const hasDetails = detail || postedLabel || textFooter || footer || detailAccessory;

  const detailsContent = hasDetails ? (
    <CardContentSection style={detailAccessory ? undefined : styles.detailsBlock}>
      {detailAccessory ? (
        <View style={styles.detailsRow}>
          <View style={styles.detailsColumn}>{detailsColumnContent}</View>
          <View style={styles.detailAccessoryCol}>{detailAccessory}</View>
        </View>
      ) : (
        <View style={styles.detailsBlock}>{detailsColumnContent}</View>
      )}
    </CardContentSection>
  ) : null;

  if (isSplit) {
    return (
      <View style={styles.wrap}>
        {identityBlock}
        {detailsContent ? (
          <>
            <CardSectionDivider />
            {detailsContent}
          </>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {identityBlock}
      {footer ? (
        <View style={[styles.footer, { paddingLeft: footerInset }]}>{footer}</View>
      ) : null}
    </View>
  );
}
