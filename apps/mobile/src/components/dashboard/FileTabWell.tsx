import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { SurfaceWell } from '@/components/ui/SurfaceWell';
import { resolveAccentColor, resolveAccentSubtle } from '@/lib/accentColors';
import { webListRowHoverStyles, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
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

/** File-tab workspace: one bordered shell; tabs share the panel surface. */
export function FileTabWell<T extends string = string>({
  tabs,
  selected,
  onSelect,
  children,
  lockedTab,
  onLockedTabPress,
}: FileTabWellProps<T>) {
  const { colors } = useTheme();
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
    tabRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: colors.backgroundGrouped,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    tab: {
      flex: 1,
      minWidth: 0,
      paddingTop: spacing.sm + 2,
      paddingBottom: spacing.sm + 2,
      paddingHorizontal: spacing.md,
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
      paddingBottom: spacing.sm + 2 + StyleSheet.hairlineWidth,
      marginBottom: -StyleSheet.hairlineWidth,
      zIndex: 1,
    },
    tabLocked: {
      opacity: 0.72,
    },
    tabInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
      width: '100%',
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    textColumn: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minWidth: 0,
    },
    tabLabel: {
      flexShrink: 1,
      fontSize: 12,
      lineHeight: 15,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    tabLabelSelected: {
      color: colors.labelPrimary,
    },
    tabValue: {
      fontSize: 26,
      lineHeight: 30,
      fontFamily: fontExtraBold,
      fontWeight: '800',
      color: colors.labelPrimary,
      fontVariant: ['tabular-nums'] as const,
      letterSpacing: -0.6,
    },
    tabValueInactive: {
      color: colors.labelTertiary,
    },
    panel: {
      backgroundColor: colors.surface,
      padding: spacing.md,
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

  return (
    <SurfaceWell contentStyle={{ padding: 0 }}>
      <View style={styles.shell}>
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
                  pressed && !isSelected && styles.tabPressed,
                ]}>
                <View style={styles.tabInner}>
                  {tab.icon ? (
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: isSelected ? accentColor : accentSubtle },
                      ]}>
                      <Ionicons
                        name={tab.icon}
                        size={18}
                        color={isSelected ? colors.primaryOnPrimary : accentColor}
                      />
                    </View>
                  ) : null}
                  <View style={styles.textColumn}>
                    <View style={styles.labelRow}>
                      <Text
                        style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}
                        numberOfLines={1}>
                        {tab.label}
                      </Text>
                      {tab.badgeCount != null && tab.badgeCount > 0 ? (
                        <NotificationCountBadge count={tab.badgeCount} />
                      ) : null}
                    </View>
                    {tab.count != null ? (
                      <Text
                        style={[
                          styles.tabValue,
                          !isSelected && styles.tabValueInactive,
                          isSelected ? { color: accentColor } : null,
                        ]}>
                        {tab.count}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.panel}>{children}</View>
      </View>
    </SurfaceWell>
  );
}
