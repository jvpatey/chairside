import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { IS_WEB, webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const MESSAGE_CLINIC_INFO = {
  title: 'Message a clinic',
  message:
    'Browse clinics in your province that welcome general inquiries. You can reach out even if they do not have a role or fill-in posted right now.\n\nMessages about your applications and fill-ins still appear in your inbox below.',
};

type WorkerMessageClinicActionProps = {
  onPress: () => void;
};

export function WorkerMessageClinicAction({ onPress }: WorkerMessageClinicActionProps) {
  const { colors } = useTheme();
  const [infoVisible, setInfoVisible] = useState(false);
  const [cardHovered, setCardHovered] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    navigatePressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
      flexShrink: 1,
      paddingVertical: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    navigatePressed: { opacity: 0.92 },
    title: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      color: colors.labelPrimary,
      flex: 1,
    },
    infoPressable: {
      padding: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    infoPressed: { opacity: 0.65 },
    chevronPressable: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      ...webPointer(),
    },
    chevronPressed: { opacity: 0.92 },
    infoPanel: {
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.backgroundGrouped,
    },
    infoTitle: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelPrimary,
      marginBottom: spacing.xs,
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

  const cardHoverProps = IS_WEB
    ? {
        onMouseEnter: () => setCardHovered(true),
        onMouseLeave: () => setCardHovered(false),
      }
    : {};

  return (
    <View
      style={[styles.card, IS_WEB && cardHovered && styles.cardHovered]}
      {...cardHoverProps}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Message a clinic"
          accessibilityHint="Browse clinics you can message"
          onPress={handleNavigate}
          style={({ pressed }) => [
            styles.navigatePressable,
            pressed && styles.navigatePressed,
          ]}>
          <Text style={styles.title}>Message a clinic</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About messaging a clinic"
          accessibilityHint="Shows what messaging a clinic means"
          accessibilityState={{ expanded: infoVisible }}
          hitSlop={8}
          onPress={showInfo}
          style={({ pressed }) => [styles.infoPressable, pressed && styles.infoPressed]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.labelTertiary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Browse clinics to message"
          onPress={handleNavigate}
          style={({ pressed }) => [
            styles.chevronPressable,
            pressed && styles.chevronPressed,
          ]}>
          <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
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
