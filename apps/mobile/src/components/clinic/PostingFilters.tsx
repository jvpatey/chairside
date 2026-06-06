import { useState } from 'react';

import { FilterSheet, FilterSheetSection } from '@/components/ui/FilterSheet';
import { FilterTriggerButton } from '@/components/ui/FilterTriggerButton';
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

type RolePostingFiltersProps = {
  statusFilter: JobStatusFilter;
  roleTypeFilter: RoleTypeFilter;
  onStatusChange: (value: JobStatusFilter) => void;
  onRoleTypeChange: (value: RoleTypeFilter) => void;
};

function countRolePostingFilterChanges(
  statusFilter: JobStatusFilter,
  roleTypeFilter: RoleTypeFilter,
  defaults: { statusFilter: JobStatusFilter; roleTypeFilter: RoleTypeFilter },
): number {
  return (
    (statusFilter === defaults.statusFilter ? 0 : 1) +
    (roleTypeFilter === defaults.roleTypeFilter ? 0 : 1)
  );
}

type RoleTypeFiltersProps = {
  roleTypeFilter: RoleTypeFilter;
  onRoleTypeChange: (value: RoleTypeFilter) => void;
  accessibilityLabel?: string;
  sheetTitle?: string;
};

export function RoleTypeFilters({
  roleTypeFilter,
  onRoleTypeChange,
  accessibilityLabel = 'Filter by role type',
  sheetTitle = 'Filter by role',
}: RoleTypeFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const defaultRoleType: RoleTypeFilter = 'all';
  const activeCount = roleTypeFilter === defaultRoleType ? 0 : 1;

  return (
    <>
      <FilterTriggerButton
        activeCount={activeCount}
        onPress={() => setSheetOpen(true)}
        accessibilityLabel={accessibilityLabel}
      />
      <FilterSheet
        visible={sheetOpen}
        title={sheetTitle}
        onClose={() => setSheetOpen(false)}
        onReset={() => onRoleTypeChange(defaultRoleType)}
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

export function RolePostingFilters({
  statusFilter,
  roleTypeFilter,
  onStatusChange,
  onRoleTypeChange,
}: RolePostingFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const defaults = { statusFilter: 'all' as JobStatusFilter, roleTypeFilter: 'all' as RoleTypeFilter };
  const activeCount = countRolePostingFilterChanges(statusFilter, roleTypeFilter, defaults);

  const handleReset = () => {
    onStatusChange(defaults.statusFilter);
    onRoleTypeChange(defaults.roleTypeFilter);
  };

  return (
    <>
      <FilterTriggerButton
        activeCount={activeCount}
        onPress={() => setSheetOpen(true)}
        accessibilityLabel="Filter roles"
      />
      <FilterSheet
        visible={sheetOpen}
        title="Filter roles"
        onClose={() => setSheetOpen(false)}
        onReset={handleReset}
      >
        <FilterSheetSection
          label="Status"
          options={JOB_STATUS_FILTER_OPTIONS}
          selected={statusFilter}
          onChange={onStatusChange}
        />
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

type ShiftPostingFilterDefaults = {
  statusFilter?: ShiftStatusFilter;
  roleTypeFilter?: RoleTypeFilter;
  shiftDateFilter?: ShiftDateFilter;
};

type ShiftPostingFiltersProps = {
  statusFilter: ShiftStatusFilter;
  roleTypeFilter: RoleTypeFilter;
  shiftDateFilter: ShiftDateFilter;
  onStatusChange: (value: ShiftStatusFilter) => void;
  onRoleTypeChange: (value: RoleTypeFilter) => void;
  onShiftDateChange: (value: ShiftDateFilter) => void;
  defaults?: ShiftPostingFilterDefaults;
  statusOptions?: { value: ShiftStatusFilter; label: string }[];
  includeStatusInSheet?: boolean;
  includeDateInSheet?: boolean;
};

function countShiftPostingFilterChanges(
  statusFilter: ShiftStatusFilter,
  roleTypeFilter: RoleTypeFilter,
  shiftDateFilter: ShiftDateFilter,
  defaults: Required<ShiftPostingFilterDefaults>,
): number {
  return (
    (statusFilter === defaults.statusFilter ? 0 : 1) +
    (roleTypeFilter === defaults.roleTypeFilter ? 0 : 1) +
    (shiftDateFilter === defaults.shiftDateFilter ? 0 : 1)
  );
}

export function ShiftPostingFilters({
  statusFilter,
  roleTypeFilter,
  shiftDateFilter,
  onStatusChange,
  onRoleTypeChange,
  onShiftDateChange,
  defaults,
  statusOptions = SHIFT_STATUS_FILTER_OPTIONS,
  includeStatusInSheet = true,
  includeDateInSheet = true,
}: ShiftPostingFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const resolvedDefaults: Required<ShiftPostingFilterDefaults> = {
    statusFilter: defaults?.statusFilter ?? 'open',
    roleTypeFilter: defaults?.roleTypeFilter ?? 'all',
    shiftDateFilter: defaults?.shiftDateFilter ?? 'all',
  };
  const activeCount = countShiftPostingFilterChanges(
    statusFilter,
    roleTypeFilter,
    shiftDateFilter,
    resolvedDefaults,
  );

  const handleReset = () => {
    onStatusChange(resolvedDefaults.statusFilter);
    onRoleTypeChange(resolvedDefaults.roleTypeFilter);
    onShiftDateChange(resolvedDefaults.shiftDateFilter);
  };

  return (
    <>
      <FilterTriggerButton
        activeCount={activeCount}
        onPress={() => setSheetOpen(true)}
        accessibilityLabel="Filter fill-ins"
      />
      <FilterSheet
        visible={sheetOpen}
        title="Filter fill-ins"
        onClose={() => setSheetOpen(false)}
        onReset={handleReset}
      >
        {includeStatusInSheet ? (
          <FilterSheetSection
            label="Status"
            options={statusOptions}
            selected={statusFilter}
            onChange={onStatusChange}
          />
        ) : null}
        <FilterSheetSection
          label="Role type"
          options={ROLE_TYPE_FILTER_OPTIONS}
          selected={roleTypeFilter}
          onChange={onRoleTypeChange}
        />
        {includeDateInSheet ? (
          <FilterSheetSection
            label="Shift date"
            options={SHIFT_DATE_FILTER_OPTIONS}
            selected={shiftDateFilter}
            onChange={onShiftDateChange}
          />
        ) : null}
      </FilterSheet>
    </>
  );
}
