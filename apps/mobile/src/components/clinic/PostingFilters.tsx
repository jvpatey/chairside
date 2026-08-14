import { FilterSheetSection } from '@/components/ui/FilterSheet';
import { AdaptiveFilterShell } from '@/components/ui/AdaptiveFilterShell';
import type { GradientAccent } from '@/theme';
import {
  CLINIC_DISCOVER_SORT_OPTIONS,
  type ClinicDiscoverSort,
} from '@/lib/clinicDiscoverFilters';
import {
  CLINIC_FILL_IN_SORT_OPTIONS,
  CLINIC_ROLE_SORT_OPTIONS,
  DEFAULT_CLINIC_FILL_IN_SORT,
  DEFAULT_CLINIC_ROLE_SORT,
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
  type ClinicFillInSort,
  type ClinicRoleSort,
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

type RoleTypeFiltersProps = {
  roleTypeFilter: RoleTypeFilter;
  onRoleTypeChange: (value: RoleTypeFilter) => void;
  accessibilityLabel?: string;
  sheetTitle?: string;
  disabled?: boolean;
};

export function RoleTypeFilters({
  roleTypeFilter,
  onRoleTypeChange,
  accessibilityLabel = 'Filter by role type',
  sheetTitle = 'Filter by role',
  disabled = false,
}: RoleTypeFiltersProps) {
  const defaultRoleType: RoleTypeFilter = 'all';
  const activeCount = roleTypeFilter === defaultRoleType ? 0 : 1;

  return (
    <AdaptiveFilterShell
      activeCount={activeCount}
      onReset={() => onRoleTypeChange(defaultRoleType)}
      title={sheetTitle}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
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

type RolePostingFiltersProps = {
  roleTypeFilter: RoleTypeFilter;
  sort: ClinicRoleSort;
  onRoleTypeChange: (value: RoleTypeFilter) => void;
  onSortChange: (value: ClinicRoleSort) => void;
  accessibilityLabel?: string;
  sheetTitle?: string;
  disabled?: boolean;
};

export function RolePostingFilters({
  roleTypeFilter,
  sort,
  onRoleTypeChange,
  onSortChange,
  accessibilityLabel = 'Filter roles',
  sheetTitle = 'Filter roles',
  disabled = false,
}: RolePostingFiltersProps) {
  const defaults = {
    roleTypeFilter: 'all' as RoleTypeFilter,
    sort: DEFAULT_CLINIC_ROLE_SORT,
  };
  const activeCount =
    (roleTypeFilter === defaults.roleTypeFilter ? 0 : 1) + (sort === defaults.sort ? 0 : 1);

  return (
    <AdaptiveFilterShell
      activeCount={activeCount}
      onReset={() => {
        onRoleTypeChange(defaults.roleTypeFilter);
        onSortChange(defaults.sort);
      }}
      title={sheetTitle}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
    >
      <FilterSheetSection
        label="Sort by"
        options={CLINIC_ROLE_SORT_OPTIONS}
        selected={sort}
        onChange={onSortChange}
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

type ClinicDiscoverFiltersProps = {
  roleTypeFilter: RoleTypeFilter;
  sort: ClinicDiscoverSort;
  distanceFilter: WorkerDistanceFilter;
  onRoleTypeChange: (value: RoleTypeFilter) => void;
  onSortChange: (value: ClinicDiscoverSort) => void;
  onDistanceFilterChange: (value: WorkerDistanceFilter) => void;
  accessibilityLabel?: string;
  sheetTitle?: string;
  disabled?: boolean;
};

export function ClinicDiscoverFilters({
  roleTypeFilter,
  sort,
  distanceFilter,
  onRoleTypeChange,
  onSortChange,
  onDistanceFilterChange,
  accessibilityLabel = 'Filter discover',
  sheetTitle = 'Filter discover',
  disabled = false,
}: ClinicDiscoverFiltersProps) {
  const defaults = {
    roleTypeFilter: 'all' as RoleTypeFilter,
    sort: 'distance' as ClinicDiscoverSort,
    distanceFilter: 'all' as WorkerDistanceFilter,
  };
  const activeCount =
    (roleTypeFilter === defaults.roleTypeFilter ? 0 : 1) +
    (sort === defaults.sort ? 0 : 1) +
    (distanceFilter === defaults.distanceFilter ? 0 : 1);

  const handleReset = () => {
    onRoleTypeChange(defaults.roleTypeFilter);
    onSortChange(defaults.sort);
    onDistanceFilterChange(defaults.distanceFilter);
  };

  return (
    <AdaptiveFilterShell
      activeCount={activeCount}
      onReset={handleReset}
      title={sheetTitle}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
    >
      <FilterSheetSection
        label="Role type"
        options={ROLE_TYPE_FILTER_OPTIONS}
        selected={roleTypeFilter}
        onChange={onRoleTypeChange}
      />
      <FilterSheetSection
        label="Sort"
        options={CLINIC_DISCOVER_SORT_OPTIONS}
        selected={sort}
        onChange={onSortChange}
      />
      <FilterSheetSection
        label="Distance"
        options={WORKER_DISTANCE_FILTER_OPTIONS}
        selected={distanceFilter}
        onChange={onDistanceFilterChange}
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

type ShiftPostingFilterDefaults = {
  statusFilter?: ShiftStatusFilter;
  roleTypeFilter?: RoleTypeFilter;
  shiftDateFilter?: ShiftDateFilter;
  sort?: ClinicFillInSort;
};

type ShiftPostingFiltersProps = {
  statusFilter: ShiftStatusFilter;
  roleTypeFilter: RoleTypeFilter;
  shiftDateFilter: ShiftDateFilter;
  sort?: ClinicFillInSort;
  onStatusChange: (value: ShiftStatusFilter) => void;
  onRoleTypeChange: (value: RoleTypeFilter) => void;
  onShiftDateChange: (value: ShiftDateFilter) => void;
  onSortChange?: (value: ClinicFillInSort) => void;
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
  sort: ClinicFillInSort,
  defaults: Required<ShiftPostingFilterDefaults>,
): number {
  return (
    (statusFilter === defaults.statusFilter ? 0 : 1) +
    (roleTypeFilter === defaults.roleTypeFilter ? 0 : 1) +
    (shiftDateFilter === defaults.shiftDateFilter ? 0 : 1) +
    (sort === defaults.sort ? 0 : 1)
  );
}

export function ShiftPostingFilters({
  statusFilter,
  roleTypeFilter,
  shiftDateFilter,
  sort = DEFAULT_CLINIC_FILL_IN_SORT,
  onStatusChange,
  onRoleTypeChange,
  onShiftDateChange,
  onSortChange,
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
    sort: defaults?.sort ?? DEFAULT_CLINIC_FILL_IN_SORT,
  };
  const activeCount = countShiftPostingFilterChanges(
    statusFilter,
    roleTypeFilter,
    shiftDateFilter,
    sort,
    resolvedDefaults,
  );

  const handleReset = () => {
    onStatusChange(resolvedDefaults.statusFilter);
    onRoleTypeChange(resolvedDefaults.roleTypeFilter);
    onShiftDateChange(resolvedDefaults.shiftDateFilter);
    onSortChange?.(resolvedDefaults.sort);
  };

  return (
    <AdaptiveFilterShell
      activeCount={activeCount}
      onReset={handleReset}
      title="Filter fill-ins"
      accessibilityLabel="Filter fill-ins"
      accent={accent}
    >
      {onSortChange ? (
        <FilterSheetSection
          label="Sort by"
          options={CLINIC_FILL_IN_SORT_OPTIONS}
          selected={sort}
          onChange={onSortChange}
          accent={accent}
        />
      ) : null}
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
