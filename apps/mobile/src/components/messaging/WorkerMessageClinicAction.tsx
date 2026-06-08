import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Alert, Pressable, Text, View } from 'react-native';

import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const MESSAGE_CLINIC_INFO = {
  title: 'Message a clinic',
  message:
    'Browse clinics in your province that accept general inquiries. You can reach out without applying to a specific role or fill-in.\n\nMessages about your applications and fill-ins still appear in your inbox below.',
};

function showMessageClinicInfo() {
  Alert.alert(MESSAGE_CLINIC_INFO.title, MESSAGE_CLINIC_INFO.message);
}

type WorkerMessageClinicActionProps = {
  onPress: () => void;
};

export function WorkerMessageClinicAction({ onPress }: WorkerMessageClinicActionProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    labelPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
      flexShrink: 1,
      paddingVertical: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    labelPressableHovered: webListRowHoverStyles(colors),
    labelPressablePressed: { opacity: 0.65 },
    title: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    navigatePressable: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      ...webPointer(),
    },
    navigateHovered: webListRowHoverStyles(colors),
    navigatePressed: { opacity: 0.92 },
  }));

  const handleNavigate = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Message a clinic"
          accessibilityHint="Shows what messaging a clinic means"
          onPress={showMessageClinicInfo}
          style={({ pressed, hovered }) => [
            styles.labelPressable,
            webHover(hovered, pressed, styles.labelPressableHovered),
            pressed && styles.labelPressablePressed,
          ]}>
          <Text style={styles.title}>Message a clinic</Text>
          <Ionicons name="information-circle-outline" size={16} color={colors.labelTertiary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Browse clinics to message"
          onPress={handleNavigate}
          style={({ pressed, hovered }) => [
            styles.navigatePressable,
            webHover(hovered, pressed, styles.navigateHovered),
            pressed && styles.navigatePressed,
          ]}>
          <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
        </Pressable>
      </View>
    </View>
  );
}
