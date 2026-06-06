import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

export function RowDivider() {
  const styles = useThemedStyles(({ colors }) => ({
    divider: {
      height: 1,
      backgroundColor: colors.separator,
      opacity: 0.6,
    },
  }));

  return <View style={styles.divider} />;
}

export function DetailSection({ title, children }: { title?: string; children: ReactNode }) {
  const styles = useThemedStyles(({ spacing, colors }) => ({
    section: {
      gap: spacing.sm,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
    body: {
      gap: 0,
    },
  }));

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

export function DetailSectionDivider({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(({ spacing, colors }) => ({
    divider: {
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      opacity: 0.6,
    },
  }));

  return <View style={styles.divider}>{children}</View>;
}

export function DetailRow({
  label,
  value,
  layout = 'inline',
}: {
  label: string;
  value: string | null | undefined;
  layout?: 'inline' | 'stacked';
}) {
  const display = value?.trim() || '—';

  const styles = useThemedStyles(({ spacing, colors }) => ({
    rowInline: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    rowStacked: {
      gap: spacing.xs,
      paddingVertical: spacing.sm + 2,
    },
    label: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    labelInline: {
      flex: 1,
    },
    valueInline: {
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
      color: colors.labelPrimary,
      textAlign: 'right',
    },
    valueStacked: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelPrimary,
    },
    valueEmpty: {
      color: colors.labelTertiary,
    },
  }));

  const isEmpty = display === '—';

  if (layout === 'stacked') {
    return (
      <View style={styles.rowStacked}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.valueStacked, isEmpty && styles.valueEmpty]}>{display}</Text>
      </View>
    );
  }

  return (
    <View style={styles.rowInline}>
      <Text style={[styles.label, styles.labelInline]}>{label}</Text>
      <Text style={[styles.valueInline, isEmpty && styles.valueEmpty]}>{display}</Text>
    </View>
  );
}

export function DetailProse({ text }: { text: string }) {
  const styles = useThemedStyles(({ colors }) => ({
    prose: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelPrimary,
      paddingBottom: 4,
    },
  }));

  return <Text style={styles.prose}>{text}</Text>;
}

export function DetailBulletList({ items }: { items: string[] }) {
  const styles = useThemedStyles(({ colors }) => ({
    prose: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelPrimary,
      paddingBottom: 4,
    },
  }));

  if (items.length === 0) return null;

  return <Text style={styles.prose}>{items.map((item) => `• ${item}`).join('\n')}</Text>;
}
