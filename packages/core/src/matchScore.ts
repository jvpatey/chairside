import { scoreEmploymentMatch } from './employmentMatch';
import {
  matchableSoftwareTokens,
  scoreSoftwareMatch,
  softwareOverlapTokens,
} from './softwareMatch';

export type MatchLevel = 'strong' | 'partial' | 'missing';
export type MatchTier = 'strong' | 'good' | 'partial' | 'none';
export type MatchCriterion = 'roleFit' | 'software' | 'location' | 'employmentType';

export type JobMatchBreakdown = {
  tier: MatchTier;
  roleFit: MatchLevel;
  software: MatchLevel;
  location: MatchLevel;
  employmentType: MatchLevel;
  postHasMatchableSoftware: boolean;
};

export type JobMatchContext = {
  postRoleType: string;
  /** @deprecated Prefer workerRoleTypes. Kept for legacy stored match snapshots. */
  workerRoleType?: string | null;
  workerRoleTypes?: string[] | null;
  postEmploymentType: string;
  workerPreferredEmploymentTypes?: string[] | null;
  postSoftware?: string[] | null;
  workerSoftware?: string[] | null;
  distanceKm?: number | null;
  workerTravelRadiusKm?: number | null;
};

export type StoredJobMatchBreakdown = {
  roleFit: MatchLevel;
  software: MatchLevel;
  location: MatchLevel;
  employmentType: MatchLevel;
  postHasMatchableSoftware: boolean;
  context?: Partial<JobMatchContext>;
};

export type MatchCriterionDetail = {
  id: MatchCriterion;
  title: string;
  level: MatchLevel;
  explanation: string;
};

export type MatchDetailAudience = 'worker' | 'clinic';

const TIER_LABELS: Record<MatchTier, string> = {
  strong: 'Strong match',
  good: 'Good match',
  partial: 'Partial match',
  none: 'Not a match',
};

const CRITERION_TITLES: Record<MatchCriterion, string> = {
  roleFit: 'Role',
  software: 'Software',
  location: 'Location',
  employmentType: 'Employment type',
};

export function getMatchTierLabel(tier: MatchTier): string {
  return TIER_LABELS[tier];
}

export function getMatchTierRank(tier: MatchTier): number {
  switch (tier) {
    case 'strong':
      return 0;
    case 'good':
      return 1;
    case 'partial':
      return 2;
    default:
      return 3;
  }
}

function scoreRoleMatch(
  postRoleType: string,
  workerRoleTypes?: string[] | null,
  workerRoleType?: string | null,
): MatchLevel {
  const roles =
    workerRoleTypes && workerRoleTypes.length > 0
      ? workerRoleTypes
      : workerRoleType
        ? [workerRoleType]
        : [];

  if (roles.length === 0) return 'missing';
  if (roles.includes(postRoleType)) return 'strong';
  return 'missing';
}

function scoreLocationMatch(
  distanceKm?: number | null,
  workerTravelRadiusKm?: number | null,
): MatchLevel {
  if (distanceKm == null || workerTravelRadiusKm == null) return 'partial';
  if (distanceKm <= workerTravelRadiusKm) return 'strong';
  return 'missing';
}

export function deriveMatchTier(
  breakdown: Omit<JobMatchBreakdown, 'tier'>,
): MatchTier {
  if (breakdown.roleFit === 'missing' || breakdown.location === 'missing') {
    return 'none';
  }

  const secondaryMissing = [breakdown.software, breakdown.employmentType].filter(
    (level) => level === 'missing',
  ).length;

  const softwareOkForStrong =
    breakdown.software === 'strong' ||
    (breakdown.software === 'partial' && !breakdown.postHasMatchableSoftware);

  if (
    breakdown.roleFit === 'strong' &&
    breakdown.location === 'strong' &&
    breakdown.employmentType === 'strong' &&
    softwareOkForStrong
  ) {
    return 'strong';
  }

  if (
    breakdown.roleFit === 'strong' &&
    (breakdown.location === 'strong' || breakdown.location === 'partial') &&
    secondaryMissing <= 1
  ) {
    return 'good';
  }

  return 'partial';
}

export function calculateJobMatch(input: JobMatchContext): JobMatchBreakdown {
  const postHasMatchableSoftware =
    matchableSoftwareTokens(input.postSoftware).length > 0;

  const roleFit = scoreRoleMatch(
    input.postRoleType,
    input.workerRoleTypes,
    input.workerRoleType,
  );
  const software = scoreSoftwareMatch(input.postSoftware, input.workerSoftware);
  const location = scoreLocationMatch(input.distanceKm, input.workerTravelRadiusKm);
  const employmentType = scoreEmploymentMatch(
    input.postEmploymentType,
    input.workerPreferredEmploymentTypes,
  );

  const breakdown = {
    roleFit,
    software,
    location,
    employmentType,
    postHasMatchableSoftware,
  };

  return {
    tier: deriveMatchTier(breakdown),
    ...breakdown,
  };
}

export function jobMatchBreakdownFromStored(
  tier: MatchTier | null | undefined,
  stored: StoredJobMatchBreakdown | null | undefined,
): JobMatchBreakdown | null {
  if (!tier || !stored?.roleFit) return null;

  return {
    tier,
    roleFit: stored.roleFit,
    software: stored.software,
    location: stored.location,
    employmentType: stored.employmentType,
    postHasMatchableSoftware: stored.postHasMatchableSoftware ?? false,
  };
}

function formatList(values: string[]): string {
  if (values.length === 0) return 'Not specified';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

function formatDistance(km: number): string {
  if (km < 1) return 'Less than 1 km away';
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

export function getMatchCriterionDetails(
  breakdown: JobMatchBreakdown,
  context: Partial<JobMatchContext> & {
    postRoleLabel?: string;
    workerRoleLabel?: string;
    workerRoleLabels?: string[];
    postEmploymentLabel?: string;
    workerEmploymentLabels?: string[];
  },
  audience: MatchDetailAudience = 'worker',
): MatchCriterionDetail[] {
  const postRole = context.postRoleLabel ?? context.postRoleType ?? 'This role';
  const workerRoles =
    context.workerRoleTypes && context.workerRoleTypes.length > 0
      ? context.workerRoleTypes
      : context.workerRoleType
        ? [context.workerRoleType]
        : [];
  const workerRole =
    context.workerRoleLabel ??
    (context.workerRoleLabels?.length
      ? formatList(context.workerRoleLabels)
      : workerRoles.length > 0
        ? formatList(workerRoles)
        : audience === 'clinic'
          ? "the applicant's stated role"
          : 'your profile');
  const postEmployment =
    context.postEmploymentLabel ?? context.postEmploymentType ?? 'This role';
  const workerEmployment =
    context.workerEmploymentLabels ??
    (context.workerPreferredEmploymentTypes ?? []).map((value) => value);
  const applicantRolePhrase =
    audience === 'clinic' ? `the applicant's role (${workerRole})` : workerRole;

  const postSoftware = matchableSoftwareTokens(context.postSoftware);
  const softwareOverlap = softwareOverlapTokens(context.postSoftware, context.workerSoftware);
  const softwareMissing = postSoftware.filter((item) => !softwareOverlap.includes(item));

  const roleExplanation =
    breakdown.roleFit === 'strong'
      ? audience === 'clinic'
        ? `${postRole} matches ${applicantRolePhrase}.`
        : `${postRole} matches ${workerRole}.`
      : breakdown.roleFit === 'missing'
        ? audience === 'clinic'
          ? `${postRole} does not match ${applicantRolePhrase}.`
          : `${postRole} does not match ${workerRole}.`
        : audience === 'clinic'
          ? `${postRole} may not align with ${applicantRolePhrase}.`
          : `${postRole} may not align with ${workerRole}.`;

  const softwareExplanation =
    audience === 'clinic'
      ? breakdown.software === 'strong'
        ? `Applicant knows all required software (${formatList(postSoftware)}).`
        : breakdown.software === 'partial'
          ? postSoftware.length === 0
            ? 'This role did not list specific software requirements.'
            : softwareMissing.length > 0
              ? `Applicant knows ${formatList(softwareOverlap)}, but this role also requires ${formatList(softwareMissing)}.`
              : `Applicant knows some required software (${formatList(softwareOverlap)}).`
          : postSoftware.length === 0
            ? 'Software requirements were not listed for this role.'
            : `Applicant does not list the required software (${formatList(postSoftware)}).`
      : breakdown.software === 'strong'
        ? `You know all required software (${formatList(postSoftware)}).`
        : breakdown.software === 'partial'
          ? postSoftware.length === 0
            ? 'This role did not list specific software requirements.'
            : softwareMissing.length > 0
              ? `You know ${formatList(softwareOverlap)}, but this role also requires ${formatList(softwareMissing)}.`
              : `You know some required software (${formatList(softwareOverlap)}).`
          : postSoftware.length === 0
            ? 'Software requirements were not listed for this role.'
            : `You do not match the required software (${formatList(postSoftware)}).`;

  const locationExplanation =
    audience === 'clinic'
      ? breakdown.location === 'strong'
        ? context.distanceKm != null
          ? `Applicant is ${formatDistance(context.distanceKm)} — within their stated travel range.`
          : 'Applicant is within their stated travel range.'
        : breakdown.location === 'missing'
          ? context.distanceKm != null
            ? `Applicant is ${formatDistance(context.distanceKm)} — outside their stated travel range.`
            : 'Applicant is outside their stated travel range.'
          : 'Applicant location could not be fully verified.'
      : breakdown.location === 'strong'
        ? context.distanceKm != null
          ? `${formatDistance(context.distanceKm)} — within your travel range.`
          : 'Within your travel range.'
        : breakdown.location === 'missing'
          ? context.distanceKm != null
            ? `${formatDistance(context.distanceKm)} — outside your travel range.`
            : 'Outside your travel range.'
          : 'Location could not be fully verified.';

  const employmentExplanation =
    audience === 'clinic'
      ? breakdown.employmentType === 'strong'
        ? `This role offers ${postEmployment}, which matches what the applicant is seeking.`
        : breakdown.employmentType === 'missing'
          ? `This role is ${postEmployment}; applicant prefers ${formatList(workerEmployment)}.`
          : 'Applicant has not listed preferred employment types.'
      : breakdown.employmentType === 'strong'
        ? `${postEmployment} matches your preferred employment types.`
        : breakdown.employmentType === 'missing'
          ? `${postEmployment} is not in your preferred employment types (${formatList(workerEmployment)}).`
          : 'You have not set preferred employment types on your profile.';

  return [
    {
      id: 'roleFit',
      title: CRITERION_TITLES.roleFit,
      level: breakdown.roleFit,
      explanation: roleExplanation,
    },
    {
      id: 'software',
      title: CRITERION_TITLES.software,
      level: breakdown.software,
      explanation: softwareExplanation,
    },
    {
      id: 'location',
      title: CRITERION_TITLES.location,
      level: breakdown.location,
      explanation: locationExplanation,
    },
    {
      id: 'employmentType',
      title: CRITERION_TITLES.employmentType,
      level: breakdown.employmentType,
      explanation: employmentExplanation,
    },
  ];
}
