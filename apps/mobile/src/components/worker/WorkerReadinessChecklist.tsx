import type { WorkerProfile } from '@chairside/api';
import { isWorkerProfileComplete } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { WORKER_SETUP_BASICS } from '@/lib/routing';
import {
  webFullBleedRowInsets,
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerReadinessChecklistProps = {
  workerProfile: WorkerProfile | null;
};

export function WorkerReadinessChecklist({ workerProfile }: WorkerReadinessChecklistProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: { ...typography.body, fontWeight: '700', fontSize: 17 },
    subtitle: typography.subtitle,
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 10,
      ...webFullBleedRowInsets(spacing.lg),
      ...webPointer(),
    },
    itemHovered: webListRowHoverStyles(colors),
    itemPressed: {
      opacity: 0.88,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
    },
    textBlock: { flex: 1, gap: 2 },
    itemTitle: { ...typography.body, fontWeight: '600' },
    itemBody: { ...typography.subtitle, fontSize: 13, lineHeight: 18 },
  }));

  if (isWorkerProfileComplete(workerProfile)) return null;

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.title}>Get started</Text>
        <Text style={styles.subtitle}>Add your background to apply and receive fill-ins.</Text>
      </View>
      <Pressable
        style={({ pressed, hovered }) => [
          styles.item,
          webHover(hovered, pressed, styles.itemHovered),
          pressed && styles.itemPressed,
        ]}
        onPress={() => router.push(WORKER_SETUP_BASICS)}>
        <View style={styles.iconWrap}>
          <Ionicons name="ellipse-outline" size={16} color={colors.labelSecondary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.itemTitle}>Add your background</Text>
          <Text style={styles.itemBody}>Role, experience, and location.</Text>
        </View>
      </Pressable>
    </View>
  );
}
