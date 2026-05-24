import type { WorkerProfile } from '@chairside/api';
import { isWorkerProfileComplete } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import {
  WORKER_FILLINS,
  WORKER_SETUP_APPLICATION,
  WORKER_SETUP_BASICS,
} from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerReadinessChecklistProps = {
  workerProfile: WorkerProfile | null;
};

type ChecklistItem = {
  id: string;
  title: string;
  body: string;
  done: boolean;
  optional?: boolean;
  onPress: () => void;
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
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
    },
    iconDone: { backgroundColor: colors.primarySubtle },
    textBlock: { flex: 1, gap: 2 },
    itemTitle: { ...typography.body, fontWeight: '600' },
    itemBody: { ...typography.subtitle, fontSize: 13, lineHeight: 18 },
    optional: { fontSize: 12, color: colors.labelTertiary },
  }));

  const backgroundComplete = isWorkerProfileComplete(workerProfile);
  const hasResume = Boolean(workerProfile?.resume_storage_path?.trim());
  const fillInOn = workerProfile?.short_notice_available ?? false;

  const items: ChecklistItem[] = [
    {
      id: 'background',
      title: 'Add your background',
      body: 'Role, experience, and location — required for everything.',
      done: backgroundComplete,
      onPress: () => router.push(WORKER_SETUP_BASICS),
    },
    {
      id: 'kit',
      title: 'Add a resume',
      body: 'Optional — attach a PDF to role applications.',
      done: hasResume,
      optional: true,
      onPress: () => router.push(WORKER_SETUP_APPLICATION),
    },
    {
      id: 'fillins',
      title: 'Turn on fill-in availability',
      body: 'Optional — only if you want temp shift work.',
      done: fillInOn,
      optional: true,
      onPress: () => router.push(WORKER_FILLINS),
    },
  ];

  if (backgroundComplete) return null;

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.title}>Get started</Text>
        <Text style={styles.subtitle}>Complete these steps to apply and receive fill-ins.</Text>
      </View>
      {items.map((item) => (
        <Pressable key={item.id} style={styles.item} onPress={item.onPress}>
          <View style={[styles.iconWrap, item.done && styles.iconDone]}>
            <Ionicons
              name={item.done ? 'checkmark' : 'ellipse-outline'}
              size={16}
              color={item.done ? colors.primary : colors.labelSecondary}
            />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemBody}>{item.body}</Text>
            {item.optional ? <Text style={styles.optional}>Optional</Text> : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
