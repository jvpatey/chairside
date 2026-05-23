import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type BulletListProps = {
  items: string[];
  label?: string;
};

export function BulletList({ items, label }: BulletListProps) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    wrap: {
      gap: spacing.xs,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: typography.subtitle.color,
    },
    item: {
      ...typography.subtitle,
      lineHeight: 20,
    },
  }));

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {items.map((item) => (
        <Text key={item} style={styles.item}>
          • {item}
        </Text>
      ))}
    </View>
  );
}
