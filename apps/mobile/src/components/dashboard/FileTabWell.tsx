import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { DeltaChip } from '@/components/ui/DeltaChip';
import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { resolveAccentColor, resolveAccentSubtle } from '@/lib/accentColors';
import { webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import {
  fontExtraBold,
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
  weekDelta?: number;
  accent?: GradientAccent;
  icon?: keyof typeof Ionicons.glyphMap;
};

type FileTabWellProps<T extends string = string> = {
  tabs: FileTabOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  children: React.ReactNode;
  /** Optional fourth tab e.g. Insights — rendered muted when locked */
  lockedTab?: T;
  onLockedTabPress?: () => void;
};

/** File-tab workspace: overlapping tabs + well content panel. */
export function FileTabWell<T extends string = string>({
  tabs,
  selected,
  onSelect,
  children,
  lockedTab,
  onLockedTabPress,
}: FileTabWellProps<T>) {
  const { colors, isDark, radii } = useTheme();
  const isWeb = Platform.OS === 'web';
  const selectedIndex = tabs.findIndex((tab) => tab.value === selected);
  const panelTopLeftRadius = selectedIndex <= 0 ? 0 : radii.lg;
  const panelTopRightRadius = selectedIndex >= tabs.length - 1 ? 0 : radii.lg;

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    root: {
      width: '100%',
      alignSelf: 'stretch' as const,
    },
    tabRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      zIndex: 2,
      position: 'relative' as const,
    },
    tab: {
      flex: 1,
      minWidth: 0,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
      ...webPointer(),
    },
    tabSelected: {
      backgroundColor: colors.surface,
      borderBottomWidth: 0,
      paddingBottom: spacing.sm + StyleSheet.hairlineWidth,
      marginBottom: -StyleSheet.hairlineWidth,
      zIndex: 3,
    },
    tabLocked: {
      opacity: 0.72,
    },
    tabInner: {
      gap: spacing.xs - 2,
      alignItems: 'flex-start' as const,
    },
    tabHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minWidth: 0,
      width: '100%',
    },
    iconBadge: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    tabLabelRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minWidth: 0,
    },
    tabLabel: {
      flex: 1,
      fontSize: 13,
      lineHeight: 17,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    tabLabelSelected: {
      color: colors.labelPrimary,
    },
    tabValue: {
      fontSize: 22,
      lineHeight: 26,
      fontFamily: fontExtraBold,
      fontWeight: '800',
      color: colors.labelPrimary,
      fontVariant: ['tabular-nums'] as const,
      letterSpacing: -0.5,
    },
    tabValueWithIcon: {
      paddingLeft: 28 + spacing.xs,
    },
    tabMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 18,
    },
    tabMetaRowWithIcon: {
      paddingLeft: 28 + spacing.xs,
    },
    accentRail: {
      position: 'absolute',
      left: 0,
      top: spacing.sm,
      bottom: spacing.sm,
      width: 3,
      borderRadius: 2,
    },
    panel: {
      zIndex: 1,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      borderBottomLeftRadius: radii.lg,
      borderBottomRightRadius: radii.lg,
      backgroundColor: colors.surface,
      padding: spacing.lg,
    },
    tabHovered: webTileHoverStyles(colors, isDark),
    tabPressed: {
      opacity: 0.9,
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

  return (
    <View style={styles.root}>
      <View style={styles.tabRow} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const isSelected = selected === tab.value;
          const isLocked = lockedTab === tab.value;
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
                isLocked && styles.tabLocked,
                isWeb && hovered && !pressed && !isSelected && styles.tabHovered,
                pressed && styles.tabPressed,
              ]}>
              {isSelected ? (
                <View style={[styles.accentRail, { backgroundColor: accentColor }]} />
              ) : null}
              <View style={styles.tabInner}>
                <View style={styles.tabHeaderRow}>
                  {tab.icon ? (
                    <View style={[styles.iconBadge, { backgroundColor: accentSubtle }]}>
                      <Ionicons name={tab.icon} size={15} color={accentColor} />
                    </View>
                  ) : null}
                  <View style={styles.tabLabelRow}>
                    <Text
                      style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}
                      numberOfLines={1}>
                      {tab.label}
                    </Text>
                    {tab.badgeCount != null && tab.badgeCount > 0 ? (
                      <NotificationCountBadge count={tab.badgeCount} />
                    ) : null}
                  </View>
                </View>
                {tab.count != null ? (
                  <Text
                    style={[
                      styles.tabValue,
                      tab.icon ? styles.tabValueWithIcon : null,
                      isSelected ? { color: accentColor } : null,
                    ]}>
                    {tab.count}
                  </Text>
                ) : null}
                <View style={[styles.tabMetaRow, tab.icon ? styles.tabMetaRowWithIcon : null]}>
                  {tab.weekDelta != null ? <DeltaChip delta={tab.weekDelta} /> : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View
        style={[
          styles.panel,
          { borderTopLeftRadius: panelTopLeftRadius, borderTopRightRadius: panelTopRightRadius },
        ]}>
        {children}
      </View>
    </View>
  );
}
