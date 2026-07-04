import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { ThemedSwitch } from '@/components/ui/ThemedSwitch';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
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
  title: 'Let candidates message you',
  message:
    'When enabled, completed candidates in your province can message your clinic without applying to a specific role or fill-in.\n\nMessages about applications and fill-ins still work the same when someone applies.',
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
  const { clinicProfile, refreshClinicProfile } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const [acceptsGeneralMessages, setAcceptsGeneralMessages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const compact = variant === 'compact';

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
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const title = compact ? 'Let candidates message you' : 'Allow candidates to message you';
  const hint =
    'Candidates in your province can message your clinic even when they are not applying to a specific posting.';

  if (!compact) {
    return (
      <SettingsToggleRow
        title={title}
        hint={hint}
        value={acceptsGeneralMessages}
        disabled={isSaving}
        onValueChange={(value) => {
          setAcceptsGeneralMessages(value);
          void persistAcceptsGeneralMessages(value);
        }}
      />
    );
  }

  return (
    <View style={styles.stack}>
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
                <Text style={styles.rowHint}>
                  Candidates in your province can message your clinic even when they are not applying
                  to a specific posting.
                </Text>
              </>
            )}
          </View>
          <View style={styles.switchWrap}>
            <ThemedSwitch
              value={acceptsGeneralMessages}
              disabled={isSaving}
              onValueChange={(value) => {
                setAcceptsGeneralMessages(value);
                void persistAcceptsGeneralMessages(value);
              }}
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
    </View>
  );
}
