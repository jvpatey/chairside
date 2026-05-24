import type { ClinicProfile } from '@chairside/api';
import { isClinicProfileComplete } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { CLINIC_SETUP_BASICS } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

type ClinicReadinessChecklistProps = {
  clinicProfile: ClinicProfile | null;
};

export function ClinicReadinessChecklist({ clinicProfile }: ClinicReadinessChecklistProps) {
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
    textBlock: { flex: 1, gap: 2 },
    itemTitle: { ...typography.body, fontWeight: '600' },
    itemBody: { ...typography.subtitle, fontSize: 13, lineHeight: 18 },
  }));

  if (isClinicProfileComplete(clinicProfile)) return null;

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.title}>Get started</Text>
        <Text style={styles.subtitle}>Complete your profile to post roles and fill-in shifts.</Text>
      </View>
      <Pressable style={styles.item} onPress={() => router.push(CLINIC_SETUP_BASICS)}>
        <View style={styles.iconWrap}>
          <Ionicons name="ellipse-outline" size={16} color={colors.labelSecondary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.itemTitle}>Complete your clinic profile</Text>
          <Text style={styles.itemBody}>Practice details, location, and contact.</Text>
        </View>
      </Pressable>
    </View>
  );
}
