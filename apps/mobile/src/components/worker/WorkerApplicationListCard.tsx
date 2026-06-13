import type { WorkerApplication } from '@chairside/api';
import { formatApplicationDate } from '@chairside/config';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from 'react-native';
import { CardExpandToggle } from '@/components/ui/CardExpandToggle';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';

import { WorkerApplicationStatusLabel } from '@/components/matching/ApplicationStatusBadge';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { WorkerApplicationDetailCard } from '@/components/worker/WorkerApplicationDetailCard';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import { getWorkerApplicationRoute, type WorkerApplicationReturnTarget } from '@/lib/routing';
import { getWorkerShiftApplicationCardDisplay } from '@/lib/workerShiftApplicationDisplay';
import {
  webFullBleedRowInsets,
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { spacing, useThemedStyles } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type WorkerApplicationListCardProps = {
  application: WorkerApplication;
  hasUnreadMessages?: boolean;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  returnTo?: WorkerApplicationReturnTarget;
  onUpdated?: () => void;
  onHidden?: () => void;
  onViewPosting?: () => void;
  linkToDetail?: boolean;
};

export function WorkerApplicationListCard({
  application,
  hasUnreadMessages = false,
  expanded = false,
  onExpandChange,
  returnTo = 'applications-tab',
  onUpdated,
  onHidden,
  onViewPosting,
  linkToDetail = false,
}: WorkerApplicationListCardProps) {
  const {
    isApplicationHighlighted,
    getApplicationHighlightLabel,
    markApplicationSeen,
  } = useApplicationTabBadge();
  const isJob = application.post_type === 'job';
  const isShift = application.post_type === 'shift';
  const jobMatch = isJob ? parseApplicationJobMatch(application) : null;
  const matchContext = isJob ? getApplicationMatchDisplayContext(application) : null;
  const appliedLabel = formatApplicationDate(application.created_at);

  const isConfirmedShift = isShift && application.status === 'hired';
  const shiftDisplay = isShift ? getWorkerShiftApplicationCardDisplay(application) : null;
  const hasApplicationUpdate = isApplicationHighlighted(application);
  const applicationUpdateLabel = getApplicationHighlightLabel(application);

  const paddingTier = 'lg';
  const bleed = spacing.lg;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    cardHeaderPressable: {
      alignSelf: 'stretch',
      borderRadius: 12,
      ...webFullBleedRowInsets(bleed),
      marginTop: -bleed,
      paddingTop: bleed,
      ...webPointer(),
    },
    cardHeaderHovered: webListRowHoverStyles(colors),
    cardPressed: { opacity: 0.92 },
    expandedBody: {
      gap: spacing.sm,
    },
    appliedOn: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
  }));

  const location = shiftDisplay?.location ?? application.clinic_city;
  const appliedOnLabel = appliedLabel
    ? `${isShift ? 'Requested' : 'Applied'} ${appliedLabel}`
    : null;

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!expanded && hasApplicationUpdate) {
      void markApplicationSeen(application.id);
    }
    onExpandChange?.(!expanded);
  };

  const handlePress = () => {
    if (linkToDetail) {
      if (hasApplicationUpdate) {
        void markApplicationSeen(application.id);
      }
      router.push(getWorkerApplicationRoute(application.id, returnTo));
      return;
    }
    toggleExpanded();
  };

  const header = (
    <ClinicPostHeader
      layout="split"
      clinicName={application.clinic_name}
      logoStoragePath={application.clinic_logo_storage_path}
      title={shiftDisplay?.title ?? application.post_title}
      location={location}
      detail={
        [
          shiftDisplay?.shiftSchedule ?? null,
          hasUnreadMessages ? 'New message' : null,
          applicationUpdateLabel,
        ]
          .filter(Boolean)
          .join(' · ') || null
      }
      contentHeader={
        <WorkerApplicationStatusLabel
          status={application.status}
          postType={application.post_type}
        />
      }
      locationTrailing={
        appliedOnLabel ? (
          <Text style={styles.appliedOn} numberOfLines={1}>{appliedOnLabel}</Text>
        ) : null
      }
      avatarSize={44}
      accessory={
        hasApplicationUpdate || (jobMatch && matchContext) ? (
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            {hasApplicationUpdate ? <ApplicationCardBadge /> : null}
            {jobMatch && matchContext ? (
              <MatchTierBadge
                breakdown={jobMatch}
                context={matchContext}
                subtitle={application.post_title}
              />
            ) : null}
          </View>
        ) : null
      }
    />
  );

  return (
    <SurfaceCard
      variant={isConfirmedShift ? 'success' : 'default'}
      padding={paddingTier}
      gap>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: linkToDetail ? undefined : expanded }}
        onPress={handlePress}
        style={({ pressed, hovered }) => [
          styles.cardHeaderPressable,
          webHover(hovered, pressed, styles.cardHeaderHovered),
          pressed && styles.cardPressed,
        ]}>
        {header}
      </Pressable>

      {!linkToDetail ? (
        <CardExpandToggle
          expanded={expanded}
          onPress={toggleExpanded}
          bleedPadding={bleed}
          suppressHover
        />
      ) : null}

      {!linkToDetail && expanded ? (
        <View style={styles.expandedBody}>
          <WorkerApplicationDetailCard
            application={application}
            returnTo={returnTo}
            hasUnreadMessages={hasUnreadMessages}
            variant="embedded"
            onViewPosting={onViewPosting}
            onUpdated={onUpdated}
            onHidden={onHidden}
            onCancelled={onHidden}
          />
        </View>
      ) : null}
    </SurfaceCard>
  );
}
