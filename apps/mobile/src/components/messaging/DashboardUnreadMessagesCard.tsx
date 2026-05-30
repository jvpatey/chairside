import type { Conversation } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { useTheme, useThemedStyles } from '@/theme';

const PREVIEW_LIMIT = 2;

type DashboardUnreadMessagesCardProps = {
  conversations: Conversation[];
  avatarKind: 'clinic' | 'worker';
  onConversationPress: (applicationId: string) => void;
  onViewAllPress: () => void;
};

function PreviewAvatar({
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

  return (
    <WorkerProfileAvatar
      displayName={conversation.counterpart_name}
      photoUri={avatarKind === 'clinic' ? clinicLogoUri : workerPhotoUri}
      size={36}
    />
  );
}

export function DashboardUnreadMessagesCard({
  conversations,
  avatarKind,
  onConversationPress,
  onViewAllPress,
}: DashboardUnreadMessagesCardProps) {
  const { colors } = useTheme();
  const unread = conversations.filter((conversation) => conversation.unread);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      backgroundColor: colors.primarySubtle,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    headerTitle: {
      ...typography.body,
      fontWeight: '600',
      color: colors.primary,
    },
    viewAll: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    previews: {
      gap: 1,
      backgroundColor: colors.separator,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    previewRowPressed: {
      opacity: 0.92,
    },
    previewText: {
      flex: 1,
      gap: 2,
    },
    previewName: {
      ...typography.body,
      fontWeight: '600',
    },
    previewMessage: {
      ...typography.subtitle,
      fontSize: 14,
      color: colors.labelPrimary,
      fontWeight: '500',
    },
    previewPost: {
      ...typography.subtitle,
      fontSize: 13,
    },
  }));

  if (unread.length === 0) return null;

  const previews = unread.slice(0, PREVIEW_LIMIT);
  const label = unread.length === 1 ? '1 unread message' : `${unread.length} unread messages`;

  const handleViewAll = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewAllPress();
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="chatbubbles" size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>{label}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all messages"
          hitSlop={8}
          onPress={handleViewAll}>
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>
      <View style={styles.previews}>
        {previews.map((conversation) => (
          <Pressable
            key={conversation.id}
            accessibilityRole="button"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onConversationPress(conversation.application_id);
            }}
            style={({ pressed }) => [styles.previewRow, pressed && styles.previewRowPressed]}>
            <PreviewAvatar conversation={conversation} avatarKind={avatarKind} />
            <View style={styles.previewText}>
              <Text style={styles.previewName} numberOfLines={1}>
                {conversation.counterpart_name}
              </Text>
              <Text style={styles.previewPost} numberOfLines={1}>
                {conversation.post_title}
              </Text>
              <Text style={styles.previewMessage} numberOfLines={1}>
                {conversation.last_message_preview ?? 'New message'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
