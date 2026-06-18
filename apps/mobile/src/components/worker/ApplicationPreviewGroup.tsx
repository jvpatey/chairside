import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cardShellRadii } from '@/components/ui/cardLayout';
import { useThemedStyles } from '@/theme';

type ApplicationPreviewGroupProps = {
  title?: string;
  children: ReactNode;
};

export function ApplicationPreviewGroup({ title, children }: ApplicationPreviewGroupProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    group: {
      backgroundColor: colors.fillSubtle,
      borderRadius: cardShellRadii.inner,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    title: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.45,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
      marginBottom: spacing.xs,
    },
  }));

  return (
    <View style={styles.group}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}
