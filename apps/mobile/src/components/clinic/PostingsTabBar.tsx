import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

export type PostingsTab = 'roles' | 'fill-ins';

type PostingsTabBarProps = {
  selected: PostingsTab;
  roleCount: number;
  fillInCount: number;
  onChange: (tab: PostingsTab) => void;
};

export function PostingsTabBar({
  selected,
  roleCount,
  fillInCount,
  onChange,
}: PostingsTabBarProps) {
  const tabs: { value: PostingsTab; label: string; count: number }[] = [
    { value: 'roles', label: 'Roles', count: roleCount },
    { value: 'fill-ins', label: 'Fill-ins', count: fillInCount },
  ];

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      padding: spacing.xs,
      flexDirection: 'row',
      gap: spacing.xs,
    },
    tab: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
      ...webPointer(),
    },
    tabHovered: webListRowHoverStyles(colors),
    tabPressed: {
      opacity: 0.88,
    },
    tabSelected: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    label: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.labelSecondary,
    },
    labelSelected: {
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    count: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelTertiary,
      minWidth: 18,
      textAlign: 'center',
    },
    countSelected: {
      color: colors.primary,
    },
  }));

  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const isSelected = selected === tab.value;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(tab.value);
            }}
            style={({ pressed, hovered }) => [
              styles.tab,
              isSelected && styles.tabSelected,
              !isSelected && webHover(hovered, pressed, styles.tabHovered),
              pressed && styles.tabPressed,
            ]}>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{tab.label}</Text>
            <Text style={[styles.count, isSelected && styles.countSelected]}>{tab.count}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
