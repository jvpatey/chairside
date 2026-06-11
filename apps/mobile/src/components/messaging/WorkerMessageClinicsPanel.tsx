import {
  getOrCreateGeneralConversation,
  listMessageableClinicsForWorker,
  type MessageableClinic,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';

import { MessageableClinicListItem } from '@/components/messaging/MessageableClinicListItem';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { Screen } from '@/components/ui/Screen';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getWorkerConversationRoute, WORKER_PROFILE } from '@/lib/routing';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';

const CLINICS_SUBTITLE = 'Clinics in your province that accept general inquiries.';

type WorkerMessageClinicsPanelProps = {
  /** Split-view master pane: Screen shell with back navigation. */
  embedded?: boolean;
  scroll?: boolean;
  fillsContainer?: boolean;
  onBack?: () => void;
  backLabel?: string;
  /** Split view: open conversation in detail pane instead of navigating. */
  onConversationStarted?: (
    conversationId: string,
    title: string,
    subtitle: string,
  ) => void;
};

export function WorkerMessageClinicsPanel({
  embedded = false,
  scroll,
  fillsContainer = false,
  onBack,
  backLabel = 'Messages',
  onConversationStarted,
}: WorkerMessageClinicsPanelProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { workerProfile } = useWorkerProfile();
  const [clinics, setClinics] = useState<MessageableClinic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    content: { gap: spacing.lg },
    scroll: { flex: 1 },
    scrollContent: {
      gap: spacing.lg,
      paddingBottom: spacing.md,
    },
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

  const openConversation = useCallback(
    (conversationId: string, title: string) => {
      if (onConversationStarted) {
        onConversationStarted(conversationId, title, 'General inquiry');
        return;
      }

      router.push(
        getWorkerConversationRoute(conversationId, {
          conversationId,
          title,
          subtitle: 'General inquiry',
        }),
      );
    },
    [onConversationStarted],
  );

  const handleClinicPress = async (clinic: MessageableClinic) => {
    if (!user?.id || isStarting) return;

    if (clinic.existing_conversation_id) {
      openConversation(clinic.existing_conversation_id, clinic.clinic_name);
      return;
    }

    setIsStarting(true);
    try {
      const conversationId = await getOrCreateGeneralConversation(clinic.id);
      openConversation(conversationId, clinic.clinic_name);
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

  const body = (
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
            <BrowseListGroup>
              {filteredClinics.map((clinic) => (
                <MessageableClinicListItem
                  key={clinic.id}
                  clinic={clinic}
                  compact={embedded}
                  onPress={() => {
                    void handleClinicPress(clinic);
                  }}
                />
              ))}
            </BrowseListGroup>
          )}
        </>
      )}
    </View>
  );

  if (embedded) {
    const scrollableBody =
      scroll === false && fillsContainer ? (
        <ScrollView
          style={[styles.scroll, webScrollbarStyles()]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator>
          {body}
        </ScrollView>
      ) : (
        body
      );

    return (
      <Screen
        title="Message a clinic"
        subtitle={CLINICS_SUBTITLE}
        onBack={onBack}
        backLabel={backLabel}
        constrainWidth={false}
        scroll={scroll ?? true}
        fillsContainer={fillsContainer}
        animateEntry={false}
      >
        {scrollableBody}
      </Screen>
    );
  }

  return (
    <ProfileDetailScreen
      title="Message a clinic"
      subtitle={CLINICS_SUBTITLE}
      onBack={onBack ?? (() => router.back())}>
      {body}
    </ProfileDetailScreen>
  );
}
