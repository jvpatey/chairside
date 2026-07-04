import { FilterSheetSection } from '@/components/ui/FilterSheet';
import { AdaptiveFilterShell } from '@/components/ui/AdaptiveFilterShell';
import type { GradientAccent } from '@/theme';
import {
  JOB_STATUS_FILTER_OPTIONS,
  PAY_LISTED_FILTER_OPTIONS,
  ROLE_TYPE_FILTER_OPTIONS,
  SHIFT_DATE_FILTER_OPTIONS,
  SHIFT_STATUS_FILTER_OPTIONS,
  WORKER_AVAILABILITY_FILTER_OPTIONS,
  WORKER_BROWSE_SORT_OPTIONS,
  WORKER_DISTANCE_FILTER_OPTIONS,
  WORKER_MATCH_TIER_FILTER_OPTIONS,
  WORKER_SOFTWARE_FILTER_OPTIONS,
  SAVED_ONLY_FILTER_OPTIONS,
  type JobStatusFilter,
  type PayListedFilter,
  type RoleTypeFilter,
  type SavedOnlyFilter,
  type ShiftDateFilter,
  type ShiftStatusFilter,
  type WorkerAvailabilityFilter,
  type WorkerBrowseSort,
  type WorkerDistanceFilter,
  type WorkerMatchTierFilter,
  type WorkerSoftwareFilter,
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
  const defaultRoleType: RoleTypeFilter = 'all';
  const activeCount = roleTypeFilter === defaultRoleType ? 0 : 1;

  return (
    <AdaptiveFilterShell
      activeCount={activeCount}
      onReset={() => onRoleTypeChange(defaultRoleType)}
      title={sheetTitle}
      accessibilityLabel={accessibilityLabel}
    >
      <FilterSheetSection
        label="Role type"
        options={ROLE_TYPE_FILTER_OPTIONS}
        selected={roleTypeFilter}
        onChange={onRoleTypeChange}
      />
    </AdaptiveFilterShell>
  );
}

type WorkerRoleBrowseFiltersProps = {
  roleTypeFilter: RoleTypeFilter;
  sort: WorkerBrowseSort;
  distanceFilter: WorkerDistanceFilter;
  softwareFilter: WorkerSoftwareFilter;
  payListedFilter: PayListedFilter;
  matchTierFilter: WorkerMatchTierFilter;
  onRoleTypeChange: (value: RoleTypeFilter) => void;
  onSortChange: (value: WorkerBrowseSort) => void;
  onDistanceFilterChange: (value: WorkerDistanceFilter) => void;
  onSoftwareFilterChange: (value: WorkerSoftwareFilter) => void;
  onPayListedFilterChange: (value: PayListedFilter) => void;
  onMatchTierFilterChange: (value: WorkerMatchTierFilter) => void;
};

export function WorkerRoleBrowseFilters({
  roleTypeFilter,
  sort,
  distanceFilter,
  softwareFilter,
  payListedFilter,
  matchTierFilter,
  onRoleTypeChange,
  onSortChange,
  onDistanceFilterChange,
  onSoftwareFilterChange,
  onPayListedFilterChange,
  onMatchTierFilterChange,
}: WorkerRoleBrowseFiltersProps) {
  const defaults = {
    roleTypeFilter: 'all' as RoleTypeFilter,
    sort: 'recommended' as WorkerBrowseSort,
    distanceFilter: 'all' as WorkerDistanceFilter,
    softwareFilter: 'all' as WorkerSoftwareFilter,
    payListedFilter: 'all' as PayListedFilter,
    matchTierFilter: 'all' as WorkerMatchTierFilter,
  };
  const activeCount =
    (roleTypeFilter === defaults.roleTypeFilter ? 0 : 1) +
    (sort === defaults.sort ? 0 : 1) +
    (distanceFilter === defaults.distanceFilter ? 0 : 1) +
    (softwareFilter === defaults.softwareFilter ? 0 : 1) +
    (payListedFilter === defaults.payListedFilter ? 0 : 1) +
    (matchTierFilter === defaults.matchTierFilter ? 0 : 1);

  const handleReset = () => {
    onRoleTypeChange(defaults.roleTypeFilter);
    onSortChange(defaults.sort);
    onDistanceFilterChange(defaults.distanceFilter);
    onSoftwareFilterChange(defaults.softwareFilter);
    onPayListedFilterChange(defaults.payListedFilter);
    onMatchTierFilterChange(defaults.matchTierFilter);
  };

  return (
    <AdaptiveFilterShell
      activeCount={activeCount}
      onReset={handleReset}
      title="Filter roles"
      accessibilityLabel="Filter roles"
    >
      <FilterSheetSection
        label="Sort by"
        options={WORKER_BROWSE_SORT_OPTIONS}
        selected={sort}
        onChange={onSortChange}
      />
      <FilterSheetSection
        label="Distance"
        options={WORKER_DISTANCE_FILTER_OPTIONS}
        selected={distanceFilter}
        onChange={onDistanceFilterChange}
      />
      <FilterSheetSection
        label="Role type"
        options={ROLE_TYPE_FILTER_OPTIONS}
        selected={roleTypeFilter}
        onChange={onRoleTypeChange}
      />
      <FilterSheetSection
        label="Match tier"
        options={WORKER_MATCH_TIER_FILTER_OPTIONS}
        selected={matchTierFilter}
        onChange={onMatchTierFilterChange}
      />
      <FilterSheetSection
        label="Software"
        options={WORKER_SOFTWARE_FILTER_OPTIONS}
        selected={softwareFilter}
        onChange={onSoftwareFilterChange}
      />
      <FilterSheetSection
        label="Pay"
        options={PAY_LISTED_FILTER_OPTIONS}
        selected={payListedFilter}
        onChange={onPayListedFilterChange}
      />
    </AdaptiveFilterShell>
  );
}

type WorkerFillInBrowseFiltersProps = {
  roleTypeFilter: RoleTypeFilter;
  sort: WorkerBrowseSort;
  distanceFilter: WorkerDistanceFilter;
  softwareFilter: WorkerSoftwareFilter;
  payListedFilter: PayListedFilter;
  availabilityFilter: WorkerAvailabilityFilter;
  savedOnlyFilter: SavedOnlyFilter;
  onRoleTypeChange: (value: RoleTypeFilter) => void;
  onSortChange: (value: WorkerBrowseSort) => void;
  onDistanceFilterChange: (value: WorkerDistanceFilter) => void;
  onSoftwareFilterChange: (value: WorkerSoftwareFilter) => void;
  onPayListedFilterChange: (value: PayListedFilter) => void;
  onAvailabilityFilterChange: (value: WorkerAvailabilityFilter) => void;
  onSavedOnlyFilterChange: (value: SavedOnlyFilter) => void;
  accent?: GradientAccent;
};

export function WorkerFillInBrowseFilters({
  roleTypeFilter,
  sort,
  distanceFilter,
  softwareFilter,
  payListedFilter,
  availabilityFilter,
  savedOnlyFilter,
  onRoleTypeChange,
  onSortChange,
  onDistanceFilterChange,
  onSoftwareFilterChange,
  onPayListedFilterChange,
  onAvailabilityFilterChange,
  onSavedOnlyFilterChange,
  accent = 'secondary',
}: WorkerFillInBrowseFiltersProps) {
  const defaults = {
    roleTypeFilter: 'all' as RoleTypeFilter,
    sort: 'recommended' as WorkerBrowseSort,
    distanceFilter: 'all' as WorkerDistanceFilter,
    softwareFilter: 'all' as WorkerSoftwareFilter,
    payListedFilter: 'all' as PayListedFilter,
    availabilityFilter: 'all' as WorkerAvailabilityFilter,
    savedOnlyFilter: 'all' as SavedOnlyFilter,
  };
  const activeCount =
    (roleTypeFilter === defaults.roleTypeFilter ? 0 : 1) +
    (sort === defaults.sort ? 0 : 1) +
    (distanceFilter === defaults.distanceFilter ? 0 : 1) +
    (softwareFilter === defaults.softwareFilter ? 0 : 1) +
    (payListedFilter === defaults.payListedFilter ? 0 : 1) +
    (availabilityFilter === defaults.availabilityFilter ? 0 : 1) +
    (savedOnlyFilter === defaults.savedOnlyFilter ? 0 : 1);

  const handleReset = () => {
    onRoleTypeChange(defaults.roleTypeFilter);
    onSortChange(defaults.sort);
    onDistanceFilterChange(defaults.distanceFilter);
    onSoftwareFilterChange(defaults.softwareFilter);
    onPayListedFilterChange(defaults.payListedFilter);
    onAvailabilityFilterChange(defaults.availabilityFilter);
    onSavedOnlyFilterChange(defaults.savedOnlyFilter);
  };

  return (
    <AdaptiveFilterShell
      activeCount={activeCount}
      onReset={handleReset}
      title="Filter fill-ins"
      accessibilityLabel="Filter fill-ins"
      accent={accent}
    >
      <FilterSheetSection
        label="Sort by"
        options={WORKER_BROWSE_SORT_OPTIONS}
        selected={sort}
        onChange={onSortChange}
        accent={accent}
      />
      <FilterSheetSection
        label="Distance"
        options={WORKER_DISTANCE_FILTER_OPTIONS}
        selected={distanceFilter}
        onChange={onDistanceFilterChange}
        accent={accent}
      />
      <FilterSheetSection
        label="Role type"
        options={ROLE_TYPE_FILTER_OPTIONS}
        selected={roleTypeFilter}
        onChange={onRoleTypeChange}
        accent={accent}
      />
      <FilterSheetSection
        label="Availability"
        options={WORKER_AVAILABILITY_FILTER_OPTIONS}
        selected={availabilityFilter}
        onChange={onAvailabilityFilterChange}
        accent={accent}
      />
      <FilterSheetSection
        label="Software"
        options={WORKER_SOFTWARE_FILTER_OPTIONS}
        selected={softwareFilter}
        onChange={onSoftwareFilterChange}
        accent={accent}
      />
      <FilterSheetSection
        label="Pay"
        options={PAY_LISTED_FILTER_OPTIONS}
        selected={payListedFilter}
        onChange={onPayListedFilterChange}
        accent={accent}
      />
      <FilterSheetSection
        label="Saved"
        options={SAVED_ONLY_FILTER_OPTIONS}
        selected={savedOnlyFilter}
        onChange={onSavedOnlyFilterChange}
        accent={accent}
      />
    </AdaptiveFilterShell>
  );
}

export function RolePostingFilters({
  statusFilter,
  roleTypeFilter,
  onStatusChange,
  onRoleTypeChange,
}: RolePostingFiltersProps) {
  const defaults = { statusFilter: 'all' as JobStatusFilter, roleTypeFilter: 'all' as RoleTypeFilter };
  const activeCount = countRolePostingFilterChanges(statusFilter, roleTypeFilter, defaults);

  const handleReset = () => {
    onStatusChange(defaults.statusFilter);
    onRoleTypeChange(defaults.roleTypeFilter);
  };

  return (
    <AdaptiveFilterShell
      activeCount={activeCount}
      onReset={handleReset}
      title="Filter roles"
      accessibilityLabel="Filter roles"
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
    </AdaptiveFilterShell>
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
  accent?: GradientAccent;
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
  accent = 'secondary',
}: ShiftPostingFiltersProps) {
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
    <AdaptiveFilterShell
      activeCount={activeCount}
      onReset={handleReset}
      title="Filter fill-ins"
      accessibilityLabel="Filter fill-ins"
      accent={accent}
    >
      {includeStatusInSheet ? (
        <FilterSheetSection
          label="Status"
          options={statusOptions}
          selected={statusFilter}
          onChange={onStatusChange}
          accent={accent}
        />
      ) : null}
      <FilterSheetSection
        label="Role type"
        options={ROLE_TYPE_FILTER_OPTIONS}
        selected={roleTypeFilter}
        onChange={onRoleTypeChange}
        accent={accent}
      />
      {includeDateInSheet ? (
        <FilterSheetSection
          label="Shift date"
          options={SHIFT_DATE_FILTER_OPTIONS}
          selected={shiftDateFilter}
          onChange={onShiftDateChange}
          accent={accent}
        />
      ) : null}
    </AdaptiveFilterShell>
  );
}
