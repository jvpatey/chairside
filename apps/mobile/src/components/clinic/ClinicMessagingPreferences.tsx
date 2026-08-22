import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { ThemedSwitch } from '@/components/ui/ThemedSwitch';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { CLINIC_OPEN_INQUIRY_CANDIDATES } from '@/lib/routing';
import {
  IS_WEB,
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ClinicMessagingPreferencesProps = {
  variant?: 'default' | 'compact';
};

const GENERAL_MESSAGES_INFO = {
  title: 'Let candidates message you without applying',
  message:
    'When enabled, completed candidates in your province can start an open inquiry without applying to a specific role or fill-in.\n\nYou can also browse candidates who opted in. Messages about applications and fill-ins still work the same when someone applies.',
};

function showGeneralMessagesInfo(setInfoVisible: (updater: (current: boolean) => boolean) => void) {
  if (Platform.OS === 'web') {
    setInfoVisible((current) => !current);
    return;
  }
  Alert.alert(GENERAL_MESSAGES_INFO.title, GENERAL_MESSAGES_INFO.message);
}

export function ClinicMessagingPreferences({
  variant = 'default',
}: ClinicMessagingPreferencesProps) {
  const { colors } = useTheme();
  const { clinicProfile, refreshClinicProfile, isOwner } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { billing, upgradePrompt, showGeneralMessagingUpgrade, handleBillingError } =
    useClinicUpgradePrompt();
  const [acceptsGeneralMessages, setAcceptsGeneralMessages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const compact = variant === 'compact';
  const messagingLocked = billing != null && !billing.canUseGeneralCandidateMessaging;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    stack: {
      gap: spacing.xs,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: compact ? 12 : 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: compact ? spacing.sm : spacing.md,
      gap: spacing.sm,
    },
    rowText: { flex: 1, gap: compact ? 0 : 2 },
    labelPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      flexShrink: 1,
      borderRadius: 8,
      ...webPointer(),
    },
    labelPressableHovered: webListRowHoverStyles(colors),
    labelPressablePressed: { opacity: 0.65 },
    switchWrap: {},
    rowTitle: compact
      ? {
          fontSize: 15,
          lineHeight: 20,
          fontWeight: '500',
          color: colors.labelPrimary,
        }
      : { ...typography.body, fontWeight: '600', color: colors.labelPrimary },
    rowHint: { fontSize: 13, lineHeight: 18, color: colors.labelSecondary },
    infoPanel: {
      borderRadius: compact ? 12 : 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.backgroundGrouped,
      gap: spacing.xs,
    },
    infoTitle: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    infoMessage: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    browseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      ...webPointer(),
    },
    browseLabel: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      color: colors.primary,
    },
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    setAcceptsGeneralMessages(clinicProfile.accepts_general_candidate_messages ?? false);
  }, [clinicProfile]);

  const persistAcceptsGeneralMessages = async (value: boolean) => {
    setIsSaving(true);
    try {
      await save({ accepts_general_candidate_messages: value });
      await refreshClinicProfile();
    } catch (error) {
      if (handleBillingError(error)) {
        setAcceptsGeneralMessages(!value);
        return;
      }
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
      setAcceptsGeneralMessages(!value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (value: boolean) => {
    if (!isOwner) return;
    if (messagingLocked && value) {
      showGeneralMessagingUpgrade();
      return;
    }
    setAcceptsGeneralMessages(value);
    void persistAcceptsGeneralMessages(value);
  };

  const handleBrowseCandidates = () => {
    if (messagingLocked) {
      showGeneralMessagingUpgrade();
      return;
    }
    router.push(CLINIC_OPEN_INQUIRY_CANDIDATES);
  };

  const title = 'Let candidates message you without applying';
  const hint = !isOwner
    ? 'Only the group owner can change open inquiries for the organization.'
    : messagingLocked
      ? 'Upgrade to Pro for open inquiries. You can already message applicants.'
      : 'Candidates in your province can message your clinic even when they are not applying. You can also browse candidates who opted in.';

  if (!compact) {
    return (
      <>
        {upgradePrompt}
        <SettingsToggleRow
          title={title}
          hint={hint}
          value={acceptsGeneralMessages}
          disabled={isSaving || !isOwner}
          onValueChange={handleToggle}
        />
      </>
    );
  }

  return (
    <View style={styles.stack}>
      {upgradePrompt}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            {compact ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={title}
                accessibilityHint="Shows what letting candidates message you means"
                accessibilityState={{ expanded: infoVisible }}
                hitSlop={8}
                onPress={() => showGeneralMessagesInfo(setInfoVisible)}
                style={({ pressed, hovered }) => [
                  styles.labelPressable,
                  IS_WEB && webHover(hovered, pressed, styles.labelPressableHovered),
                  pressed && styles.labelPressablePressed,
                ]}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={colors.labelTertiary}
                />
              </Pressable>
            ) : (
              <>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowHint}>{hint}</Text>
              </>
            )}
          </View>
          <View style={styles.switchWrap}>
            <ThemedSwitch
              value={acceptsGeneralMessages}
              disabled={isSaving || !isOwner}
              onValueChange={handleToggle}
            />
          </View>
        </View>
      </View>
      {infoVisible ? (
        <View style={styles.infoPanel} accessibilityRole="text">
          <Text style={styles.infoTitle}>{GENERAL_MESSAGES_INFO.title}</Text>
          <Text style={styles.infoMessage}>{GENERAL_MESSAGES_INFO.message}</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Browse candidates"
        accessibilityHint="Find workers who opted into open inquiries"
        onPress={handleBrowseCandidates}
        style={({ pressed, hovered }) => [
          styles.card,
          styles.browseRow,
          IS_WEB && webHover(hovered, pressed, styles.labelPressableHovered),
          pressed && styles.labelPressablePressed,
        ]}>
        <Text style={styles.browseLabel}>Browse candidates</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}
