import type { Conversation } from '@chairside/api';
import { DELETED_ACCOUNT_LABEL } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import {
  formatConversationDisplay,
  getConversationTypeChip,
  getConversationTypeChipColors,
} from '@/lib/conversationDisplay';
import {
  getClinicApplicationRoute,
  getWorkerApplicationRoute,
  getWorkerClinicProfileRoute,
} from '@/lib/routing';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

type MessageContextPanelProps = {
  conversation: Conversation | null;
  role: 'worker' | 'clinic';
  onCollapse?: () => void;
  /** Close split-view context UI before routing to a full-screen destination. */
  onNavigateAway?: () => void;
};

function ContextAvatar({
  conversation,
  role,
  size = 64,
}: {
  conversation: Conversation;
  role: 'worker' | 'clinic';
  size?: number;
}) {
  const clinicLogoUri = useClinicLogoUri(
    role === 'worker' ? conversation.counterpart_logo_storage_path : null,
  );
  const workerPhotoUri = useWorkerPhotoUri(
    role === 'clinic' ? conversation.counterpart_logo_storage_path : null,
  );

  if (role === 'worker') {
    return (
      <ClinicLogoAvatar
        clinicName={conversation.counterpart_name}
        logoUri={clinicLogoUri}
        size={size}
      />
    );
  }

  return (
    <WorkerProfileAvatar
      displayName={conversation.counterpart_name}
      photoUri={workerPhotoUri}
      size={size}
    />
  );
}

function ContextActionRow({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      ...webPointer(),
    },
    rowPressed: {
      opacity: 0.88,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: radii.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
    },
    label: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: fontSemibold,
      color: colors.labelPrimary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, { backgroundColor: colors.primarySubtle }),
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
    </Pressable>
  );
}

function PanelEyebrow({
  label,
  onCollapse,
}: {
  label: string;
  onCollapse?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    eyebrow: {
      flex: 1,
      fontSize: 11,
      fontWeight: '600',
      fontFamily: fontSemibold,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    collapseButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    collapseButtonPressed: {
      opacity: 0.8,
    },
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.eyebrow}>{label}</Text>
      {onCollapse ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hide details panel"
          onPress={onCollapse}
          style={({ pressed }) => [
            styles.collapseButton,
            pressed && styles.collapseButtonPressed,
          ]}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.labelSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function EmptyContextPanel({ onCollapse }: { onCollapse?: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    panel: {
      flex: 1,
      padding: spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
      gap: spacing.lg,
    },
    emptyCard: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    emptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: fontSemibold,
      color: colors.labelPrimary,
      textAlign: 'center',
    },
    hint: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.labelTertiary,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.panel}>
      <ScrollView
        style={[{ flex: 1, backgroundColor: 'transparent' }, webScrollbarStyles()]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PanelEyebrow label="Thread details" onCollapse={onCollapse} />
        <SurfaceCard padding="lg" gap>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={24} color={colors.labelTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No conversation selected</Text>
            <Text style={styles.hint}>
              Select a conversation to see clinic, role, and quick actions here.
            </Text>
          </View>
        </SurfaceCard>
        {Platform.OS === 'web' ? (
          <Text style={styles.hint}>
            Use ↑ ↓ to move between conversations. Press Escape to focus the inbox.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

export function MessageContextPanel({
  conversation,
  role,
  onCollapse,
  onNavigateAway,
}: MessageContextPanelProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    panel: {
      flex: 1,
      padding: spacing.lg,
    },
    scrollContent: {
      gap: spacing.lg,
      paddingBottom: spacing.md,
    },
    heroInner: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      ...typography.title,
      fontSize: 19,
      lineHeight: 24,
      textAlign: 'center',
      color: colors.labelPrimary,
    },
    chip: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: 999,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '700',
      fontFamily: fontSemibold,
      letterSpacing: 0.35,
      textTransform: 'uppercase' as const,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.labelSecondary,
    },
    actions: {
      gap: spacing.sm,
    },
    footerHint: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.labelTertiary,
      textAlign: 'center',
    },
  }));

  if (!conversation) {
    return <EmptyContextPanel onCollapse={onCollapse} />;
  }

  const display = formatConversationDisplay(conversation, role);
  const typeChip = getConversationTypeChip(conversation);
  const chipColors = getConversationTypeChipColors(typeChip.tone);
  const chipBg = colors[chipColors.bg as keyof typeof colors] as string;
  const chipText = colors[chipColors.text as keyof typeof colors] as string;

  const handleProfilePress = () => {
    if (role === 'worker') {
      onNavigateAway?.();
      router.push(
        getWorkerClinicProfileRoute(conversation.clinic_id, {
          returnTo: 'messages-tab',
          conversationId: conversation.id,
        }),
      );
    }
  };

  const handleApplicationPress = () => {
    if (!conversation.application_id) return;
    onNavigateAway?.();
    if (role === 'worker') {
      router.push(getWorkerApplicationRoute(conversation.application_id, 'messages-tab'));
      return;
    }
    router.push(getClinicApplicationRoute(conversation.application_id, 'messages-tab'));
  };

  const messagingStatus = conversation.can_send
    ? {
        variant: 'success' as const,
        icon: 'checkmark-circle-outline' as const,
        title: 'Messaging open',
        body: 'Replies send instantly and notify the other person.',
      }
    : conversation.counterpart_account_deleted
      ? {
          variant: 'default' as const,
          icon: 'person-remove-outline' as const,
          title: DELETED_ACCOUNT_LABEL,
          body: 'This person closed their Chairside account. Past messages remain visible.',
        }
      : {
          variant: 'default' as const,
          icon: 'lock-closed-outline' as const,
          title: 'Thread closed',
          body: 'You can still read the conversation history.',
        };

  const eyebrowLabel =
    role === 'worker'
      ? 'About this clinic'
      : conversation.conversation_type === 'general'
        ? 'About this candidate'
        : 'About this applicant';

  return (
    <View style={styles.panel}>
      <ScrollView
        style={[{ flex: 1, backgroundColor: 'transparent' }, webScrollbarStyles()]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <PanelEyebrow label={eyebrowLabel} onCollapse={onCollapse} />

        <SurfaceCard padding="lg" gap>
          <View style={styles.heroInner}>
            <ContextAvatar conversation={conversation} role={role} size={64} />
            <Text style={styles.title} numberOfLines={2}>
              {display.threadTitle}
            </Text>
            <View style={[styles.chip, { backgroundColor: chipBg }]}>
              <Text style={[styles.chipText, { color: chipText }]}>{typeChip.label}</Text>
            </View>
            {display.threadSubtitle ? (
              <Text style={styles.subtitle} numberOfLines={3}>
                {display.threadSubtitle}
              </Text>
            ) : null}
          </View>
        </SurfaceCard>

        {conversation.application_id || role === 'worker' ? (
          <View style={styles.actions}>
            {conversation.application_id ? (
              <ContextActionRow
                label="View application"
                icon="document-text-outline"
                onPress={handleApplicationPress}
              />
            ) : null}
            {role === 'worker' ? (
              <ContextActionRow
                label="View clinic profile"
                icon="business-outline"
                onPress={handleProfilePress}
              />
            ) : null}
          </View>
        ) : null}

        <CardInfoPanel
          variant={messagingStatus.variant}
          icon={messagingStatus.icon}
          title={messagingStatus.title}>
          <CardInfoPanelText>{messagingStatus.body}</CardInfoPanelText>
        </CardInfoPanel>

        {Platform.OS === 'web' ? (
          <Text style={styles.footerHint}>
            ↑ ↓ navigate conversations · Escape returns focus to inbox
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
