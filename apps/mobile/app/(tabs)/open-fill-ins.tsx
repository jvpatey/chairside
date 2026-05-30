import { listLiveShiftPosts, type LiveShiftPost } from '@chairside/api';
import { getProvinceLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { COMPACT_ROLE_TYPE_FILTER_OPTIONS, type RoleTypeFilter } from '@/lib/postingFilters';
import { getWorkerShiftDetailRoute, WORKER_FILLINS } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function OpenFillInsEmptyState() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.fillSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    title: { ...typography.body, fontWeight: '600', textAlign: 'center' },
    body: { ...typography.subtitle, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="calendar-outline" size={24} color={colors.labelSecondary} />
      </View>
      <Text style={styles.title}>No open fill-ins</Text>
      <Text style={styles.body}>
        Check back soon — new fill-in shifts are posted throughout the week.
      </Text>
    </View>
  );
}

export default function OpenFillInsScreen() {
  const { workerProfile } = useWorkerProfile();
  const province = workerProfile?.province ?? 'NS';
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [roleTypeFilter, setRoleTypeFilter] = useState<RoleTypeFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const shiftRows = await listLiveShiftPosts(province);
      setShifts(shiftRows);
    } catch {
      setShifts([]);
      Alert.alert('Could not load fill-ins', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [province]);

  useRefreshOnFocus(load);

  const filteredShifts = useMemo(() => {
    if (roleTypeFilter === 'all') return shifts;
    return shifts.filter((shift) => shift.role_type === roleTypeFilter);
  }, [shifts, roleTypeFilter]);

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
    list: { gap: spacing.md },
  }));

  return (
    <OnboardingShell>
      <AuthScreenHeader
        title="Open fill-ins"
        subtitle={
          isLoading
            ? 'Loading…'
            : `${shifts.length} open in ${getProvinceLabel(province)}`
        }
        onBack={() => router.replace(WORKER_FILLINS)}
      />
      <View style={styles.content}>
        <ChipSelector
          options={COMPACT_ROLE_TYPE_FILTER_OPTIONS}
          selected={roleTypeFilter}
          onChange={(value) => setRoleTypeFilter(value as RoleTypeFilter)}
          horizontal
          compact
        />

        {filteredShifts.length === 0 && !isLoading ? (
          <OpenFillInsEmptyState />
        ) : (
          <View style={styles.list}>
            {filteredShifts.map((shift) => (
              <FillInListingCard
                key={shift.id}
                shift={shift}
                onPress={() => router.push(getWorkerShiftDetailRoute(shift.id, 'open-fill-ins'))}
              />
            ))}
          </View>
        )}
      </View>
    </OnboardingShell>
  );
}
