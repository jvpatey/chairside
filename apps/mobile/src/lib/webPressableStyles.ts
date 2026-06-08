import { Platform, type ViewStyle } from 'react-native';

export const IS_WEB = Platform.OS === 'web';

export function webOnlyStyle(style: ViewStyle): ViewStyle {
  return IS_WEB ? (style as ViewStyle) : {};
}

/** Pointer + transition for interactive pressables on web. */
export function webPointer(cursor: 'default' | 'pointer' = 'pointer'): ViewStyle {
  return webOnlyStyle({
    cursor,
    transitionDuration: '140ms',
  } as ViewStyle);
}

/** Returns hover style only on web when hovered and not pressed. */
export function webHover(
  hovered: boolean,
  pressed: boolean,
  style: ViewStyle,
  disabled = false,
): ViewStyle | false {
  if (!IS_WEB || disabled || !hovered || pressed) return false;
  return style;
}

export function webTileHoverShadow(isDark: boolean): string {
  return isDark
    ? '0 4px 12px rgba(0, 0, 0, 0.2)'
    : '0 4px 12px rgba(0, 0, 0, 0.07)';
}

type HoverColors = {
  fillSubtle: string;
  labelTertiary: string;
  separator?: string;
  primarySubtle?: string;
};

/** Hover styles for bordered tile/card pressables. */
export function webTileHoverStyles(colors: HoverColors, isDark: boolean): ViewStyle {
  return webOnlyStyle({
    backgroundColor: colors.fillSubtle,
    borderColor: colors.labelTertiary,
    boxShadow: webTileHoverShadow(isDark),
  } as ViewStyle);
}

/** Hover styles for flat list rows. */
export function webListRowHoverStyles(colors: Pick<HoverColors, 'fillSubtle'>): ViewStyle {
  return {
    backgroundColor: colors.fillSubtle,
  };
}

/** Hover styles for circular icon buttons (notification bell, sign out, etc.). */
export function webIconButtonHoverStyles(
  colors: Pick<HoverColors, 'separator'>,
): ViewStyle {
  return {
    backgroundColor: colors.separator,
  };
}

/** Hover styles for pill/chip controls when unselected. */
export function webChipHoverStyles(colors: Pick<HoverColors, 'fillSubtle' | 'labelTertiary'>): ViewStyle {
  return {
    backgroundColor: colors.fillSubtle,
    borderColor: colors.labelTertiary,
  };
}

/** Hover styles for primary text links (Back, Edit, View all). */
export function webTextLinkHoverStyles(colors: Pick<HoverColors, 'fillSubtle'>): ViewStyle {
  return webOnlyStyle({
    backgroundColor: colors.fillSubtle,
    borderRadius: 8,
  } as ViewStyle);
}

/** Hover styles for pill action buttons (Add photo, etc.). */
export function webPillButtonHoverStyles(colors: Pick<HoverColors, 'separator'>): ViewStyle {
  return {
    backgroundColor: colors.separator,
  };
}

/** Scales RN Switch to better match web UI proportions. */
export function webSwitchStyle(): ViewStyle {
  return webOnlyStyle({
    transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }],
  } as ViewStyle);
}

/** Extends row hover/press area to edges of a padded card container. */
export function webFullBleedRowInsets(padding: number): ViewStyle {
  return {
    marginHorizontal: -padding,
    paddingHorizontal: padding,
  };
}
