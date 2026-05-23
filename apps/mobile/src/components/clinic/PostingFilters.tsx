import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  JOB_STATUS_FILTER_OPTIONS,
  ROLE_TYPE_FILTER_OPTIONS,
  SHIFT_DATE_FILTER_OPTIONS,
  SHIFT_STATUS_FILTER_OPTIONS,
  type JobStatusFilter,
  type RoleTypeFilter,
  type ShiftDateFilter,
  type ShiftStatusFilter,
} from '@/lib/postingFilters';
import { useTheme, useThemedStyles } from '@/theme';

function FilterSheetSection<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
}) {
  const styles = useThemedStyles(({ spacing, colors }) => ({
    section: {
      gap: spacing.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <ChipSelector options={options} selected={selected} onChange={(value) => onChange(value as T)} />
    </View>
  );
}

type FilterSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onReset: () => void;
  children: React.ReactNode;
};

function FilterSheet({ visible, title, onClose, onReset, children }: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      gap: spacing.lg,
      maxHeight: '80%',
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    title: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600',
    },
    reset: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    content: {
      gap: spacing.lg,
    },
    footer: {
      gap: spacing.sm,
    },
  }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onReset} accessibilityRole="button" accessibilityLabel="Reset filters">
              <Text style={styles.reset}>Reset</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          <View style={styles.footer}>
            <OnboardingButton label="Done" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type FilterBarProps = {
  statusOptions: { value: string; label: string }[];
  statusFilter: string;
  onStatusChange: (value: string) => void;
  extraFilterCount: number;
  onOpenSheet: () => void;
  style?: StyleProp<ViewStyle>;
};

function FilterBar({
  statusOptions,
  statusFilter,
  onStatusChange,
  extraFilterCount,
  onOpenSheet,
  style,
}: FilterBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    statusScroll: {
      flex: 1,
    },
    moreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: extraFilterCount > 0 ? colors.primary : colors.separator,
      backgroundColor: extraFilterCount > 0 ? colors.primarySubtle : colors.surface,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 8,
    },
    moreLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: extraFilterCount > 0 ? colors.primary : colors.labelPrimary,
    },
    badge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primaryOnPrimary,
    },
  }));

  return (
    <View style={[styles.row, style]}>
      <View style={styles.statusScroll}>
        <ChipSelector
          horizontal
          compact
          options={statusOptions}
          selected={statusFilter}
          onChange={(value) => onStatusChange(value as string)}
        />
      </View>
      <Pressable
        style={styles.moreButton}
        onPress={onOpenSheet}
        accessibilityRole="button"
        accessibilityLabel="More filters"
      >
        <Ionicons
          name="options-outline"
          size={16}
          color={extraFilterCount > 0 ? colors.primary : colors.labelPrimary}
        />
        <Text style={styles.moreLabel}>More</Text>
        {extraFilterCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{extraFilterCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

type RolePostingFiltersProps = {
  statusFilter: JobStatusFilter;
  roleTypeFilter: RoleTypeFilter;
  onStatusChange: (value: JobStatusFilter) => void;
  onRoleTypeChange: (value: RoleTypeFilter) => void;
};

export function RolePostingFilters({
  statusFilter,
  roleTypeFilter,
  onStatusChange,
  onRoleTypeChange,
}: RolePostingFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const extraFilterCount = roleTypeFilter === 'all' ? 0 : 1;

  return (
    <>
      <FilterBar
        statusOptions={JOB_STATUS_FILTER_OPTIONS}
        statusFilter={statusFilter}
        onStatusChange={(value) => onStatusChange(value as JobStatusFilter)}
        extraFilterCount={extraFilterCount}
        onOpenSheet={() => setSheetOpen(true)}
      />
      <FilterSheet
        visible={sheetOpen}
        title="Filter roles"
        onClose={() => setSheetOpen(false)}
        onReset={() => onRoleTypeChange('all')}
      >
        <FilterSheetSection
          label="Role type"
          options={ROLE_TYPE_FILTER_OPTIONS}
          selected={roleTypeFilter}
          onChange={onRoleTypeChange}
        />
      </FilterSheet>
    </>
  );
}

type ShiftPostingFiltersProps = {
  statusFilter: ShiftStatusFilter;
  roleTypeFilter: RoleTypeFilter;
  shiftDateFilter: ShiftDateFilter;
  onStatusChange: (value: ShiftStatusFilter) => void;
  onRoleTypeChange: (value: RoleTypeFilter) => void;
  onShiftDateChange: (value: ShiftDateFilter) => void;
};

export function ShiftPostingFilters({
  statusFilter,
  roleTypeFilter,
  shiftDateFilter,
  onStatusChange,
  onRoleTypeChange,
  onShiftDateChange,
}: ShiftPostingFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const extraFilterCount =
    (roleTypeFilter === 'all' ? 0 : 1) + (shiftDateFilter === 'all' ? 0 : 1);

  const handleReset = () => {
    onRoleTypeChange('all');
    onShiftDateChange('all');
  };

  return (
    <>
      <FilterBar
        statusOptions={SHIFT_STATUS_FILTER_OPTIONS}
        statusFilter={statusFilter}
        onStatusChange={(value) => onStatusChange(value as ShiftStatusFilter)}
        extraFilterCount={extraFilterCount}
        onOpenSheet={() => setSheetOpen(true)}
      />
      <FilterSheet
        visible={sheetOpen}
        title="Filter fill-ins"
        onClose={() => setSheetOpen(false)}
        onReset={handleReset}
      >
        <FilterSheetSection
          label="Role type"
          options={ROLE_TYPE_FILTER_OPTIONS}
          selected={roleTypeFilter}
          onChange={onRoleTypeChange}
        />
        <FilterSheetSection
          label="Shift date"
          options={SHIFT_DATE_FILTER_OPTIONS}
          selected={shiftDateFilter}
          onChange={onShiftDateChange}
        />
      </FilterSheet>
    </>
  );
}
