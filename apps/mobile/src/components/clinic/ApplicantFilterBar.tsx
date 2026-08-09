import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { DashboardStatGrid } from '@/components/dashboard/DashboardStatGrid';
import { dashboardControlRadii } from '@/components/dashboard/dashboardLayout';
import type { ApplicantFilterCounts, ApplicantListFilter } from '@/lib/applicationPipeline';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { fontBold, fontSemibold, useThemedStyles } from '@/theme';

type ApplicantFilterBarProps = {
  selected: ApplicantListFilter;
  counts: ApplicantFilterCounts;
  onChange: (filter: ApplicantListFilter) => void;
  /** Filters omitted from the bar (e.g. follow_up when CRM is locked). */
  hiddenFilters?: ApplicantListFilter[];
  /** Called instead of onChange when a locked filter is selected. */
  lockedFilters?: ApplicantListFilter[];
  onLockedFilterPress?: (filter: ApplicantListFilter) => void;
};

const FILTER_TABS: { value: ApplicantListFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'screening', label: 'Screening' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'decided', label: 'Decided' },
  { value: 'follow_up', label: 'Follow-up' },
];

function visibleFilterTabs(hiddenFilters?: ApplicantListFilter[]) {
  if (!hiddenFilters?.length) return FILTER_TABS;
  const hidden = new Set(hiddenFilters);
  return FILTER_TABS.filter((tab) => !hidden.has(tab.value));
}

export function ApplicantFilterBar({
  selected,
  counts,
  onChange,
  hiddenFilters,
  lockedFilters,
  onLockedFilterPress,
}: ApplicantFilterBarProps) {
  const tabs = visibleFilterTabs(hiddenFilters);
  const handleChange = (filter: ApplicantListFilter) => {
    if (lockedFilters?.includes(filter)) {
      onLockedFilterPress?.(filter);
      return;
    }
    onChange(filter);
  };

  if (Platform.OS === 'web') {
    return (
      <DashboardStatGrid
        stats={tabs.map((tab) => ({
          key: tab.value,
          label: tab.label,
          value: counts[tab.value],
        }))}
        selected={selected}
        onSelect={handleChange}
        density="compact"
        accent="tertiary"
        accessibilityRole="tab"
      />
    );
  }

  return (
    <ApplicantFilterBarScroll
      selected={selected}
      counts={counts}
      onChange={handleChange}
      tabs={tabs}
    />
  );
}

function ApplicantFilterBarScroll({
  selected,
  counts,
  onChange,
  tabs,
}: {
  selected: ApplicantListFilter;
  counts: ApplicantFilterCounts;
  onChange: (filter: ApplicantListFilter) => void;
  tabs: typeof FILTER_TABS;
}) {
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    row: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingRight: spacing.xs,
    },
    chip: {
      minWidth: 84,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: dashboardControlRadii.statSegment,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      backgroundColor: colors.fillSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      ...webPointer(),
    },
    chipActive: {
      backgroundColor: isDark ? `${colors.tertiary}28` : colors.tertiarySubtle,
      borderColor: isDark ? `${colors.tertiary}77` : `${colors.tertiary}55`,
    },
    chipHovered: {
      backgroundColor: colors.surfaceElevated,
    },
    chipPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
    value: {
      fontSize: 20,
      lineHeight: 24,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.5,
    },
    valueActive: {
      color: colors.tertiary,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
      textAlign: 'center',
    },
    labelActive: {
      color: colors.tertiary,
    },
  }));

  const handleSelect = (filter: ApplicantListFilter) => {
    void Haptics.selectionAsync();
    onChange(filter);
  };

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isSelected = selected === tab.value;
        const count = counts[tab.value];

        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${tab.label}, ${count} applicant${count === 1 ? '' : 's'}`}
            onPress={() => handleSelect(tab.value)}
            style={({ pressed, hovered }) => [
              styles.chip,
              isSelected && styles.chipActive,
              !isSelected && webHover(hovered, pressed, styles.chipHovered),
              pressed && styles.chipPressed,
            ]}>
            <Text style={[styles.value, isSelected && styles.valueActive]}>{count}</Text>
            <Text style={[styles.label, isSelected && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
