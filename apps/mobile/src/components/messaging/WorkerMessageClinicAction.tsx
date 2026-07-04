import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { IS_WEB, webHover, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const MESSAGE_CLINIC_INFO = {
  title: 'Message a clinic',
  message:
    'Browse clinics in your province that welcome general inquiries. You can reach out even if they do not have a role or fill-in posted right now.\n\nMessages about your applications and fill-ins still appear in your inbox below.',
};

type WorkerMessageClinicActionProps = {
  onPress: () => void;
  compact?: boolean;
};

export function WorkerMessageClinicAction({
  onPress,
  compact = false,
}: WorkerMessageClinicActionProps) {
  const { colors } = useTheme();
  const [infoVisible, setInfoVisible] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    primaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      minHeight: compact ? 40 : 44,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.primary,
      ...webPointer(),
    },
    primaryButtonHovered: {
      opacity: 0.94,
    },
    primaryButtonPressed: {
      opacity: 0.88,
    },
    primaryLabel: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryOnPrimary,
    },
    infoButton: {
      width: compact ? 40 : 44,
      height: compact ? 40 : 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      ...webPointer(),
    },
    infoButtonPressed: {
      opacity: 0.75,
    },
    infoPanel: {
      borderRadius: 12,
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

  const handleNavigate = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInfoVisible(false);
    onPress();
  };

  const showInfo = () => {
    if (Platform.OS === 'web') {
      setInfoVisible((current) => !current);
      return;
    }
    Alert.alert(MESSAGE_CLINIC_INFO.title, MESSAGE_CLINIC_INFO.message);
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Message a clinic"
          accessibilityHint="Browse clinics you can message"
          onPress={handleNavigate}
          style={({ pressed, hovered }) => [
            styles.primaryButton,
            IS_WEB && webHover(hovered, pressed, styles.primaryButtonHovered),
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primaryOnPrimary} />
          <Text style={styles.primaryLabel}>Message a clinic</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primaryOnPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About messaging a clinic"
          accessibilityHint="Shows what messaging a clinic means"
          accessibilityState={{ expanded: infoVisible }}
          hitSlop={8}
          onPress={showInfo}
          style={({ pressed }) => [styles.infoButton, pressed && styles.infoButtonPressed]}
        >
          <Ionicons name="information-circle-outline" size={18} color={colors.labelTertiary} />
        </Pressable>
      </View>
      {infoVisible ? (
        <View style={styles.infoPanel} accessibilityRole="text">
          <Text style={styles.infoTitle}>{MESSAGE_CLINIC_INFO.title}</Text>
          <Text style={styles.infoMessage}>{MESSAGE_CLINIC_INFO.message}</Text>
        </View>
      ) : null}
    </View>
  );
}
