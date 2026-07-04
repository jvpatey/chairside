export type DashboardSpotlightRole = 'worker' | 'clinic';

export const DASHBOARD_SPOTLIGHT_DISMISS_KEYS: Record<DashboardSpotlightRole, string> = {
  worker: 'chairside.dashboardSpotlight.dismissed.v1.worker',
  clinic: 'chairside.dashboardSpotlight.dismissed.v1.clinic',
};
