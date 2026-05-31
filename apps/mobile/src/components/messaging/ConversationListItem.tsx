import type { Conversation } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { formatConversationDisplay } from '@/lib/conversationDisplay';
import { formatNotificationTime } from '@/lib/notificationDisplay';
import { useTheme, useThemedStyles } from '@/theme';

type ConversationListItemProps = {
  conversation: Conversation;
  avatarKind: 'clinic' | 'worker';
  role: 'worker' | 'clinic';
  onPress: () => void;
};

function ConversationAvatar({
  conversation,
  avatarKind,
}: {
  conversation: Conversation;
  avatarKind: 'clinic' | 'worker';
}) {
  const clinicLogoUri = useClinicLogoUri(
    avatarKind === 'clinic' ? conversation.counterpart_logo_storage_path : null,
  );
  const workerPhotoUri = useWorkerPhotoUri(
    avatarKind === 'worker' ? conversation.counterpart_logo_storage_path : null,
  );

  if (avatarKind === 'clinic') {
    return (
      <ClinicLogoAvatar
        clinicName={conversation.counterpart_name}
        logoUri={clinicLogoUri}
        size={44}
      />
    );
  }

  return (
    <WorkerProfileAvatar
      displayName={conversation.counterpart_name}
      photoUri={workerPhotoUri}
      size={44}
    />
  );
}

export function ConversationListItem({
  conversation,
  avatarKind,
  role,
  onPress,
}: ConversationListItemProps) {
  const { colors } = useTheme();
  const timestamp = formatNotificationTime(conversation.last_message_at ?? undefined);
  const display = formatConversationDisplay(conversation, role);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
    },
    cardPressed: { opacity: 0.92 },
    textWrap: { flex: 1, gap: 2 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    roleEyebrow: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      flex: 1,
    },
    name: {
      ...typography.body,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    preview: {
      ...typography.subtitle,
      color: conversation.unread ? colors.labelPrimary : colors.labelSecondary,
      fontWeight: conversation.unread ? '600' : '400',
    },
    timestamp: {
      fontSize: 12,
      color: colors.labelTertiary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <ConversationAvatar conversation={conversation} avatarKind={avatarKind} />
      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.roleEyebrow} numberOfLines={1}>
            {display.cardTitle}
          </Text>
          {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {display.cardName}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {display.cardMeta}
        </Text>
        <View style={styles.titleRow}>
          <Text style={styles.preview} numberOfLines={2}>
            {conversation.last_message_preview ?? 'No messages yet'}
          </Text>
          {conversation.unread ? <View style={styles.unreadDot} /> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
    </Pressable>
  );
}
