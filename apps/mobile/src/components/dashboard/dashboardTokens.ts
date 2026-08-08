/** Shared sizing for dashboard aside widgets (Messages, Calendar, Plan usage). */
export const dashboardWidgetTokens = {
  iconBadge: {
    size: 32,
    borderRadius: 10,
    iconSize: 17,
  },
  headerTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  headerAction: {
    fontSize: 14,
  },
} as const;

/** File-tab workspace tabs — larger than aside widgets, still consistent across tabs. */
export const dashboardTabTokens = {
  iconBadge: {
    size: 32,
    compactSize: 28,
    borderRadius: 10,
    compactBorderRadius: 8,
    iconSize: 16,
    compactIconSize: 15,
  },
} as const;
