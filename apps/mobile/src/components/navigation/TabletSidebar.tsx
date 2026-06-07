import { getProvinceLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { router, usePathname } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SidebarProfileHeader } from '@/components/navigation/SidebarProfileHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { CLINIC_PROFILE, WORKER_PROFILE } from '@/lib/routing';
import { TABLET_PROFILE_ROW_HEIGHT, TABLET_TOP_INSET_EXTRA } from '@/lib/breakpoints';
import { useTheme, useThemedStyles } from '@/theme';

export const TABLET_SIDEBAR_WIDTH = 240;

const SIDEBAR_TAB_ORDER: Record<'worker' | 'clinic', string[]> = {
  worker: ['index', 'browse', 'applications', 'fillins', 'messages'],
  clinic: ['index', 'postings', 'applications', 'fill-ins', 'messages'],
};

function getSidebarRoutes(
  state: BottomTabBarProps['state'],
  descriptors: BottomTabBarProps['descriptors'],
  role: 'worker' | 'clinic',
) {
  const order = SIDEBAR_TAB_ORDER[role];

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

export function TabletSidebar({ state, descriptors, navigation, role }: TabletSidebarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { colors, spacing } = useTheme();
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
      paddingHorizontal: spacing.md,
    },
    profileSection: {
      flexShrink: 0,
      minHeight: TABLET_PROFILE_ROW_HEIGHT,
      justifyContent: 'center',
      paddingBottom: spacing.sm,
      marginBottom: spacing.sm,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.separator,
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
      // @ts-expect-error — cursor is web-only
      cursor: 'pointer',
      // @ts-expect-error — transitionDuration is web-only
      transitionDuration: '140ms',
    },
    itemActive: {
      backgroundColor: colors.primarySubtle,
    },
    itemHovered: {
      backgroundColor: colors.fillSubtle,
    },
    itemActiveHovered: {
      backgroundColor: colors.primarySubtle,
      // @ts-expect-error — boxShadow is web-only
      boxShadow: isDark
        ? '0 4px 12px rgba(74, 154, 255, 0.12)'
        : '0 4px 12px rgba(26, 111, 212, 0.1)',
    },
    itemPressed: {
      opacity: 0.85,
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
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primaryOnPrimary,
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

  return (
    <View
      style={[
        styles.sidebar,
        {
          paddingTop: insets.top + TABLET_TOP_INSET_EXTRA,
          paddingBottom: Math.max(insets.bottom, spacing.md),
          ...(Platform.OS === 'web' ? { minHeight: 0 } : {}),
        },
      ]}>
      <View style={styles.profileSection}>
        <SidebarProfileHeader
          href={profileHref}
          avatarKind={role === 'worker' ? 'worker' : 'clinic'}
          displayName={profileName}
          photoUri={role === 'worker' ? photoUri : logoUri}
          subtitle={profileSubtitle}
        />
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
                isFocused && styles.itemActive,
                isWeb && hovered && !pressed && (isFocused ? styles.itemActiveHovered : styles.itemHovered),
                pressed && styles.itemPressed,
              ]}>
              {options.tabBarIcon?.({ focused: isFocused, color, size: 22 })}
              <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
                {options.title ?? route.name}
              </Text>
              {badge != null && badge !== 0 ? (
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
            isProfileActive && styles.itemActive,
            isWeb && hovered && !pressed && (isProfileActive ? styles.itemActiveHovered : styles.itemHovered),
            pressed && styles.itemPressed,
          ]}>
          <Ionicons
            name={isProfileActive ? 'settings' : 'settings-outline'}
            size={22}
            color={isProfileActive ? colors.primary : colors.tabInactive}
          />
          <Text style={[styles.label, isProfileActive && styles.labelActive]}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}
