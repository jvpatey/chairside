import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { useTheme } from '@/theme';

type PublicLegalPageShellProps = {
  children: ReactNode;
};

/** Shared shell for public legal/support pages — subtle brand wash at the top. */
export function PublicLegalPageShell({ children }: PublicLegalPageShellProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppAtmosphere intensity="subtle" />
      {children}
    </View>
  );
}
