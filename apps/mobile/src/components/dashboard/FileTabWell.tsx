import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { dashboardTabTokens } from '@/components/dashboard/dashboardTokens';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { resolveAccentColor, resolveAccentSubtle } from '@/lib/accentColors';
import { webListRowHoverStyles, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import {
  fontBold,
  fontSemibold,
  useTheme,
  useThemedStyles,
  type GradientAccent,
} from '@/theme';

export type FileTabOption<T extends string = string> = {
  value: T;
  label: string;
  count?: number;
  badgeCount?: number;
  accent?: GradientAccent;
  icon?: keyof typeof Ionicons.glyphMap;
};

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
  lockedTab,
  onLockedTabPress,
}: FileTabWellProps<T>) {
  const { colors } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const isDashboard = variant === 'dashboard';
  const compactTabs = compactTabsProp ?? (!isTablet && isDashboard);
  const isWeb = Platform.OS === 'web';

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    shell: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
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
      borderBottomColor: colors.separator,
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
    inlineTabSelected: {
      backgroundColor: colors.primary,
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
    inlineTabLabelSelected: {
      color: colors.primaryOnPrimary,
    },
    inlineTabCount: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: fontSemibold,
      color: colors.labelTertiary,
      fontVariant: ['tabular-nums'] as const,
    },
    inlineTabCountSelected: {
      color: colors.primaryOnPrimary,
      opacity: 0.85,
    },
    tab: {
      flex: 1,
      minWidth: 0,
      paddingTop: compactTabs ? spacing.sm + 4 : spacing.sm + 2,
      paddingBottom: compactTabs ? spacing.sm + 4 : spacing.sm + 2,
      paddingHorizontal: compactTabs ? spacing.sm + 2 : spacing.md,
      backgroundColor: 'transparent',
      ...webPointer(),
      ...webOnlyStyle({
        transitionProperty: 'background-color, opacity',
        transitionDuration: '140ms',
      } as const),
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
      gap: compactTabs ? spacing.sm : spacing.sm,
      minWidth: 0,
      width: '100%',
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
    textColumn: {
      flex: 1,
      minWidth: 0,
      gap: compactTabs ? 4 : 2,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compactTabs ? spacing.xs + 2 : spacing.xs,
      minWidth: 0,
    },
    tabLabel: {
      flexShrink: 1,
      fontSize: compactTabs ? 11 : 12,
      lineHeight: compactTabs ? 14 : 15,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    tabLabelSelected: {
      color: colors.labelPrimary,
    },
    tabValue: {
      fontSize: compactTabs
        ? dashboardTabTokens.tabValue.compactFontSize
        : dashboardTabTokens.tabValue.fontSize,
      lineHeight: compactTabs
        ? dashboardTabTokens.tabValue.compactLineHeight
        : dashboardTabTokens.tabValue.lineHeight,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      fontVariant: ['tabular-nums'] as const,
      letterSpacing: compactTabs ? -0.4 : -0.5,
    },
    tabCountInline: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelTertiary,
      fontVariant: ['tabular-nums'] as const,
    },
    tabCountInlineSelected: {
      color: colors.labelSecondary,
    },
    tabValueInactive: {
      color: colors.labelTertiary,
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
  }));

  const handleSelect = (value: T, locked: boolean) => {
    if (locked && onLockedTabPress) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onLockedTabPress();
      return;
    }
    void Haptics.selectionAsync();
    onSelect(value);
  };

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

        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${tab.label}${tab.count != null ? `: ${tab.count}` : ''}`}
            onPress={() => handleSelect(tab.value, isLocked)}
            style={({ pressed, hovered }) => [
              styles.inlineTab,
              isSelected && styles.inlineTabSelected,
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
                color={isSelected ? colors.primaryOnPrimary : colors.labelSecondary}
              />
            ) : null}
            <Text style={[styles.inlineTabLabel, isSelected && styles.inlineTabLabelSelected]}>
              {tab.label}
            </Text>
            {tab.count != null ? (
              <Text style={[styles.inlineTabCount, isSelected && styles.inlineTabCountSelected]}>
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
        const accentColor = resolveAccentColor(colors, accent);
        const accentSubtle = resolveAccentSubtle(colors, accent);

        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${tab.label}${tab.count != null ? `: ${tab.count}` : ''}`}
            onPress={() => handleSelect(tab.value, isLocked)}
            style={({ pressed, hovered }) => [
              styles.tab,
              isSelected && styles.tabSelected,
              compactTabs && isSelected && isFirst && styles.tabSelectedEdgeStart,
              compactTabs && isSelected && isLast && styles.tabSelectedEdgeEnd,
              isLocked && styles.tabLocked,
              isWeb && hovered && !pressed && !isSelected && styles.tabHovered,
              pressed && !isSelected && styles.tabPressed,
            ]}
          >
            <View style={styles.tabInner}>
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
                    color={isSelected ? colors.primaryOnPrimary : accentColor}
                  />
                </View>
              ) : null}
              <View style={styles.textColumn}>
                <View style={styles.labelRow}>
                  <Text
                    style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}
                    numberOfLines={1}
                  >
                    {compactTabs && tab.label === 'Applications' ? 'Apps' : tab.label}
                  </Text>
                  {compactTabs && tab.count != null && !isSelected ? (
                    <Text
                      style={[
                        styles.tabCountInline,
                        isSelected && styles.tabCountInlineSelected,
                      ]}
                    >
                      {tab.count}
                    </Text>
                  ) : null}
                  {tab.badgeCount != null && tab.badgeCount > 0 ? (
                    <NotificationCountBadge count={tab.badgeCount} />
                  ) : null}
                </View>
                {tab.count != null && (!compactTabs || isSelected) ? (
                  <Text
                    style={[
                      styles.tabValue,
                      !isSelected && styles.tabValueInactive,
                      isSelected ? { color: accentColor } : null,
                    ]}
                  >
                    {tab.count}
                  </Text>
                ) : null}
              </View>
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
