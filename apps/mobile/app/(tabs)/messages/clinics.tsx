import {
  getOrCreateGeneralConversation,
  listMessageableClinicsForWorker,
  type MessageableClinic,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';

import { MessageableClinicListItem } from '@/components/messaging/MessageableClinicListItem';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getWorkerConversationRoute, WORKER_PROFILE } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

export default function WorkerMessageClinicsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { workerProfile } = useWorkerProfile();
  const [clinics, setClinics] = useState<MessageableClinic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    content: { gap: spacing.lg },
    searchWrap: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    searchInput: {
      ...typography.body,
      color: colors.labelPrimary,
      padding: 0,
    },
    list: { gap: spacing.md },
    emptyCard: {
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.xl,
    },
    emptyIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
    },
    emptyTitle: {
      ...typography.body,
      fontSize: 18,
      fontWeight: '700',
      color: colors.labelPrimary,
      textAlign: 'center',
    },
    emptyBody: {
      ...typography.subtitle,
      textAlign: 'center',
    },
    provinceHint: typography.subtitle,
  }));

  const load = useCallback(async () => {
    if (!user?.id) {
      setClinics([]);
      return;
    }

    try {
      const rows = await listMessageableClinicsForWorker(user.id);
      setClinics(rows);
    } catch {
      setClinics([]);
    }
  }, [user?.id]);

  useRefreshOnFocus(load);

  const filteredClinics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return clinics;

    return clinics.filter((clinic) => {
      const haystack = [clinic.clinic_name, clinic.city, clinic.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [clinics, searchQuery]);

  const handleClinicPress = async (clinic: MessageableClinic) => {
    if (!user?.id || isStarting) return;

    if (clinic.existing_conversation_id) {
      router.push(
        getWorkerConversationRoute(clinic.existing_conversation_id, {
          conversationId: clinic.existing_conversation_id,
          title: clinic.clinic_name,
          subtitle: 'General inquiry',
        }),
      );
      return;
    }

    setIsStarting(true);
    try {
      const conversationId = await getOrCreateGeneralConversation(clinic.id);
      router.push(
        getWorkerConversationRoute(conversationId, {
          conversationId,
          title: clinic.clinic_name,
          subtitle: 'General inquiry',
        }),
      );
    } catch (error) {
      Alert.alert(
        'Could not start conversation',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsStarting(false);
    }
  };

  const profileComplete = Boolean(workerProfile?.setup_completed_at);

  return (
    <ProfileDetailScreen
      title="Message a clinic"
      subtitle="Clinics in your province that accept general inquiries."
      onBack={() => router.back()}>
      <View style={styles.content}>
        {workerProfile?.province ? (
          <Text style={styles.provinceHint}>Showing clinics in {workerProfile.province}.</Text>
        ) : null}

        {!profileComplete ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="person-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Complete your profile first</Text>
            <Text style={styles.emptyBody}>
              Finish your profile setup before messaging clinics directly.
            </Text>
            <OnboardingButton label="Go to profile" onPress={() => router.push(WORKER_PROFILE)} />
          </View>
        ) : (
          <>
            <View style={styles.searchWrap}>
              <TextInput
                accessibilityLabel="Search clinics"
                placeholder="Search by clinic name or city"
                placeholderTextColor={colors.labelTertiary}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            {filteredClinics.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No clinics available yet</Text>
                <Text style={styles.emptyBody}>
                  {clinics.length === 0
                    ? 'No clinics in your province are accepting general messages right now. Check back later or message a clinic from a role or fill-in application.'
                    : 'No clinics match your search. Try a different clinic name or city.'}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {filteredClinics.map((clinic) => (
                  <MessageableClinicListItem
                    key={clinic.id}
                    clinic={clinic}
                    onPress={() => {
                      void handleClinicPress(clinic);
                    }}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ProfileDetailScreen>
  );
}
