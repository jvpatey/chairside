import type { Application } from '@chairside/api';
import { getEmploymentTypeLabel, getRoleTypeLabel } from '@chairside/config';
import type {
  JobMatchBreakdown,
  JobMatchContext,
  MatchTier,
  StoredJobMatchBreakdown,
} from '@chairside/core';
import { jobMatchBreakdownFromStored } from '@chairside/core';

type StoredMatchContext = NonNullable<StoredJobMatchBreakdown['context']>;

export function parseStoredMatchContext(
  raw: StoredJobMatchBreakdown['context'] | Record<string, unknown> | null | undefined,
): Partial<JobMatchContext> {
  if (!raw || typeof raw !== 'object') return {};

  const context = raw as StoredMatchContext;
  return {
    postRoleType: typeof context.postRoleType === 'string' ? context.postRoleType : undefined,
    workerRoleType:
      typeof context.workerRoleType === 'string' ? context.workerRoleType : null,
    postEmploymentType:
      typeof context.postEmploymentType === 'string' ? context.postEmploymentType : undefined,
    workerPreferredEmploymentTypes: Array.isArray(context.workerPreferredEmploymentTypes)
      ? context.workerPreferredEmploymentTypes.filter((value) => typeof value === 'string')
      : [],
    postSoftware: Array.isArray(context.postSoftware)
      ? context.postSoftware.filter((value) => typeof value === 'string')
      : [],
    workerSoftware: Array.isArray(context.workerSoftware)
      ? context.workerSoftware.filter((value) => typeof value === 'string')
      : [],
    distanceKm: typeof context.distanceKm === 'number' ? context.distanceKm : null,
    workerTravelRadiusKm:
      typeof context.workerTravelRadiusKm === 'number'
        ? context.workerTravelRadiusKm
        : null,
  };
}

export function buildMatchDisplayContext(
  context: Partial<JobMatchContext>,
): Partial<JobMatchContext> & {
  postRoleLabel?: string;
  workerRoleLabel?: string;
  postEmploymentLabel?: string;
  workerEmploymentLabels?: string[];
} {
  return {
    ...context,
    postRoleLabel: context.postRoleType ? getRoleTypeLabel(context.postRoleType) : undefined,
    workerRoleLabel: context.workerRoleType
      ? getRoleTypeLabel(context.workerRoleType)
      : undefined,
    postEmploymentLabel: context.postEmploymentType
      ? getEmploymentTypeLabel(context.postEmploymentType)
      : undefined,
    workerEmploymentLabels: (context.workerPreferredEmploymentTypes ?? []).map(
      getEmploymentTypeLabel,
    ),
  };
}

export function parseApplicationJobMatch(
  application: Pick<Application, 'match_tier' | 'match_breakdown'>,
): JobMatchBreakdown | null {
  return jobMatchBreakdownFromStored(
    application.match_tier as MatchTier | null,
    application.match_breakdown,
  );
}

export function getApplicationMatchDisplayContext(
  application: Pick<
    Application,
    'match_breakdown' | 'role_type' | 'software_used' | 'preferred_employment_types'
  >,
): ReturnType<typeof buildMatchDisplayContext> {
  const storedContext = parseStoredMatchContext(application.match_breakdown?.context);

  return buildMatchDisplayContext({
    ...storedContext,
    workerRoleType: storedContext.workerRoleType ?? application.role_type,
    workerSoftware: storedContext.workerSoftware ?? application.software_used,
    workerPreferredEmploymentTypes:
      storedContext.workerPreferredEmploymentTypes ??
      application.preferred_employment_types,
  });
}
