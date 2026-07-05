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

/** Desktop-grade dashboard layout rhythm for web. */
export function getDashboardLayoutStyles({ spacing }: Pick<Theme, 'spacing'>) {
  const sectionGap = dashboardSectionGap(spacing);
  const headerStackGap = dashboardHeaderStackGap(spacing);

  return {
    flow: {
      gap: headerStackGap,
    },
    content: {
      gap: sectionGap,
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
    overviewBlock: {
      gap: sectionGap,
    },
    asideStack: {
      gap: sectionGap,
    },
    /** Full-width hero above the two-column body. */
    desktopShell: {
      gap: sectionGap,
      width: '100%',
      alignSelf: 'stretch' as const,
    },
    /** Supplementary widgets below the full-width overview on wide web. */
    desktopSupplementary: {
      width: '100%',
      alignSelf: 'stretch' as const,
      gap: sectionGap,
    },
    /** Two-column dashboard grid at wide/xwide widths. */
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
      position: 'sticky' as const,
      top: spacing.lg,
      alignSelf: 'flex-start' as const,
    },
  };
}
