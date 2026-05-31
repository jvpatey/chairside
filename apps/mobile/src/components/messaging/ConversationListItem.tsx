import type { Conversation } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Alert, Pressable, Text, View } from 'react-native';

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
  onDelete?: () => void;
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
  onDelete,
}: ConversationListItemProps) {
  const { colors } = useTheme();
  const timestamp = formatNotificationTime(conversation.last_message_at ?? undefined);
  const display = formatConversationDisplay(conversation, role);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingLeft: spacing.lg,
      paddingRight: spacing.sm,
      paddingVertical: spacing.lg,
    },
    mainPressable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 0,
    },
    mainPressed: { opacity: 0.92 },
    textWrap: { flex: 1, gap: 2, minWidth: 0 },
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
    menuButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuButtonPressed: {
      backgroundColor: colors.fillSubtle,
    },
  }));

  const showMenu = () => {
    if (!onDelete) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(display.cardName, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete from inbox', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.mainPressable, pressed && styles.mainPressed]}>
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
      </Pressable>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Conversation options"
          hitSlop={8}
          onPress={showMenu}
          style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.labelTertiary} />
        </Pressable>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
      )}
    </View>
  );
}
