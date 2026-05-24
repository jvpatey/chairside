import { scoreSoftwareMatch } from './softwareMatch';

export type MatchLevel = 'strong' | 'partial' | 'missing';

export type MatchBreakdown = {
  overall: number;
  roleFit: MatchLevel;
  experience: MatchLevel;
  availability: MatchLevel;
  location: MatchLevel;
  software: MatchLevel;
};

export function calculateMatchScore(input: {
  postRoleType: string;
  postSoftware?: string[];
  workerRoleType?: string | null;
  workerSoftware?: string[] | null;
  workerTravelRadiusKm?: number | null;
  distanceKm?: number | null;
}): MatchBreakdown {
  const roleFit: MatchLevel =
    input.workerRoleType && input.workerRoleType === input.postRoleType
      ? 'strong'
      : input.workerRoleType
        ? 'partial'
        : 'missing';

  const software = scoreSoftwareMatch(input.postSoftware, input.workerSoftware);

  const location: MatchLevel =
    input.distanceKm == null || input.workerTravelRadiusKm == null
      ? 'partial'
      : input.distanceKm <= input.workerTravelRadiusKm
        ? 'strong'
        : 'missing';

  const experience: MatchLevel = 'partial';
  const availability: MatchLevel = 'partial';
  const scoreMap: Record<MatchLevel, number> = { strong: 100, partial: 60, missing: 20 };
  const overall = Math.round(
    (scoreMap[roleFit] +
      scoreMap[experience] +
      scoreMap[availability] +
      scoreMap[location] +
      scoreMap[software]) /
      5,
  );

  return {
    overall,
    roleFit,
    experience,
    availability,
    location,
    software,
  };
}
