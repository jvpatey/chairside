import type { FillInOutreachWorker } from '@chairside/api';
import { getRoleTypeLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { SelectionCheckbox } from '@/components/ui/SelectionCheckbox';
import { getOutreachAvailabilityDisplay } from '@/lib/outreachAvailabilityDisplay';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type AvailableFillInWorkerCardProps = {
  worker: FillInOutreachWorker;
  onMessage: () => void;
  accent?: GradientAccent;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
};

function formatRoleLabels(roleTypes: string[]): string {
  if (roleTypes.length === 0) return 'Candidate';
  if (roleTypes.length === 1) return getRoleTypeLabel(roleTypes[0]!);
  return roleTypes.map((role) => getRoleTypeLabel(role)).join(', ');
}

export function AvailableFillInWorkerCard({
  worker,
  onMessage,
  accent = 'secondary',
  selectable = false,
  selected = false,
  onToggleSelected,
}: AvailableFillInWorkerCardProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: selected ? colors.secondary : colors.separator,
      padding: spacing.md,
      ...webPointer(),
    },
    cardHovered: webListRowHoverStyles(colors),
    cardPressed: {
      opacity: 0.92,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    headerContent: {
      flex: 1,
      minWidth: 0,
    },
    textFooter: {
      gap: spacing.xs,
    },
    availabilityBlock: {
      gap: 2,
    },
    availabilityDays: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    availabilityHours: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    smsBadge: {
      alignSelf: 'flex-start',
      fontSize: 12,
      fontWeight: '600',
      color: colors.secondary,
      backgroundColor: colors.secondarySubtle,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: 'hidden',
    },
    chevronButton: {
      paddingVertical: 2,
      paddingLeft: spacing.xs,
    },
    chevronPressed: {
      opacity: 0.7,
    },
  }));

  const roleLabel = formatRoleLabels(worker.roleTypes);
  const location = [roleLabel, worker.city].filter(Boolean).join(' · ');
  const experience =
    worker.yearsOfExperience != null ? `${worker.yearsOfExperience} yrs experience` : null;
  const availability = getOutreachAvailabilityDisplay(worker.availabilitySummary);
  const messageLabel = worker.existingConversationId ? 'Continue conversation' : 'Message';

  const handleMessage = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMessage();
  };

  const body = (
    <View style={styles.headerRow}>
      {selectable ? (
        <SelectionCheckbox
          selected={selected}
          accent={accent}
          accessibilityLabel={`Select ${worker.displayName}`}
        />
      ) : null}
      <View style={styles.headerContent}>
        <ApplicantPostHeader
          displayName={worker.displayName}
          photoStoragePath={worker.photoStoragePath}
          eyebrow=""
          title={worker.displayName}
          location={location || null}
          detail={experience}
          avatarAlign="top"
          textFooter={
            availability || worker.smsOptIn ? (
              <View style={styles.textFooter}>
                {availability ? (
                  <View
                    style={styles.availabilityBlock}
                    accessibilityLabel={availability.accessibilityLabel}>
                    <Text style={styles.availabilityDays}>{availability.daysLabel}</Text>
                    {availability.hoursLabel ? (
                      <Text style={styles.availabilityHours}>{availability.hoursLabel}</Text>
                    ) : null}
                  </View>
                ) : null}
                {worker.smsOptIn ? <Text style={styles.smsBadge}>Text alerts on</Text> : null}
              </View>
            ) : undefined
          }
          accessory={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={messageLabel}
              hitSlop={10}
              onPress={(event) => {
                event.stopPropagation?.();
                handleMessage();
              }}
              style={({ pressed }) => [styles.chevronButton, pressed && styles.chevronPressed]}>
              <Ionicons name="chevron-forward" size={20} color={colors.labelTertiary} />
            </Pressable>
          }
        />
      </View>
    </View>
  );

  if (!selectable) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={messageLabel}
        onPress={handleMessage}
        style={({ pressed, hovered }) => [
          styles.card,
          webHover(hovered, pressed, styles.cardHovered),
          pressed && styles.cardPressed,
        ]}>
        {body}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Select ${worker.displayName}`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggleSelected?.();
      }}
      style={({ pressed, hovered }) => [
        styles.card,
        webHover(hovered, pressed, styles.cardHovered),
        pressed && styles.cardPressed,
      ]}>
      {body}
    </Pressable>
  );
}
