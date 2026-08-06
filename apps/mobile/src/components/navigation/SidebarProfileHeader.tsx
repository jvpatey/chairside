import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { Platform, Pressable, Text, View, type ViewStyle, type ReactNode } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

const DEFAULT_AVATAR_SIZE = 56;

type SidebarProfileHeaderProps = {
  href: Href;
  avatarKind: 'worker' | 'clinic';
  displayName?: string | null;
  photoUri?: string | null;
  subtitle?: string | null;
  /** Short trailing line (e.g. Owner / Manager) — kept off the truncated name line. */
  meta?: string | null;
  /** Small plan badge shown under the name row. */
  planBadge?: ReactNode;
  collapsed?: boolean;
  avatarSize?: number;
  /** Optional accent ring around the avatar (sidebar header). */
  avatarRingColor?: string;
  /** Inside sidebar header card — drops extra pressable padding. */
  embeddedInCard?: boolean;
};

export function SidebarProfileHeader({
  href,
  avatarKind,
  displayName,
  photoUri,
  subtitle,
  meta,
  planBadge,
  collapsed = false,
  avatarSize = DEFAULT_AVATAR_SIZE,
  avatarRingColor,
  embeddedInCard = false,
}: SidebarProfileHeaderProps) {
  const name = displayName?.trim() || 'Your profile';
  const trimmedSubtitle = subtitle?.trim() || null;
  const trimmedMeta = meta?.trim() || null;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    pressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: 12,
      ...webPointer(),
    },
    pressableCollapsed: {
      justifyContent: 'center',
      alignSelf: 'center',
      paddingHorizontal: 0,
      gap: 0,
      ...webOnlyStyle({
        transitionProperty: 'padding-left, padding-right, gap',
        transitionDuration: '220ms',
        transitionTimingFunction: 'ease-out',
      } as ViewStyle),
    },
    pressableHovered: {
      backgroundColor: colors.fillSubtle,
    },
    pressablePressed: {
      backgroundColor: colors.fillSubtle,
    },
    pressableEmbedded: {
      paddingVertical: 0,
      paddingHorizontal: 0,
      gap: spacing.sm,
      alignItems: 'flex-start',
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    nameEmbedded: {
      fontSize: 15,
      lineHeight: 20,
    },
    name: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    meta: {
      ...typography.subtitle,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    planBadgeRow: {
      marginTop: 4,
      alignSelf: 'stretch',
    },
    avatarRing: {
      padding: 2,
      borderRadius: 999,
      borderWidth: 2,
    },
  }));

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        trimmedMeta ? `Profile, ${name}, ${trimmedMeta}` : `Profile, ${name}`
      }
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(href);
      }}
      style={({ pressed, hovered }) => [
        styles.pressable,
        embeddedInCard && styles.pressableEmbedded,
        collapsed && styles.pressableCollapsed,
        isWeb && hovered && !pressed && styles.pressableHovered,
        pressed && styles.pressablePressed,
      ]}>
      {avatarKind === 'worker' ? (
        <View
          style={avatarRingColor ? [styles.avatarRing, { borderColor: avatarRingColor }] : undefined}>
          <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={avatarSize} />
        </View>
      ) : (
        <View
          style={avatarRingColor ? [styles.avatarRing, { borderColor: avatarRingColor }] : undefined}>
          <ClinicLogoAvatar clinicName={displayName} logoUri={photoUri} size={avatarSize} />
        </View>
      )}
      {!collapsed ? (
        <View style={styles.textBlock} accessibilityElementsHidden={false} importantForAccessibility="auto">
          <Text
            style={[styles.name, embeddedInCard && styles.nameEmbedded]}
            numberOfLines={embeddedInCard ? 1 : 2}>
            {name}
          </Text>
          {trimmedSubtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {trimmedSubtitle}
            </Text>
          ) : null}
          {trimmedMeta ? (
            <Text style={styles.meta} numberOfLines={1}>
              {trimmedMeta}
            </Text>
          ) : null}
          {planBadge ? <View style={styles.planBadgeRow}>{planBadge}</View> : null}
        </View>
      ) : null}
    </Pressable>
  );
}
