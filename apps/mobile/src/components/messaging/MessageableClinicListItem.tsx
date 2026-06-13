import type { MessageableClinic } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { formatMessageableClinicMeta } from '@/lib/conversationDisplay';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type MessageableClinicListItemProps = {
  clinic: MessageableClinic;
  onPress: () => void;
  compact?: boolean;
};

export function MessageableClinicListItem({
  clinic,
  onPress,
  compact = false,
}: MessageableClinicListItemProps) {
  const { colors } = useTheme();
  const logoUri = useClinicLogoUri(clinic.logo_storage_path);
  const meta = formatMessageableClinicMeta(clinic);
  const hasExistingConversation = Boolean(clinic.existing_conversation_id);

  const avatarSize = compact ? 36 : 40;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: compact ? spacing.sm + 2 : spacing.md,
      paddingHorizontal: compact ? spacing.sm : spacing.md,
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: { opacity: 0.92 },
    mainPressable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 0,
    },
    textWrap: { flex: 1, gap: 2, minWidth: 0 },
    name: {
      ...typography.body,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    status: {
      fontSize: 13,
      lineHeight: 18,
      color: hasExistingConversation ? colors.primary : colors.labelTertiary,
      fontWeight: hasExistingConversation ? '600' : '400',
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${clinic.clinic_name}. ${meta}. ${
        hasExistingConversation ? 'Continue conversation' : 'Start a conversation'
      }`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed, hovered }) => [
        styles.row,
        webPointer(),
        webHover(hovered, pressed, styles.rowHovered),
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.mainPressable}>
        <ClinicLogoAvatar clinicName={clinic.clinic_name} logoUri={logoUri} size={avatarSize} />
        <View style={styles.textWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {clinic.clinic_name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
          <Text style={styles.status} numberOfLines={1}>
            {hasExistingConversation ? 'Continue conversation' : 'Start a conversation'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
    </Pressable>
  );
}
