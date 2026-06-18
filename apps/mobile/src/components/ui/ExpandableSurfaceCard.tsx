import type { ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  webFullBleedRowInsets,
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { spacing, useThemedStyles, type GradientAccent } from '@/theme';

import { CardExpandToggle } from './CardExpandToggle';
import { SurfaceCard, type SurfaceCardVariant } from './SurfaceCard';

type ExpandableSurfaceCardProps = {
  header: ReactNode;
  expanded: boolean;
  onToggleExpand: () => void;
  children?: ReactNode;
  variant?: SurfaceCardVariant;
  padding?: 'md' | 'lg';
  bleedPadding?: number;
  style?: StyleProp<ViewStyle>;
  accent?: GradientAccent;
};

/**
 * Standard expandable card shell: surface + title band + expand toggle + body.
 */
export function ExpandableSurfaceCard({
  header,
  expanded,
  onToggleExpand,
  children,
  variant = 'default',
  padding = 'md',
  bleedPadding,
  style,
  accent,
}: ExpandableSurfaceCardProps) {
  const bleed = bleedPadding ?? (padding === 'lg' ? spacing.lg : spacing.md);

  const styles = useThemedStyles(({ spacing, colors }) => ({
    cardHeaderPressable: {
      alignSelf: 'stretch',
      borderRadius: 12,
      ...webFullBleedRowInsets(bleed),
      marginTop: -bleed,
      paddingTop: bleed,
      ...webPointer(),
    },
    cardHeaderHovered: webListRowHoverStyles(colors),
    cardHeaderPressed: { opacity: 0.92 },
    expandedBody: {
      gap: spacing.md,
      paddingTop: spacing.xs,
    },
  }));

  return (
    <SurfaceCard variant={variant} padding={padding} gap style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggleExpand();
        }}
        style={({ pressed, hovered }) => [
          styles.cardHeaderPressable,
          webHover(hovered, pressed, styles.cardHeaderHovered),
          pressed && styles.cardHeaderPressed,
        ]}>
        {header}
      </Pressable>

      <CardExpandToggle
        expanded={expanded}
        onPress={onToggleExpand}
        bleedPadding={bleed}
        suppressHover
        accent={accent}
      />

      {expanded && children ? <View style={styles.expandedBody}>{children}</View> : null}
    </SurfaceCard>
  );
}
