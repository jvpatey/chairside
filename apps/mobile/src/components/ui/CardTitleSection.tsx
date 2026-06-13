import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { GradientHairline } from '@/components/ui/GradientHairline';
import { useThemedStyles } from '@/theme';

/** Gradient hairline between card header and body content. */
export function CardSectionDivider() {
  return <GradientHairline />;
}

type CardContentSectionProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Body region below the card header divider. */
export function CardContentSection({ children, style }: CardContentSectionProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    section: {
      gap: spacing.sm,
      paddingTop: spacing.sm,
    },
  }));

  return <View style={[styles.section, style]}>{children}</View>;
}
