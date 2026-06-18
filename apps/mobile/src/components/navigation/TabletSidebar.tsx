import { getWorkerRoleTypes } from '@chairside/api';
import { formatRoleTypesLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { router, usePathname } from 'expo-router';
import { Platform, Pressable, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SidebarProfileHeader } from '@/components/navigation/SidebarProfileHeader';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { SlidingSegmentIndicator } from '@/components/ui/SlidingSegmentIndicator';
import { useSlidingSegmentIndicator } from '@/hooks/useSlidingSegmentIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useSidebarCollapse } from '@/contexts/SidebarCollapseContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { CLINIC_PROFILE, WORKER_PROFILE } from '@/lib/routing';
import { TABLET_SIDEBAR_TAB_ORDER } from '@/components/navigation/tabOrder';
import { TABLET_PROFILE_ROW_HEIGHT, TABLET_TOP_INSET_EXTRA } from '@/lib/breakpoints';
import { getTabAccentForName } from '@/lib/tabAtmosphereRoutes';
import { webHover, webListRowHoverStyles, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, colorWithAlpha } from '@/theme';

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
  const { colors, spacing, isDark } = useTheme();
  const { isCollapsed, toggleCollapsed } = useSidebarCollapse();
  const { profile } = useAuth();
  const { photoUri } = useProfilePhoto();
  const { logoUri } = useClinicLogo();
  const { clinicProfile } = useClinicProfile();
  const { workerProfile } = useWorkerProfile();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    outerWeb: {
      flex: 1,
      width: '100%',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      backgroundColor: 'transparent',
      minHeight: 0,
      position: 'relative',
    },
    glassPanel: {
      flex: 1,
      minHeight: 0,
    },
    sidebarWebInner: {
      flex: 1,
      width: '100%',
      backgroundColor: 'transparent',
    },
    sidebarShell: {
      flex: 1,
      minHeight: 0,
      position: 'relative',
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    profileRowCollapsed: {
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
    },
    profileRowExpanded: {
      minHeight: TABLET_PROFILE_ROW_HEIGHT,
    },
    profileHeaderWrap: {
      flex: 1,
      minWidth: 0,
    },
    profileHeaderWrapCollapsed: {
      flex: 0,
      width: '100%',
      alignItems: 'center',
    },
    toggleButton: {
      width: 24,
      height: 24,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...webPointer(),
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
    sidebarToggleAnchor: {
      position: 'absolute',
      right: spacing.md,
      top: 0,
      bottom: 0,
      width: 28,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3,
    },
    nav: {
      flex: 1,
      gap: spacing.xs,
      paddingTop: spacing.xs,
      position: 'relative',
    },
    navCollapsed: {
      alignItems: 'center',
    },
    navIndicator: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: spacing.xs,
      borderRadius: 10,
    },
    footer: {
      flexShrink: 0,
      borderTopWidth: 0.5,
      borderTopColor: colors.separator,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    footerCollapsed: {
      alignItems: 'center',
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
      alignSelf: 'center',
      width: 44,
      paddingHorizontal: 0,
      paddingVertical: 11,
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
  const focusedVisibleIndex = visibleRoutes.findIndex(
    (route) => state.routes.findIndex((r) => r.key === route.key) === state.index,
  );
  const { animatedStyle: navIndicatorStyle, onSegmentLayout } = useSlidingSegmentIndicator(
    focusedVisibleIndex >= 0 ? focusedVisibleIndex : 0,
    'vertical',
  );
  const focusedRoute = visibleRoutes[focusedVisibleIndex];
  const focusedAccent = focusedRoute ? getTabAccentForName(focusedRoute.name) : 'primary';
  const focusedIndicatorColor =
    focusedAccent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
  const profileHref = role === 'worker' ? WORKER_PROFILE : CLINIC_PROFILE;
  const isProfileActive = pathname.includes('/profile');

  const profileName =
    role === 'worker' ? profile?.display_name : clinicProfile?.clinic_name?.trim() || null;
  const profileSubtitle =
    role === 'worker'
      ? (workerProfile && formatRoleTypesLabel(getWorkerRoleTypes(workerProfile))) ||
        'Dental professional'
      : 'Dental Clinic';

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
        size={12}
        color={colors.labelSecondary}
      />
    </Pressable>
  );

  const panelPadding = {
    paddingHorizontal: isCollapsed ? spacing.xs : spacing.md,
    paddingTop: insets.top + TABLET_TOP_INSET_EXTRA,
    paddingBottom: Math.max(insets.bottom, spacing.md),
    ...(isWeb
      ? webOnlyStyle({
          transitionProperty: 'padding-left, padding-right',
          transitionDuration: '220ms',
          transitionTimingFunction: 'ease-out',
        } as ViewStyle)
      : {}),
  };

  const sidebarContent = (
    <>
      <View
        style={[
          styles.profileSection,
          isCollapsed && styles.profileSectionCollapsed,
        ]}>
        <View
          style={[
            styles.profileRow,
            isCollapsed && styles.profileRowCollapsed,
            !isCollapsed && styles.profileRowExpanded,
          ]}>
          <View
            style={[
              styles.profileHeaderWrap,
              isCollapsed && styles.profileHeaderWrapCollapsed,
            ]}>
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
        </View>
      </View>

      <View style={[styles.nav, isCollapsed && styles.navCollapsed]}>
        {!isCollapsed ? (
          <SlidingSegmentIndicator
            animatedStyle={navIndicatorStyle}
            style={[styles.navIndicator, { backgroundColor: focusedIndicatorColor }]}
          />
        ) : null}
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const tabAccent = getTabAccentForName(route.name);
          const activeColor = tabAccent === 'secondary' ? colors.secondary : colors.primary;
          const color = isFocused ? activeColor : colors.tabInactive;
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
              onLayout={(event) => {
                if (isCollapsed) return;
                const { x, y, width, height } = event.nativeEvent.layout;
                onSegmentLayout(index, { x, y, width, height });
              }}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed, hovered }) => [
                styles.item,
                isCollapsed && styles.itemCollapsed,
                isWeb && hovered && !pressed && !isFocused && styles.itemHovered,
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
              {!isCollapsed ? (
                <Text
                  style={[
                    styles.label,
                    isFocused && [styles.labelActive, { color: activeColor }],
                    labelRevealStyle(isCollapsed),
                  ]}
                  numberOfLines={1}
                  accessibilityElementsHidden={isCollapsed}
                  importantForAccessibility={isCollapsed ? 'no' : 'auto'}>
                  {options.title ?? route.name}
                </Text>
              ) : null}
              {hasBadge && !isCollapsed ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.footer, isCollapsed && styles.footerCollapsed]}>
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
            !isCollapsed && isProfileActive && styles.itemActive,
            isWeb &&
              hovered &&
              !pressed &&
              (isCollapsed ? styles.itemHovered : isProfileActive ? styles.itemActiveHovered : styles.itemHovered),
            pressed && styles.itemPressed,
          ]}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={isProfileActive ? 'settings' : 'settings-outline'}
              size={22}
              color={isProfileActive ? colors.primary : colors.tabInactive}
            />
          </View>
          {!isCollapsed ? (
            <Text
              style={[styles.label, isProfileActive && styles.labelActive, labelRevealStyle(isCollapsed)]}
              accessibilityElementsHidden={isCollapsed}
              importantForAccessibility={isCollapsed ? 'no' : 'auto'}>
              Settings
            </Text>
          ) : null}
        </Pressable>
      </View>
    </>
  );

  if (isWeb) {
    return (
      <View style={[styles.outerWeb, isCollapsed && { paddingHorizontal: spacing.xs }]}>
        <LiquidGlassSurface
          borderRadius={28}
          style={styles.glassPanel}
          overlayColor={colorWithAlpha(colors.surfaceElevated, isDark ? 0.72 : 0.78)}
          backdropBlur>
          <View style={[styles.sidebarWebInner, panelPadding]}>
            {sidebarContent}
          </View>
        </LiquidGlassSurface>
        <View style={styles.sidebarToggleAnchor} pointerEvents="box-none">
          {collapseToggle}
        </View>
      </View>
    );
  }

  return (
    <View style={[panelPadding, styles.sidebarShell, { backgroundColor: 'transparent' }]}>
      {sidebarContent}
      <View style={styles.sidebarToggleAnchor} pointerEvents="box-none">
        {collapseToggle}
      </View>
    </View>
  );
}
