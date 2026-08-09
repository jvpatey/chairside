import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type WebPageEnterProps = {
  children: ReactNode;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
  /** When false, skip the fade/slide-in (e.g. split-view panes). */
  animate?: boolean;
  /** Web-only — native passthrough ignores this. */
  trigger?: 'mount' | 'visible';
};

/** Native passthrough — web animation lives in WebPageEnter.web.tsx */
export function WebPageEnter({ children, style }: WebPageEnterProps) {
  return <View style={style}>{children}</View>;
}
