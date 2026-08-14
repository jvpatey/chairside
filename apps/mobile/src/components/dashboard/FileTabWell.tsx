import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { dashboardTabTokens } from '@/components/dashboard/dashboardTokens';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { resolveAccentColor, resolveAccentOnColor, resolveAccentSubtle } from '@/lib/accentColors';
import { webListRowHoverStyles, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import {
  colorWithAlpha,
  fontSemibold,
  useTheme,
  useThemedStyles,
  type Colors,
  type GradientAccent,
} from '@/theme';

export type FileTabAccent = GradientAccent | 'neutral';

export type FileTabOption<T extends string = string> = {
  value: T;
  label: string;
  count?: number;
  badgeCount?: number;
  accent?: FileTabAccent;
  icon?: keyof typeof Ionicons.glyphMap;
};

function resolveFileTabAccentColors(colors: Colors, accent: FileTabAccent) {
  if (accent === 'neutral') {
    return {
      accentColor: colors.labelPrimary,
      accentSubtle: colors.fillSubtle,
      accentOn: colors.labelPrimary,
    };
  }

  return {
    accentColor: resolveAccentColor(colors, accent),
    accentSubtle: resolveAccentSubtle(colors, accent),
    accentOn: resolveAccentOnColor(colors, accent),
  };
}

export type FileTabWellVariant = 'dashboard' | 'inline';

type FileTabWellProps<T extends string = string> = {
  tabs: FileTabOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  children?: React.ReactNode;
  /** Dashboard file-tab card shell; inline is flat segmented tabs for list hubs. */
  variant?: FileTabWellVariant;
  /** Force compact tab layout (e.g. split-view master pane). */
  compactTabs?: boolean;
  /** Render only the tab strip — pair with an external scroll container. */
  tabsOnly?: boolean;
  /** Stretch tab panel to fill a flex parent (split-view master lists). */
  fillHeight?: boolean;
  /** When false, icon tabs stay equal width instead of expanding the selected tab. */
  expandSelectedTab?: boolean;
  /** Optional fourth tab e.g. Insights — rendered muted when locked */
  lockedTab?: T;
  onLockedTabPress?: () => void;
};

/** File-tab workspace: bordered shell on dashboard; flat segmented tabs elsewhere. */
export function FileTabWell<T extends string = string>({
  tabs,
  selected,
  onSelect,
  children,
  variant = 'inline',
  compactTabs: compactTabsProp,
  tabsOnly = false,
  fillHeight = false,
  expandSelectedTab = true,
  lockedTab,
  onLockedTabPress,
}: FileTabWellProps<T>) {
  const { colors } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const isDashboard = variant === 'dashboard';
  const compactTabs = compactTabsProp ?? (!isTablet && isDashboard);
  const isWeb = Platform.OS === 'web';

  const styles = useThemedStyles(({ colors, spacing, radii, isDark }) => {
    const subtleDivider = colorWithAlpha(colors.labelPrimary, isDark ? 0.05 : 0.055);

    return {
    shell: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? subtleDivider : colors.separator,
      borderRadius: radii.lg,
      overflow: 'hidden' as const,
      backgroundColor: colors.surface,
      width: '100%',
      alignSelf: 'stretch' as const,
    },
    inlineRoot: {
      width: '100%',
      alignSelf: 'stretch' as const,
      gap: spacing.md,
      ...(fillHeight ? { flex: 1, minHeight: 0 } : null),
    },
    tabRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: colors.backgroundGrouped,
      borderBottomWidth: compactTabs ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: subtleDivider,
    },
    inlineTabScroll: {
      flexGrow: 0,
    },
    inlineTabRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    inlineTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 34,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radii.pill,
      backgroundColor: colors.fillSubtle,
      flexShrink: 0,
      ...webPointer(),
    },
    inlineTabLocked: {
      opacity: 0.72,
    },
    inlineTabHovered: {
      backgroundColor: colors.surface,
    },
    inlineTabSelectedHovered: {
      opacity: 0.94,
    },
    inlineTabPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
    inlineTabLabel: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: fontSemibold,
      color: colors.labelSecondary,
      letterSpacing: -0.1,
    },
    inlineTabCount: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: fontSemibold,
      color: colors.labelTertiary,
      fontVariant: ['tabular-nums'] as const,
    },
    tab: {
      minWidth: 0,
      paddingTop: compactTabs ? spacing.sm + 4 : spacing.sm + 2,
      paddingBottom: compactTabs ? spacing.sm + 4 : spacing.sm + 2,
      paddingHorizontal: compactTabs ? spacing.sm + 2 : spacing.md,
      backgroundColor: 'transparent',
      ...webPointer(),
      ...webOnlyStyle({
        transitionProperty: 'flex-grow, flex-basis, background-color, opacity, padding',
        transitionDuration: '160ms',
      } as const),
    },
    tabEqual: {
      flex: 1,
    },
    tabCollapsed: {
      flexGrow: 0,
      flexShrink: 0,
      paddingHorizontal: compactTabs ? spacing.sm : spacing.sm + 2,
    },
    tabExpanded: {
      flex: 1,
      flexGrow: 1,
      minWidth: 0,
    },
    tabSelected: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.md,
      borderTopRightRadius: radii.md,
      ...(compactTabs
        ? null
        : {
            paddingBottom: spacing.sm + 2 + StyleSheet.hairlineWidth,
            marginBottom: -StyleSheet.hairlineWidth,
          }),
      zIndex: 1,
    },
    tabSelectedEdgeStart: {
      borderTopLeftRadius: 0,
    },
    tabSelectedEdgeEnd: {
      borderTopRightRadius: 0,
    },
    tabLocked: {
      opacity: 0.72,
    },
    tabInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compactTabs ? spacing.xs + 2 : spacing.sm,
      minWidth: 0,
      width: '100%',
    },
    tabInnerCollapsed: {
      justifyContent: 'center',
      width: 'auto',
    },
    iconBadge: {
      width: compactTabs ? dashboardTabTokens.iconBadge.compactSize : dashboardTabTokens.iconBadge.size,
      height: compactTabs ? dashboardTabTokens.iconBadge.compactSize : dashboardTabTokens.iconBadge.size,
      borderRadius: compactTabs
        ? dashboardTabTokens.iconBadge.compactBorderRadius
        : dashboardTabTokens.iconBadge.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    tabLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: compactTabs ? 13 : 14,
      lineHeight: compactTabs ? 18 : 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
      ...webOnlyStyle({
        transitionProperty: 'opacity',
        transitionDuration: '160ms',
      } as const),
    },
    tabLabelSelected: {
      color: colors.labelPrimary,
    },
    tabCount: {
      fontSize: compactTabs ? 13 : 14,
      lineHeight: compactTabs ? 18 : 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelTertiary,
      fontVariant: ['tabular-nums'] as const,
      flexShrink: 0,
    },
    tabCountCollapsed: {
      fontSize: 12,
      lineHeight: 16,
      marginLeft: 2,
    },
    tabCountSelected: {
      color: colors.labelSecondary,
    },
    panel: {
      backgroundColor: colors.surface,
      padding: compactTabs ? spacing.sm : spacing.md,
    },
    inlinePanel: {
      flex: 1,
      minHeight: 0,
    },
    tabHovered: webListRowHoverStyles(colors),
    tabPressed: {
      opacity: 0.88,
    },
  };
  });

  const handleSelect = (value: T, locked: boolean) => {
    if (locked && onLockedTabPress) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onLockedTabPress();
      return;
    }
    void Haptics.selectionAsync();
    onSelect(value);
  };

  const useExpandingTabs = expandSelectedTab && tabs.some((tab) => Boolean(tab.icon));

  const renderInlineTabs = () => (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.inlineTabScroll}
      contentContainerStyle={styles.inlineTabRow}
    >
      {tabs.map((tab) => {
        const isSelected = selected === tab.value;
        const isLocked = lockedTab === tab.value;
        const accent = tab.accent ?? 'primary';
        const { accentColor, accentOn } = resolveFileTabAccentColors(colors, accent);

        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${tab.label}${tab.count != null ? `: ${tab.count}` : ''}`}
            onPress={() => handleSelect(tab.value, isLocked)}
            style={({ pressed, hovered }) => [
              styles.inlineTab,
              isSelected && { backgroundColor: accentColor },
              isLocked && styles.inlineTabLocked,
              !isSelected && isWeb && hovered && !pressed && styles.inlineTabHovered,
              isSelected && isWeb && hovered && !pressed && styles.inlineTabSelectedHovered,
              pressed && styles.inlineTabPressed,
            ]}
          >
            {tab.icon ? (
              <Ionicons
                name={tab.icon}
                size={14}
                color={isSelected ? accentOn : colors.labelSecondary}
              />
            ) : null}
            <Text style={[styles.inlineTabLabel, isSelected && { color: accentOn }]}>
              {tab.label}
            </Text>
            {tab.count != null ? (
              <Text
                style={[
                  styles.inlineTabCount,
                  isSelected && { color: accentOn, opacity: 0.85 },
                ]}>
                {tab.count}
              </Text>
            ) : null}
            {tab.badgeCount != null && tab.badgeCount > 0 && !isSelected ? (
              <NotificationCountBadge count={tab.badgeCount} />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderDashboardTabs = () => (
    <View style={styles.tabRow} accessibilityRole="tablist">
      {tabs.map((tab, tabIndex) => {
        const isSelected = selected === tab.value;
        const isLocked = lockedTab === tab.value;
        const isFirst = tabIndex === 0;
        const isLast = tabIndex === tabs.length - 1;
        const accent = tab.accent ?? 'primary';
        const { accentColor, accentSubtle, accentOn } = resolveFileTabAccentColors(colors, accent);
        const hasIcon = Boolean(tab.icon);
        const isCollapsed = useExpandingTabs && hasIcon && !isSelected;
        const showLabel = !isCollapsed;

        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${tab.label}${tab.count != null ? `: ${tab.count}` : ''}`}
            {...(isCollapsed && isWeb ? ({ title: tab.label } as object) : null)}
            onPress={() => handleSelect(tab.value, isLocked)}
            style={({ pressed, hovered }) => [
              styles.tab,
              useExpandingTabs && hasIcon
                ? isSelected
                  ? styles.tabExpanded
                  : styles.tabCollapsed
                : styles.tabEqual,
              isSelected && styles.tabSelected,
              compactTabs && isSelected && isFirst && styles.tabSelectedEdgeStart,
              compactTabs && isSelected && isLast && styles.tabSelectedEdgeEnd,
              isLocked && styles.tabLocked,
              isWeb && hovered && !pressed && !isSelected && styles.tabHovered,
              pressed && !isSelected && styles.tabPressed,
            ]}
          >
            <View style={[styles.tabInner, isCollapsed && styles.tabInnerCollapsed]}>
              {tab.icon ? (
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: isSelected ? accentColor : accentSubtle },
                  ]}
                >
                  <Ionicons
                    name={tab.icon}
                    size={
                      compactTabs
                        ? dashboardTabTokens.iconBadge.compactIconSize
                        : dashboardTabTokens.iconBadge.iconSize
                    }
                    color={isSelected ? accentOn : accentColor}
                  />
                </View>
              ) : null}
              {showLabel ? (
                <Text
                  style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              ) : null}
              {tab.count != null ? (
                <Text
                  style={[
                    styles.tabCount,
                    isCollapsed && styles.tabCountCollapsed,
                    isSelected && styles.tabCountSelected,
                    isSelected ? { color: accentColor } : null,
                  ]}
                >
                  {tab.count}
                </Text>
              ) : null}
              {tab.badgeCount != null && tab.badgeCount > 0 && !isSelected ? (
                <NotificationCountBadge count={tab.badgeCount} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  if (!isDashboard) {
    if (tabsOnly) {
      return renderInlineTabs();
    }

    return (
      <View style={styles.inlineRoot}>
        {renderInlineTabs()}
        {children != null ? <View style={styles.inlinePanel}>{children}</View> : null}
      </View>
    );
  }

  const shell = (
    <View style={styles.shell}>
      {renderDashboardTabs()}
      <View style={styles.panel}>{children}</View>
    </View>
  );

  return shell;
}
