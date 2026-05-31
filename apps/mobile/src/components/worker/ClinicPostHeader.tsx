import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useTheme, useThemedStyles } from '@/theme';

type ClinicPostHeaderProps = {
  clinicName: string;
  logoStoragePath?: string | null;
  title: string;
  location?: string | null;
  detail?: string | null;
  accessory?: ReactNode;
  /** Renders below the title block, aligned with the text column. */
  textFooter?: ReactNode;
  footer?: ReactNode;
  avatarSize?: number;
  stackedAccessory?: boolean;
};

export function ClinicPostHeader({
  clinicName,
  logoStoragePath,
  title,
  location,
  detail,
  accessory,
  textFooter,
  footer,
  avatarSize = 48,
  stackedAccessory = false,
}: ClinicPostHeaderProps) {
  const logoUri = useClinicLogoUri(logoStoragePath);
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
    clinicName: {
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

  return (
    <View style={styles.wrap}>
      <View style={styles.mainRow}>
        <ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={avatarSize} />
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <View style={styles.textColumn}>
              <Text style={styles.clinicName} numberOfLines={2}>
                {clinicName}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {location ? (
                <Text style={styles.meta} numberOfLines={2}>
                  {location}
                </Text>
              ) : null}
              {detail ? (
                <Text style={styles.meta} numberOfLines={2}>
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
