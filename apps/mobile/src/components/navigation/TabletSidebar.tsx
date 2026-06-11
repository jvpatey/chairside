import { getProvinceLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { router, usePathname } from 'expo-router';
import { Platform, Pressable, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SidebarProfileHeader } from '@/components/navigation/SidebarProfileHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useSidebarCollapse } from '@/contexts/SidebarCollapseContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { CLINIC_PROFILE, WORKER_PROFILE } from '@/lib/routing';
import { TABLET_SIDEBAR_TAB_ORDER } from '@/components/navigation/tabOrder';
import { TABLET_PROFILE_ROW_HEIGHT, TABLET_TOP_INSET_EXTRA } from '@/lib/breakpoints';
import { webHover, webListRowHoverStyles, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

export { TABLET_SIDEBAR_COLLAPSED_WIDTH, TABLET_SIDEBAR_WIDTH } from '@/components/navigation/sidebarDimensions';

const COLLAPSED_AVATAR_SIZE = 40;

function getSidebarRoutes(
  state: BottomTabBarProps['state'],
  descriptors: BottomTabBarProps['descriptors'],
  role: 'worker' | 'clinic',
) {
  const order = TABLET_SIDEBAR_TAB_ORDER[role];

  return state.routes
    .filter((route) => typeof descriptors[route.key]?.options?.tabBarIcon === 'function')
    .sort((a, b) => {
      const aIndex = order.indexOf(a.name);
      const bIndex = order.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
}

type TabletSidebarProps = BottomTabBarProps & {
  role: 'worker' | 'clinic';
};

function labelRevealStyle(collapsed: boolean): TextStyle {
  return {
    flex: collapsed ? 0 : 1,
    opacity: collapsed ? 0 : 1,
    maxWidth: collapsed ? 0 : 9999,
    overflow: 'hidden',
    ...webOnlyStyle({
      transitionProperty: 'opacity, max-width',
      transitionDuration: '220ms',
      transitionTimingFunction: 'ease-out',
    } as ViewStyle),
  } as TextStyle;
}

export function TabletSidebar({ state, descriptors, navigation, role }: TabletSidebarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { colors, spacing } = useTheme();
  const { isCollapsed, toggleCollapsed } = useSidebarCollapse();
  const { profile } = useAuth();
  const { photoUri } = useProfilePhoto();
  const { logoUri } = useClinicLogo();
  const { clinicProfile } = useClinicProfile();
  const { workerProfile } = useWorkerProfile();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    sidebar: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.surface,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    profileRowExpanded: {
      minHeight: TABLET_PROFILE_ROW_HEIGHT,
    },
    profileHeaderWrap: {
      flex: 1,
      minWidth: 0,
    },
    toggleButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...webPointer(),
    },
    collapsedToggleWrap: {
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    toggleHovered: webListRowHoverStyles(colors),
    togglePressed: { opacity: 0.85 },
    profileSection: {
      flexShrink: 0,
      justifyContent: 'center',
      paddingBottom: spacing.sm,
      marginBottom: spacing.sm,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.separator,
    },
    profileSectionCollapsed: {
      alignItems: 'center',
      paddingBottom: spacing.sm,
    },
    nav: {
      flex: 1,
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    footer: {
      flexShrink: 0,
      borderTopWidth: 0.5,
      borderTopColor: colors.separator,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 11,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
      ...webPointer(),
    },
    itemCollapsed: {
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
      gap: 0,
    },
    itemActive: {
      backgroundColor: colors.primarySubtle,
    },
    itemHovered: {
      backgroundColor: colors.fillSubtle,
    },
    itemActiveHovered: webOnlyStyle({
      backgroundColor: colors.primarySubtle,
      boxShadow: isDark
        ? '0 4px 12px rgba(74, 154, 255, 0.12)'
        : '0 4px 12px rgba(26, 111, 212, 0.1)',
    } as ViewStyle),
    itemPressed: {
      opacity: 0.85,
    },
    iconWrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    labelActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.destructive,
    },
    badgeCollapsed: {
      position: 'absolute',
      top: -4,
      right: -8,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primaryOnPrimary,
    },
    badgeTextCollapsed: {
      fontSize: 9,
    },
  }));

  const visibleRoutes = getSidebarRoutes(state, descriptors, role);
  const profileHref = role === 'worker' ? WORKER_PROFILE : CLINIC_PROFILE;
  const isProfileActive = pathname.includes('/profile');

  const profileName =
    role === 'worker' ? profile?.display_name : clinicProfile?.clinic_name?.trim() || null;
  const profileSubtitle =
    role === 'worker'
      ? workerProfile?.province
        ? getProvinceLabel(workerProfile.province)
        : 'View profile'
      : clinicProfile?.province
        ? getProvinceLabel(clinicProfile.province)
        : 'View profile';

  const isWeb = Platform.OS === 'web';

  const handleToggleCollapse = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleCollapsed();
  };

  const collapseToggle = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      onPress={handleToggleCollapse}
      style={({ pressed, hovered }) => [
        styles.toggleButton,
        webHover(hovered, pressed, styles.toggleHovered),
        pressed && styles.togglePressed,
      ]}>
      <Ionicons
        name={isCollapsed ? 'chevron-forward-outline' : 'chevron-back-outline'}
        size={16}
        color={colors.labelSecondary}
      />
    </Pressable>
  );

  return (
    <View
      style={[
        styles.sidebar,
        {
          paddingHorizontal: isCollapsed ? spacing.xs : spacing.md,
          paddingTop: insets.top + TABLET_TOP_INSET_EXTRA,
          paddingBottom: Math.max(insets.bottom, spacing.md),
          ...(Platform.OS === 'web'
            ? {
                minHeight: 0,
                ...webOnlyStyle({
                  transitionProperty: 'padding-left, padding-right',
                  transitionDuration: '220ms',
                  transitionTimingFunction: 'ease-out',
                } as ViewStyle),
              }
            : {}),
        },
      ]}>
      <View style={[styles.profileSection, isCollapsed && styles.profileSectionCollapsed]}>
        {isCollapsed ? <View style={styles.collapsedToggleWrap}>{collapseToggle}</View> : null}
        <View style={[styles.profileRow, !isCollapsed && styles.profileRowExpanded]}>
          <View style={styles.profileHeaderWrap}>
            <SidebarProfileHeader
              href={profileHref}
              avatarKind={role === 'worker' ? 'worker' : 'clinic'}
              displayName={profileName}
              photoUri={role === 'worker' ? photoUri : logoUri}
              subtitle={profileSubtitle}
              collapsed={isCollapsed}
              avatarSize={isCollapsed ? COLLAPSED_AVATAR_SIZE : undefined}
            />
          </View>
          {!isCollapsed ? collapseToggle : null}
        </View>
      </View>

      <View style={styles.nav}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const color = isFocused ? colors.primary : colors.tabInactive;
          const label = options.tabBarAccessibilityLabel ?? options.title ?? route.name;

          const onPress = () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.dispatch({
                ...CommonActions.navigate(route.name),
                target: state.key,
              });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const badge = options.tabBarBadge;
          const hasBadge = badge != null && badge !== 0;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed, hovered }) => [
                styles.item,
                isCollapsed && styles.itemCollapsed,
                isFocused && styles.itemActive,
                isWeb && hovered && !pressed && (isFocused ? styles.itemActiveHovered : styles.itemHovered),
                pressed && styles.itemPressed,
              ]}>
              <View style={styles.iconWrap}>
                {options.tabBarIcon?.({ focused: isFocused, color, size: 22 })}
                {hasBadge && isCollapsed ? (
                  <View style={[styles.badge, styles.badgeCollapsed]}>
                    <Text style={[styles.badgeText, styles.badgeTextCollapsed]}>{badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[styles.label, isFocused && styles.labelActive, labelRevealStyle(isCollapsed)]}
                numberOfLines={1}
                accessibilityElementsHidden={isCollapsed}
                importantForAccessibility={isCollapsed ? 'no' : 'auto'}>
                {options.title ?? route.name}
              </Text>
              {hasBadge && !isCollapsed ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={isProfileActive ? { selected: true } : {}}
          accessibilityLabel="Settings"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(profileHref);
          }}
          style={({ pressed, hovered }) => [
            styles.item,
            isCollapsed && styles.itemCollapsed,
            isProfileActive && styles.itemActive,
            isWeb && hovered && !pressed && (isProfileActive ? styles.itemActiveHovered : styles.itemHovered),
            pressed && styles.itemPressed,
          ]}>
          <Ionicons
            name={isProfileActive ? 'settings' : 'settings-outline'}
            size={22}
            color={isProfileActive ? colors.primary : colors.tabInactive}
          />
          <Text
            style={[styles.label, isProfileActive && styles.labelActive, labelRevealStyle(isCollapsed)]}
            accessibilityElementsHidden={isCollapsed}
            importantForAccessibility={isCollapsed ? 'no' : 'auto'}>
            Settings
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
