import { getWorkerRoleTypes } from '@chairside/api';
import { formatRoleTypesLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router, usePathname } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SidebarProfileHeader } from '@/components/navigation/SidebarProfileHeader';
import { AccountMenuSheetHeader } from '@/components/navigation/AccountMenuSheetHeader';
import { ActionMenuSheet } from '@/components/ui/ActionMenuSheet';
import { ClinicLocationScopeSwitcher } from '@/components/clinic/ClinicLocationScopeSwitcher';
import { ClinicPlanBadge } from '@/components/clinic/ClinicPlanBadge';
import { handleTabBarPress } from '@/components/navigation/handleTabBarPress';
import { openClinicBillingModal } from '@/components/billing/ClinicBillingModal';
import { useResolvedTabBarFocus } from '@/hooks/useResolvedTabBarFocus';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicBilling } from '@/contexts/ClinicBillingContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useSidebarCollapse } from '@/contexts/SidebarCollapseContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { useClinicMemberPhoto } from '@/hooks/useClinicMemberPhoto';
import { getClinicMembershipRoleLabel } from '@/hooks/useClinicActingContext';
import { useSignOut } from '@/hooks/useSignOut';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import {
  getClinicPlanBrandAccentColor,
  getRecommendedUpgradePlan,
} from '@/lib/clinicPlanPresentation';
import {
  CLINIC_PROFILE,
  CLINIC_PROFILE_ACCOUNT,
  CLINIC_PROFILE_BILLING,
  CLINIC_PROFILE_NOTIFICATIONS,
  WORKER_PROFILE,
  WORKER_PROFILE_ACCOUNT,
  WORKER_PROFILE_NOTIFICATIONS,
} from '@/lib/routing';
import { TABLET_SIDEBAR_SECTIONS, TABLET_SIDEBAR_TAB_ORDER } from '@/components/navigation/tabOrder';
import { TABLET_TOP_INSET_EXTRA } from '@/lib/breakpoints';
import { getTabAccentForName } from '@/lib/tabAtmosphereRoutes';
import {
  webHover,
  webListRowHoverStyles,
  webOnlyStyle,
  webPointer,
  webTileHoverStyles,
} from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

export {
  TABLET_SIDEBAR_COLLAPSED_WIDTH,
  TABLET_SIDEBAR_WIDTH,
} from '@/components/navigation/sidebarDimensions';

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

type SidebarRoute = ReturnType<typeof getSidebarRoutes>[number];

function groupSidebarRoutes(
  routes: SidebarRoute[],
  role: 'worker' | 'clinic',
  useSections: boolean,
): { label: string | null; routes: SidebarRoute[] }[] {
  if (!useSections) {
    return [{ label: null, routes }];
  }

  const routeByName = new Map(routes.map((route) => [route.name, route]));
  const sections = TABLET_SIDEBAR_SECTIONS[role]
    .map((section) => ({
      label: section.label,
      routes: section.routes
        .map((name) => routeByName.get(name))
        .filter((route): route is SidebarRoute => route != null),
    }))
    .filter((section) => section.routes.length > 0);

  const groupedNames = new Set(sections.flatMap((section) => section.routes.map((route) => route.name)));
  const ungrouped = routes.filter((route) => !groupedNames.has(route.name));
  if (ungrouped.length > 0) {
    sections.push({ label: null, routes: ungrouped });
  }

  return sections;
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
  const { profile, user } = useAuth();
  const { photoUri } = useProfilePhoto();
  const { logoUri } = useClinicLogo();
  const { photoUri: memberPhotoUri } = useClinicMemberPhoto();
  const {
    clinicProfile,
    isGroup,
    organization,
    membership,
    isOwner,
    accessibleLocations,
  } = useClinicProfile();
  const { billing } = useClinicBilling();
  const showGroupLocationScope =
    role === 'clinic' && isGroup && accessibleLocations.length > 0;
  const showIndividualPlanBadge = role === 'clinic' && !isGroup;
  const individualPlan = billing?.plan ?? 'free';
  const { workerProfile } = useWorkerProfile();
  const isWeb = Platform.OS === 'web';
  const shellRef = useRef<View>(null);
  const [edgeHovered, setEdgeHovered] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const { signOut } = useSignOut();
  const showEdgeCollapse = !isWeb || edgeHovered;

  const syncEdgeHover = useCallback(
    (clientX: number | undefined, clientY: number | undefined) => {
      if (!isWeb || clientX == null || clientY == null) return;
      const node = shellRef.current as unknown as HTMLElement | null;
      const rect = node?.getBoundingClientRect?.();
      if (!rect) return;
      const nearRightEdge =
        clientX >= rect.right - 20 &&
        clientX <= rect.right + 20 &&
        clientY >= rect.top &&
        clientY <= rect.bottom;
      setEdgeHovered(nearRightEdge);
    },
    [isWeb],
  );

  useEffect(() => {
    if (!isWeb || typeof document === 'undefined') return;

    const handleMouseMove = (event: MouseEvent) => {
      syncEdgeHover(event.clientX, event.clientY);
    };

    const handleMouseLeave = () => {
      setEdgeHovered(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isWeb, syncEdgeHover]);

  const styles = useThemedStyles(({ colors, spacing, radii, isDark }) => ({
    outerWeb: {
      flex: 1,
      width: '100%',
      paddingHorizontal: isWeb ? spacing.xs : spacing.sm,
      paddingVertical: isWeb ? spacing.xs : spacing.sm,
      backgroundColor: 'transparent',
      minHeight: 0,
      position: 'relative',
      overflow: 'visible',
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
      gap: spacing.sm,
    },
    profileRowExpanded: {
      minHeight: 56,
    },
    profileHeaderWrap: {
      flex: 1,
      minWidth: 0,
    },
    toggleButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    toggleHovered: webListRowHoverStyles(colors),
    togglePressed: { opacity: 0.88 },
    profileSection: {
      flexShrink: 0,
      justifyContent: 'center',
      paddingBottom: spacing.md,
      marginBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    profileSectionCollapsed: {
      alignItems: 'center',
      width: '100%',
      overflow: 'hidden',
    },
    sidebarEdgeZone: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: -14,
      width: 28,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
      overflow: 'visible',
      pointerEvents: 'box-none',
    },
    sidebarEdgeCollapseButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      ...webPointer(),
      ...(isWeb
        ? webOnlyStyle({
            transitionProperty: 'opacity, transform',
            transitionDuration: '160ms',
            transitionTimingFunction: 'ease-out',
            boxShadow: isDark
              ? '0 2px 10px rgba(0, 0, 0, 0.35)'
              : '0 2px 10px rgba(15, 23, 42, 0.12)',
          } as ViewStyle)
        : {}),
    },
    sidebarEdgeCollapseButtonVisible: {
      opacity: 1,
      transform: [{ translateX: 0 }],
    },
    sidebarEdgeCollapseButtonHidden: isWeb
      ? webOnlyStyle({
          opacity: 0,
          pointerEvents: 'none',
          transform: [{ translateX: 4 }],
        } as ViewStyle)
      : {},
    sidebarEdgeCollapseButtonNative: {
      opacity: 0.88,
    },
    profileHeaderCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md + 2,
      ...webPointer(),
      ...webOnlyStyle({
        transitionProperty: 'background-color, border-color, box-shadow, transform',
        transitionDuration: '140ms',
      } as ViewStyle),
      ...(isWeb
        ? webOnlyStyle({
            boxShadow: isDark
              ? '0 8px 24px rgba(0, 0, 0, 0.28)'
              : '0 8px 24px rgba(15, 23, 42, 0.08)',
          } as ViewStyle)
        : {}),
    },
    profileHeaderCardPressed: {
      opacity: 0.92,
    },
    profileCollapsedPressable: {
      borderRadius: radii.lg,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      ...webPointer(),
    },
    profileCollapsedShell: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    profileToggleAlone: {
      alignItems: 'flex-end',
      marginTop: spacing.xs,
      paddingRight: 2,
    },
    profileToggleAloneCollapsed: {
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    planScopeWrap: {
      gap: 4,
      minWidth: 0,
      marginTop: 8,
    },
    planScopeEyebrow: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600',
      color: colors.labelSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    planScopeTriggerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minWidth: 0,
    },
    planScopeTrigger: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minWidth: 0,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    planScopeTriggerPressed: {
      opacity: 0.88,
    },
    planScopeLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    nav: {
      flex: 1,
      gap: 0,
      paddingTop: spacing.xs,
    },
    navCollapsed: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    sectionGroup: {
      gap: 2,
    },
    sectionDivider: {
      height: 0.5,
      marginVertical: spacing.sm,
      marginHorizontal: spacing.sm,
      backgroundColor: colors.separator,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: 2,
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
      minHeight: 44,
      paddingVertical: 10,
      paddingHorizontal: spacing.sm,
      borderRadius: isWeb ? 12 : 10,
      position: 'relative',
      overflow: 'hidden',
      ...webPointer(),
      ...(isWeb
        ? webOnlyStyle({
            transitionProperty: 'background-color, box-shadow, transform',
            transitionDuration: '180ms',
            transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          } as ViewStyle)
        : {}),
    },
    itemHovered: {
      backgroundColor: colors.fillSubtle,
      ...webOnlyStyle({
        transform: [{ translateX: 2 }],
      } as ViewStyle),
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 8,
      bottom: 8,
      width: 3,
      borderRadius: 2,
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
      fontSize: 14,
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
    sidebarFlat: {
      flex: 1,
      minHeight: 0,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
      overflow: 'visible',
    },
    upgradeRow: {
      marginBottom: spacing.xs,
    },
    badgeTextCollapsed: {
      fontSize: 9,
    },
  }));

  const visibleRoutes = getSidebarRoutes(state, descriptors, role);
  const { isRouteFocused } = useResolvedTabBarFocus(state, visibleRoutes, role);
  const profileHref = role === 'worker' ? WORKER_PROFILE : CLINIC_PROFILE;
  const isProfileActive = pathname.includes('/profile');

  const clinicGroupName =
    organization?.name?.trim() || clinicProfile?.clinic_name?.trim() || null;
  const clinicMemberName =
    membership?.display_name?.trim() || profile?.display_name?.trim() || null;
  const clinicRoleLabel = isGroup
    ? getClinicMembershipRoleLabel(membership?.role, isOwner)
    : null;
  // Groups: person-first. Individuals/workers unchanged.
  const profileName =
    role === 'worker'
      ? profile?.display_name
      : isGroup
        ? clinicMemberName
        : clinicProfile?.clinic_name?.trim() || null;
  const profileSubtitle =
    role === 'worker'
      ? (workerProfile && formatRoleTypesLabel(getWorkerRoleTypes(workerProfile))) ||
        'Dental professional'
      : isGroup
        ? clinicGroupName || 'Dental group'
        : [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ') ||
          'Dental practice';
  const profileMeta =
    role === 'clinic' && isGroup ? clinicRoleLabel : null;

  const handleToggleCollapse = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleCollapsed();
  };

  const openAccountMenu = () => {
    setAccountMenuVisible(true);
  };

  const accountMenuHeader = (
    <AccountMenuSheetHeader
      role={role}
      displayName={profileName ?? 'Account'}
      subtitle={profileSubtitle}
      meta={profileMeta}
      email={user?.email}
      avatarKind={role === 'worker' || (role === 'clinic' && isGroup) ? 'worker' : 'clinic'}
      photoUri={role === 'worker' ? photoUri : isGroup ? memberPhotoUri : logoUri}
      isGroup={role === 'clinic' && isGroup}
      billing={role === 'clinic' ? billing : null}
      locationCount={
        role === 'clinic' && isGroup
          ? (billing?.locationCount ?? accessibleLocations.length)
          : undefined
      }
    />
  );

  const accountMenuActions = [
    {
      label: 'Account',
      icon: <Ionicons name="person-outline" size={20} color={colors.primary} />,
      onPress: () => {
        router.push(role === 'worker' ? WORKER_PROFILE_ACCOUNT : CLINIC_PROFILE_ACCOUNT);
      },
    },
    {
      label: 'Notifications',
      icon: <Ionicons name="notifications-outline" size={20} color={colors.primary} />,
      onPress: () => {
        router.push(
          role === 'worker' ? WORKER_PROFILE_NOTIFICATIONS : CLINIC_PROFILE_NOTIFICATIONS,
        );
      },
    },
    ...(role === 'clinic'
      ? [
          {
            label: 'Billing',
            icon: <Ionicons name="card-outline" size={20} color={colors.primary} />,
            onPress: () => {
              router.push(CLINIC_PROFILE_BILLING);
            },
          },
        ]
      : []),
    {
      label: 'Sign out',
      destructive: true,
      icon: <Ionicons name="log-out-outline" size={20} color={colors.destructive} />,
      onPress: () => {
        signOut();
      },
    },
  ];

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

  const sidebarSections = groupSidebarRoutes(visibleRoutes, role, isWeb && !isCollapsed);

  const renderSidebarNavItem = (route: SidebarRoute) => {
    const { options } = descriptors[route.key];
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const isFocused = isRouteFocused(route.name, routeIndex);
    const tabAccent = getTabAccentForName(route.name);
    const activeColor = tabAccent === 'secondary' ? colors.secondary : colors.primary;
    const activeBackground =
      tabAccent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
    const color = isFocused ? activeColor : colors.tabInactive;
    const itemLabel = options.tabBarAccessibilityLabel ?? options.title ?? route.name;
    const titleLabel = options.title ?? route.name;

    const onPress = () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleTabBarPress({
        route,
        navigation,
        state,
        isFocused,
        pathname,
        role,
      });
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
        accessibilityLabel={itemLabel}
        {...(isCollapsed && isWeb
          ? webOnlyStyle({ title: titleLabel } as ViewStyle)
          : {})}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed, hovered }) => [
          styles.item,
          isCollapsed && styles.itemCollapsed,
          !isCollapsed && isFocused && { backgroundColor: activeBackground },
          isWeb && hovered && !pressed && !isFocused && styles.itemHovered,
          isWeb &&
            hovered &&
            !pressed &&
            isFocused &&
            !isCollapsed &&
            (tabAccent === 'secondary'
              ? webOnlyStyle({
                  backgroundColor: colors.secondarySubtle,
                  boxShadow: isDark
                    ? '0 4px 12px rgba(139, 92, 246, 0.12)'
                    : '0 4px 12px rgba(88, 86, 214, 0.1)',
                } as ViewStyle)
              : styles.itemActiveHovered),
          pressed && styles.itemPressed,
        ]}
      >
        {isFocused ? (
          <View style={[styles.accentBar, { backgroundColor: activeColor }]} />
        ) : null}
        <View style={styles.iconWrap}>
          {options.tabBarIcon?.({ focused: isFocused, color, size: 20 })}
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
            importantForAccessibility={isCollapsed ? 'no' : 'auto'}
          >
            {titleLabel}
          </Text>
        ) : null}
        {hasBadge && !isCollapsed ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const recommendedUpgrade =
    role === 'clinic' && billing ? getRecommendedUpgradePlan(billing.plan, billing.planFamily) : null;

  const clinicPlanAccent =
    role === 'clinic' && showIndividualPlanBadge
      ? getClinicPlanBrandAccentColor(individualPlan, colors)
      : undefined;

  const planBadgeNode =
    showIndividualPlanBadge && !isCollapsed ? (
      <ClinicPlanBadge
        plan={individualPlan}
        compact
        onPress={() => router.push(CLINIC_PROFILE_BILLING)}
      />
    ) : null;

  const accountMenuAccessibilityLabel = profileMeta
    ? `Account menu, ${profileName ?? 'Account'}, ${profileMeta}`
    : `Account menu, ${profileName ?? 'Account'}`;

  const handleAccountMenuPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openAccountMenu();
  };

  const sidebarContent = (
    <>
      <View style={[styles.profileSection, isCollapsed && styles.profileSectionCollapsed]}>
        {isCollapsed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={accountMenuAccessibilityLabel}
            onPress={handleAccountMenuPress}
            style={({ pressed, hovered }) => [
              styles.profileCollapsedShell,
              styles.profileCollapsedPressable,
              webHover(hovered, pressed, webListRowHoverStyles(colors)),
              pressed && styles.profileHeaderCardPressed,
            ]}>
            <SidebarProfileHeader
              interactive={false}
              avatarKind={
                role === 'worker' || (role === 'clinic' && isGroup) ? 'worker' : 'clinic'
              }
              displayName={profileName}
              photoUri={
                role === 'worker' ? photoUri : isGroup ? memberPhotoUri : logoUri
              }
              subtitle={profileSubtitle}
              meta={profileMeta}
              collapsed
              avatarSize={COLLAPSED_AVATAR_SIZE}
              avatarRingColor={clinicPlanAccent}
            />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={accountMenuAccessibilityLabel}
            onPress={handleAccountMenuPress}
            style={({ pressed, hovered }) => [
              styles.profileHeaderCard,
              webHover(hovered, pressed, webTileHoverStyles(colors, isDark)),
              pressed && styles.profileHeaderCardPressed,
            ]}>
            <View style={[styles.profileRow, styles.profileRowExpanded]}>
              <View style={styles.profileHeaderWrap}>
                <SidebarProfileHeader
                  interactive={false}
                  embeddedInCard
                  avatarKind={
                    role === 'worker' || (role === 'clinic' && isGroup) ? 'worker' : 'clinic'
                  }
                  displayName={profileName}
                  photoUri={
                    role === 'worker' ? photoUri : isGroup ? memberPhotoUri : logoUri
                  }
                  subtitle={profileSubtitle}
                  meta={profileMeta}
                  planBadge={planBadgeNode}
                  avatarSize={44}
                  avatarRingColor={clinicPlanAccent}
                />
              </View>
            </View>
          </Pressable>
        )}
        {showGroupLocationScope ? (
          <View style={{ marginTop: isCollapsed ? spacing.xs : spacing.sm }}>
            <ClinicLocationScopeSwitcher variant="sidebar" collapsed={isCollapsed} />
          </View>
        ) : null}
      </View>

      <View style={[styles.nav, isCollapsed && styles.navCollapsed]}>
        {sidebarSections.map((section, sectionIndex) => (
          <View
            key={section.routes[0]?.name ?? `section-${sectionIndex}`}
            style={styles.sectionGroup}
          >
            {sectionIndex > 0 && !isCollapsed ? <View style={styles.sectionDivider} /> : null}
            {!isCollapsed && section.label ? (
              <Text style={styles.sectionLabel}>{section.label}</Text>
            ) : null}
            {section.routes.map((route) => renderSidebarNavItem(route))}
          </View>
        ))}
      </View>

      <View style={[styles.footer, isCollapsed && styles.footerCollapsed]}>
        {recommendedUpgrade ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Upgrade plan"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openClinicBillingModal({
                focus: billing?.planFamily === 'group' || isGroup ? 'group' : 'clinic',
              });
            }}
            style={({ pressed, hovered }) => [
              styles.item,
              styles.upgradeRow,
              isCollapsed && styles.itemCollapsed,
              webHover(hovered, pressed, styles.itemHovered),
              pressed && styles.itemPressed,
            ]}
            {...(isCollapsed && isWeb ? webOnlyStyle({ title: 'Upgrade' } as ViewStyle) : {})}>
            <View style={styles.iconWrap}>
              <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
            </View>
            {!isCollapsed ? (
              <Text style={[styles.label, { color: colors.primary }]} numberOfLines={1}>
                Upgrade
              </Text>
            ) : null}
          </Pressable>
        ) : null}
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
              (isCollapsed
                ? styles.itemHovered
                : isProfileActive
                  ? styles.itemActiveHovered
                  : styles.itemHovered),
            pressed && styles.itemPressed,
          ]}
          {...(isCollapsed && isWeb ? webOnlyStyle({ title: 'Settings' } as ViewStyle) : {})}
        >
          <View style={styles.iconWrap}>
            <Ionicons
              name={isProfileActive ? 'settings' : 'settings-outline'}
              size={20}
              color={isProfileActive ? colors.primary : colors.tabInactive}
            />
          </View>
          {!isCollapsed ? (
            <Text
              style={[
                styles.label,
                isProfileActive && styles.labelActive,
                labelRevealStyle(isCollapsed),
              ]}
              accessibilityElementsHidden={isCollapsed}
              importantForAccessibility={isCollapsed ? 'no' : 'auto'}
            >
              Settings
            </Text>
          ) : null}
        </Pressable>
      </View>
    </>
  );

  const renderEdgeCollapseControl = () => (
    <View style={styles.sidebarEdgeZone} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onPress={handleToggleCollapse}
        style={({ pressed, hovered }) => [
          styles.sidebarEdgeCollapseButton,
          showEdgeCollapse
            ? styles.sidebarEdgeCollapseButtonVisible
            : styles.sidebarEdgeCollapseButtonHidden,
          !isWeb && styles.sidebarEdgeCollapseButtonNative,
          webHover(hovered, pressed, styles.toggleHovered),
          pressed && styles.togglePressed,
        ]}>
        <Feather
          name={isCollapsed ? 'chevrons-right' : 'chevrons-left'}
          size={16}
          color={colors.labelSecondary}
        />
      </Pressable>
    </View>
  );

  const renderSidebarShell = (padding: ViewStyle) => (
    <View
      ref={shellRef}
      style={[
        styles.sidebarFlat,
        padding,
        { position: 'relative', flex: 1, alignSelf: 'stretch' as const },
      ]}>
      {sidebarContent}
      {renderEdgeCollapseControl()}
    </View>
  );

  if (isWeb) {
    return (
      <>
        <View style={[styles.outerWeb, isCollapsed && { paddingHorizontal: spacing.xs }]}>
          {renderSidebarShell(panelPadding)}
        </View>
        <ActionMenuSheet
          visible={accountMenuVisible}
          headerContent={accountMenuHeader}
          actions={accountMenuActions}
          onClose={() => setAccountMenuVisible(false)}
        />
      </>
    );
  }

  return (
    <>
      <View style={[styles.sidebarShell, { backgroundColor: 'transparent' }]}>
        {renderSidebarShell(panelPadding)}
      </View>
      <ActionMenuSheet
        visible={accountMenuVisible}
        headerContent={accountMenuHeader}
        actions={accountMenuActions}
        onClose={() => setAccountMenuVisible(false)}
      />
    </>
  );
}
