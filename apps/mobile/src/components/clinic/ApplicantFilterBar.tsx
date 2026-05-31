import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import type { ApplicantFilterCounts, ApplicantListFilter } from '@/lib/applicationPipeline';
import { useThemedStyles } from '@/theme';

type ApplicantFilterBarProps = {
  selected: ApplicantListFilter;
  counts: ApplicantFilterCounts;
  onChange: (filter: ApplicantListFilter) => void;
};

const FILTER_TABS: { value: ApplicantListFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'decided', label: 'Decided' },
];

export function ApplicantFilterBar({ selected, counts, onChange }: ApplicantFilterBarProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
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
      paddingHorizontal: spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      gap: 2,
    },
    tabSelected: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.labelSecondary,
      textAlign: 'center',
    },
    labelSelected: {
      color: colors.labelPrimary,
    },
    count: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.labelTertiary,
      textAlign: 'center',
    },
    countSelected: {
      color: colors.primary,
    },
  }));

  return (
    <View style={styles.wrap}>
      {FILTER_TABS.map((tab) => {
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
            style={[styles.tab, isSelected && styles.tabSelected]}>
            <Text
              style={[styles.label, isSelected && styles.labelSelected]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}>
              {tab.label}
            </Text>
            <Text style={[styles.count, isSelected && styles.countSelected]}>
              {counts[tab.value]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
