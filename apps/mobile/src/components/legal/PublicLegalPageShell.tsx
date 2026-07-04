import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AuthHeroGlow } from '@/components/onboarding/AuthHeroGlow';
import { useTheme } from '@/theme';

type PublicLegalPageShellProps = {
  children: ReactNode;
};

/** Shared shell for public legal/support pages — brand hero glow behind scroll content. */
export function PublicLegalPageShell({ children }: PublicLegalPageShellProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthHeroGlow />
      {children}
    </View>
  );
}
