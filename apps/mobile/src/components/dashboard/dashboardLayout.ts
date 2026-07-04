import { Platform } from 'react-native';

import type { Theme } from '@/theme';

/** Shared vertical gap for the mobile dashboard header stack and header-to-content spacing. */
export function dashboardHeaderStackGap(spacing: Pick<Theme, 'spacing'>['spacing']) {
  return spacing.sm;
}

/** Shared corner radii for dashboard controls — aligned tiers, softer than full pill. */
export const dashboardControlRadii = {
  quickAction: 22,
  statBar: 20,
  statSegment: 16,
} as const;

/** Vertical gap between major dashboard sections (hero, actions, overview, etc.). */
export function dashboardSectionGap(spacing: Pick<Theme, 'spacing'>['spacing']) {
  return spacing.lg;
}

/** Shared spacing rhythm for dashboard screens on phone and tablet. */
export function getDashboardLayoutStyles({ spacing }: Pick<Theme, 'spacing'>) {
  const sectionGap = dashboardSectionGap(spacing);
  const headerStackGap = dashboardHeaderStackGap(spacing);

  return {
    /** Wraps brand header + dashboard body so spacing matches the header text rhythm. */
    flow: {
      gap: headerStackGap,
    },
    content: {
      gap: sectionGap,
      ...(Platform.OS === 'web' ? { paddingTop: spacing.sm } : null),
    },
    section: {
      gap: spacing.sm,
    },
    heroSection: {
      gap: spacing.sm,
    },
    quickActionSection: {
      gap: spacing.sm,
    },
    quickActionRow: {
      flexDirection: 'row' as const,
      gap: spacing.md,
    },
    /** Stat cards + overview list share one vertical rhythm block. */
    overviewBlock: {
      gap: sectionGap,
    },
    asideStack: {
      gap: sectionGap,
    },
    desktopShell: {
      gap: sectionGap,
      width: '100%',
      alignSelf: 'stretch' as const,
    },
    desktopSupplementary: {
      width: '100%',
      alignSelf: 'stretch' as const,
      gap: sectionGap,
    },
    desktopGrid: {
      flexDirection: 'row' as const,
      gap: spacing.xl,
      alignItems: 'flex-start' as const,
    },
    desktopMain: {
      flex: 1,
      minWidth: 0,
      gap: sectionGap,
    },
    desktopAside: {
      flex: 0,
      width: 320,
      minWidth: 300,
      maxWidth: 340,
      gap: sectionGap,
      ...(Platform.OS === 'web'
        ? {
            position: 'sticky' as const,
            top: spacing.lg,
            alignSelf: 'flex-start' as const,
          }
        : null),
    },
  };
}
