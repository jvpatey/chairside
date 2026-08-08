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
    size: 36,
    compactSize: 32,
    borderRadius: 10,
    compactBorderRadius: 8,
    iconSize: 18,
    compactIconSize: 16,
  },
  tabValue: {
    fontSize: 26,
    compactFontSize: 22,
    lineHeight: 30,
    compactLineHeight: 26,
  },
} as const;
