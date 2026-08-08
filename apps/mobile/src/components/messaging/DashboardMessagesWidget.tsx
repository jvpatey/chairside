import type { Conversation } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { DashboardWidgetHeader } from '@/components/dashboard/DashboardWidgetHeader';
import { dashboardWidgetTokens } from '@/components/dashboard/dashboardTokens';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { PillBadge } from '@/components/ui/PillBadge';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { formatConversationDisplay } from '@/lib/conversationDisplay';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { colorWithAlpha, fontBold, useTheme, useThemedStyles } from '@/theme';

const PREVIEW_LIMIT = 2;
const IS_WEB = Platform.OS === 'web';

export type DashboardMessagesWidgetProps = {
  conversations: Conversation[];
  avatarKind: 'clinic' | 'worker';
  role: 'worker' | 'clinic';
  onConversationPress: (conversation: Conversation) => void;
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

  if (avatarKind === 'clinic') {
    return (
      <ClinicLogoAvatar
        clinicName={conversation.counterpart_name}
        logoUri={clinicLogoUri}
        size={40}
      />
    );
  }

  return (
    <WorkerProfileAvatar
      displayName={conversation.counterpart_name}
      photoUri={workerPhotoUri}
      size={40}
    />
  );
}

/** Always-visible dashboard messages glance — flat surface with unread previews or empty state. */
export function DashboardMessagesWidget({
  conversations,
  avatarKind,
  role,
  onConversationPress,
  onViewAllPress,
}: DashboardMessagesWidgetProps) {
  const { colors, isDark } = useTheme();
  const unread = conversations.filter((conversation) => conversation.unread);
  const unreadCount = unread.length;
  const previews = unread.slice(0, PREVIEW_LIMIT);

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    card: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
    },
    viewAllPressable: {
      borderRadius: radii.sm,
      paddingHorizontal: 4,
      paddingVertical: 2,
      ...webPointer(),
    },
    viewAllHovered: webListRowHoverStyles(colors),
    viewAll: {
      fontSize: dashboardWidgetTokens.headerAction.fontSize,
      fontWeight: '600',
      color: colors.primary,
    },
    emptyBody: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    emptyTitle: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    emptyHint: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
    previews: {
      gap: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      ...webPointer(),
    },
    previewRowHovered: webListRowHoverStyles(colors),
    previewRowPressed: {
      opacity: 0.92,
    },
    previewText: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    name: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 22,
      fontFamily: fontBold,
      fontWeight: '700',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
      flex: 1,
    },
    context: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    previewMessage: {
      ...typography.subtitle,
      fontSize: 14,
      color: colors.labelPrimary,
      fontWeight: '500',
    },
  }));

  const handleViewAll = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewAllPress();
  };

  const unreadBadgeLabel =
    unreadCount === 1 ? '1 unread' : unreadCount > 1 ? `${unreadCount} unread` : null;

  return (
    <View style={styles.card}>
      <DashboardWidgetHeader
        title="Messages"
        icon="chatbubbles-outline"
        accent="primary"
        trailing={
          <>
            {unreadBadgeLabel ? (
              <PillBadge
                label={unreadBadgeLabel}
                color={colors.primary}
                backgroundColor={colorWithAlpha(colors.primary, isDark ? 0.2 : 0.12)}
                borderColor={colorWithAlpha(colors.primary, 0.28)}
                size="sm"
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all messages"
              hitSlop={8}
              onPress={handleViewAll}
              style={({ pressed, hovered }) => [
                styles.viewAllPressable,
                webHover(hovered, pressed, styles.viewAllHovered),
              ]}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </>
        }
      />

      {unreadCount === 0 ? (
        <View style={styles.emptyBody}>
          <Text style={styles.emptyTitle}>No new messages</Text>
          <Text style={styles.emptyHint}>
            {IS_WEB ? 'All caught up' : 'All caught up · Open the Messages tab to see your inbox.'}
          </Text>
        </View>
      ) : (
        <View style={styles.previews}>
          {previews.map((conversation) => {
            const display = formatConversationDisplay(conversation, role);
            return (
              <Pressable
                key={conversation.id}
                accessibilityRole="button"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onConversationPress(conversation);
                }}
                style={({ pressed, hovered }) => [
                  styles.previewRow,
                  webHover(hovered, pressed, styles.previewRowHovered),
                  pressed && styles.previewRowPressed,
                ]}>
                <PreviewAvatar conversation={conversation} avatarKind={avatarKind} />
                <View style={styles.previewText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {display.cardName}
                  </Text>
                  <Text style={styles.context} numberOfLines={2}>
                    {display.inboxContextLine}
                  </Text>
                  <Text style={styles.previewMessage} numberOfLines={1}>
                    {conversation.last_message_preview ?? 'New message'}
                  </Text>
                </View>
                {IS_WEB ? (
                  <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
