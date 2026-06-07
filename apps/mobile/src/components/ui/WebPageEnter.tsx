import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type WebPageEnterProps = {
  children: ReactNode;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
};

/** Native passthrough — web animation lives in WebPageEnter.web.tsx */
export function WebPageEnter({ children, style }: WebPageEnterProps) {
  return <View style={style}>{children}</View>;
}
