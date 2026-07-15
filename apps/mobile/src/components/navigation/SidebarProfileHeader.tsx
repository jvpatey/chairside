import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';

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
  collapsed?: boolean;
  avatarSize?: number;
};

export function SidebarProfileHeader({
  href,
  avatarKind,
  displayName,
  photoUri,
  subtitle,
  meta,
  collapsed = false,
  avatarSize = DEFAULT_AVATAR_SIZE,
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
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    name: {
      ...typography.body,
      fontSize: 16,
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
        collapsed && styles.pressableCollapsed,
        isWeb && hovered && !pressed && styles.pressableHovered,
        pressed && styles.pressablePressed,
      ]}>
      {avatarKind === 'worker' ? (
        <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={avatarSize} />
      ) : (
        <ClinicLogoAvatar clinicName={displayName} logoUri={photoUri} size={avatarSize} />
      )}
      {!collapsed ? (
        <View style={styles.textBlock} accessibilityElementsHidden={false} importantForAccessibility="auto">
          <Text style={styles.name} numberOfLines={2}>
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
        </View>
      ) : null}
    </Pressable>
  );
}
