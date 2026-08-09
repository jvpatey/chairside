import type { Ionicons } from '@expo/vector-icons';

export type DashboardHeroPulse = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type PulseSegment = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function composePulse(segments: PulseSegment[]): DashboardHeroPulse | null {
  if (segments.length === 0) return null;
  return {
    label: segments.map((segment) => segment.label).join(' · '),
    icon: segments[0].icon,
    onPress: segments[0].onPress,
  };
}

type BuildClinicHeroPulseInput = {
  newApplications: number;
  onOpenApplications: () => void;
};

export function buildClinicHeroPulse({
  newApplications,
  onOpenApplications,
}: BuildClinicHeroPulseInput): DashboardHeroPulse | null {
  const segments: PulseSegment[] = [];

  if (newApplications > 0) {
    segments.push({
      label: `${newApplications} new applicant${newApplications === 1 ? '' : 's'}`,
      icon: 'document-text-outline',
      onPress: onOpenApplications,
    });
  }

  return composePulse(segments);
}

type BuildWorkerHeroPulseInput = {
  applicationUpdateCount: number;
  onOpenApplications: () => void;
};

export function buildWorkerHeroPulse({
  applicationUpdateCount,
  onOpenApplications,
}: BuildWorkerHeroPulseInput): DashboardHeroPulse | null {
  const segments: PulseSegment[] = [];

  if (applicationUpdateCount > 0) {
    segments.push({
      label: `${applicationUpdateCount} application update${applicationUpdateCount === 1 ? '' : 's'}`,
      icon: 'document-text-outline',
      onPress: onOpenApplications,
    });
  }

  return composePulse(segments);
}
