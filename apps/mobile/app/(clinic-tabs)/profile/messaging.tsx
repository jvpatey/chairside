import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ClinicMessagingPreferences } from '@/components/clinic/ClinicMessagingPreferences';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { useThemedStyles } from '@/theme';

export default function ClinicProfileMessagingScreen() {
  const styles = useThemedStyles(({ spacing, colors }) => ({
    section: { gap: spacing.sm },
    label: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
  }));

  return (
    <ProfileDetailScreen
      title="Messaging"
      subtitle="Control how candidates can reach your clinic."
      onBack={() => router.back()}>
      <View style={styles.section}>
        <Text style={styles.label}>Candidate outreach</Text>
        <ClinicMessagingPreferences />
      </View>
    </ProfileDetailScreen>
  );
}
