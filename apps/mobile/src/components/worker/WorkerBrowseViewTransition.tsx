import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { WorkerBrowseViewMode } from '@/lib/postingFilters';

type WorkerBrowseViewTransitionProps = {
  mode: WorkerBrowseViewMode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Passthrough wrapper — Reanimated enter/exit here crashed when tabs unmounted with pull-to-refresh active. */
export function WorkerBrowseViewTransition({
  children,
  style,
}: WorkerBrowseViewTransitionProps) {
  return (
    <View style={style} collapsable={false}>
      {children}
    </View>
  );
}
