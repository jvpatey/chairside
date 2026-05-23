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

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
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
      <Text style={styles.title}>{title}</Text>
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

export function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  const display = value?.trim() || '—';

  const styles = useThemedStyles(({ spacing, colors }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    label: {
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    value: {
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
      color: colors.labelPrimary,
      textAlign: 'right',
    },
    valueEmpty: {
      color: colors.labelTertiary,
    },
  }));

  const isEmpty = display === '—';

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, isEmpty && styles.valueEmpty]}>{display}</Text>
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
