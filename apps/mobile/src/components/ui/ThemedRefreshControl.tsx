import { RefreshControl, type RefreshControlProps } from 'react-native';

import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { useTheme, type GradientAccent } from '@/theme';

type ThemedRefreshControlProps = Omit<RefreshControlProps, 'colors' | 'tintColor'> & {
  accent?: GradientAccent;
};

export function ThemedRefreshControl({
  accent,
  ...props
}: ThemedRefreshControlProps) {
  const { colors } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const tint = resolvedAccent === 'secondary' ? colors.secondary : colors.primary;

  return <RefreshControl {...props} tintColor={tint} colors={[tint]} />;
}
