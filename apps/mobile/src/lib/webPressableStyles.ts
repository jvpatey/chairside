import { Platform, type ViewStyle } from 'react-native';

export const IS_WEB = Platform.OS === 'web';

/** Pointer + transition for interactive pressables on web. */
export function webPointer(): ViewStyle {
  if (!IS_WEB) return {};
  return {
    // @ts-expect-error — cursor is web-only
    cursor: 'pointer',
    // @ts-expect-error — transitionDuration is web-only
    transitionDuration: '140ms',
  };
}

/** Returns hover style only on web when hovered and not pressed. */
export function webHover(
  hovered: boolean,
  pressed: boolean,
  style: ViewStyle,
): ViewStyle | false {
  if (!IS_WEB || !hovered || pressed) return false;
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
};

/** Hover styles for bordered tile/card pressables. */
export function webTileHoverStyles(colors: HoverColors, isDark: boolean): ViewStyle {
  return {
    backgroundColor: colors.fillSubtle,
    borderColor: colors.labelTertiary,
    // @ts-expect-error — boxShadow is web-only
    boxShadow: webTileHoverShadow(isDark),
  };
}

/** Hover styles for flat list rows. */
export function webListRowHoverStyles(colors: Pick<HoverColors, 'fillSubtle'>): ViewStyle {
  return {
    backgroundColor: colors.fillSubtle,
  };
}
