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
  collapsed?: boolean;
  avatarSize?: number;
};

function textRevealStyle(collapsed: boolean): ViewStyle {
  return {
    flex: collapsed ? 0 : 1,
    opacity: collapsed ? 0 : 1,
    maxWidth: collapsed ? 0 : 9999,
    overflow: 'hidden',
    ...webOnlyStyle({
      transitionProperty: 'opacity, max-width',
      transitionDuration: '220ms',
      transitionTimingFunction: 'ease-out',
    }),
  } as ViewStyle;
}

export function SidebarProfileHeader({
  href,
  avatarKind,
  displayName,
  photoUri,
  subtitle,
  collapsed = false,
  avatarSize = DEFAULT_AVATAR_SIZE,
}: SidebarProfileHeaderProps) {
  const name = displayName?.trim() || 'Your profile';

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
      paddingHorizontal: spacing.xs,
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
    },
  }));

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Profile, ${name}`}
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
      <View
        style={[styles.textBlock, textRevealStyle(collapsed)]}
        accessibilityElementsHidden={collapsed}
        importantForAccessibility={collapsed ? 'no' : 'auto'}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
