import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { PillBadge } from '@/components/ui/PillBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import type { WorkerMapItem } from '@/lib/workerMapItems';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

type WorkerMapPostCardProps = {
  item: WorkerMapItem;
  onPress: () => void;
};

export function WorkerMapPostCard({ item, onPress }: WorkerMapPostCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    content: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    chevron: {
      flexShrink: 0,
      marginTop: 2,
    },
    eyebrow: {
      fontSize: 11,
      fontFamily: fontSemibold,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    title: {
      ...typography.body,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    detail: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    pay: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      marginTop: spacing.xs,
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
  }));

  return (
    <SurfaceCard onPress={onPress} padding="md">
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>{item.roleLabel}</Text>
          <Text style={styles.title}>{item.title}</Text>
          {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
          {item.pay ? <Text style={styles.pay}>{item.pay}</Text> : null}
          {item.isSaved || item.hasApplied ? (
            <View style={styles.statusRow}>
              {item.isSaved ? (
                <PillBadge
                  label="Saved"
                  color={colors.labelSecondary}
                  backgroundColor={colors.fillSubtle}
                />
              ) : null}
              {item.hasApplied ? (
                <PillBadge
                  label="Applied"
                  color={colors.primary}
                  backgroundColor={colors.primarySubtle}
                />
              ) : null}
            </View>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.labelTertiary}
          style={styles.chevron}
        />
      </View>
    </SurfaceCard>
  );
}
