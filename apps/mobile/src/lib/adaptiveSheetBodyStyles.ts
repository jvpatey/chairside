import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import { webHiddenScrollbarStyles } from '@/lib/webScrollbarStyles';
import { webTypography } from '@/theme/web';

type AdaptiveSheetColors = {
  separator: string;
  labelPrimary: string;
};

/** Shared layout tokens for sheet bodies rendered inside WebDialogShell on tablet+ web. */
export function adaptiveSheetRoot(isDialog: boolean): ViewStyle {
  if (!isDialog) return {};
  return {
    width: '100%',
    alignItems: 'stretch',
  };
}

export function adaptiveSheetScroll(isDialog: boolean, maxHeight = 560): ViewStyle {
  const base: ViewStyle = {
    flexGrow: 0,
    flexShrink: 1,
  };

  if (!isDialog) return base;

  return {
    ...base,
    maxHeight,
    width: '100%',
    alignSelf: 'stretch',
    ...webHiddenScrollbarStyles(),
  };
}

export function adaptiveSheetScrollContent(isDialog: boolean, extra?: ViewStyle): ViewStyle {
  if (!isDialog) return extra ?? {};
  return {
    flexGrow: 1,
    alignItems: 'stretch',
    width: '100%',
    ...extra,
  };
}

export function adaptiveSheetHeader(isDialog: boolean, colors: AdaptiveSheetColors): ViewStyle {
  if (!isDialog) return {};
  return {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  };
}

export function adaptiveSheetFooter(isDialog: boolean, colors: AdaptiveSheetColors): ViewStyle {
  if (!isDialog) return {};
  return {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  };
}

export function adaptiveSheetTitle(
  isDialog: boolean,
  colors: AdaptiveSheetColors,
  sheetTitle: TextStyle,
): TextStyle {
  if (!isDialog) return sheetTitle;

  return {
    ...webTypography.title,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.35,
    color: colors.labelPrimary,
  };
}

export function adaptiveSheetCenteredBody(isDialog: boolean, minHeight = 320): ViewStyle {
  if (!isDialog) return {};
  return {
    minHeight,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  };
}
