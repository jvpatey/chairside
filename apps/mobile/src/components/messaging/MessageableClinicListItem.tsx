import type { MessageableClinic } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { formatMessageableClinicMeta } from '@/lib/conversationDisplay';
import { webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type MessageableClinicListItemProps = {
  clinic: MessageableClinic;
  onPress: () => void;
  isLast?: boolean;
  compact?: boolean;
};

export function MessageableClinicListItem({
  clinic,
  onPress,
  isLast = false,
  compact = false,
}: MessageableClinicListItemProps) {
  const { colors } = useTheme();
  const logoUri = useClinicLogoUri(clinic.logo_storage_path);
  const meta = formatMessageableClinicMeta(clinic);
  const hasExistingConversation = Boolean(clinic.existing_conversation_id);
  const isWeb = Platform.OS === 'web';
  const [rowHovered, setRowHovered] = useState(false);

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
    rowSeparator: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    rowPressed: { opacity: 0.92 },
    mainPressable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 0,
      ...webPointer(),
    },
    textWrap: { flex: 1, gap: 2, minWidth: 0 },
    name: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '600',
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
    <View
      style={[
        styles.row,
        !isLast && styles.rowSeparator,
        isWeb && rowHovered && styles.rowHovered,
      ]}
      {...(isWeb
        ? {
            onMouseEnter: () => setRowHovered(true),
            onMouseLeave: () => setRowHovered(false),
          }
        : {})}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${clinic.clinic_name}. ${meta}. ${
          hasExistingConversation ? 'Continue conversation' : 'Start a conversation'
        }`}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={({ pressed }) => [styles.mainPressable, pressed && styles.rowPressed]}>
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
      </Pressable>
      <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
    </View>
  );
}
