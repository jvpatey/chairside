import { ReactNode } from 'react';
import { View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

type WorkerBrowseWebLayoutProps = {
  list: ReactNode;
  map?: ReactNode;
  showMap?: boolean;
};

/** Native passthrough. */
export function WorkerBrowseWebLayout({ list }: { list: ReactNode; map?: ReactNode; showMap?: boolean }) {
  return <>{list}</>;
}
