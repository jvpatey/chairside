import type { Conversation } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import {
  formatConversationDisplay,
  getConversationTypeChip,
} from '@/lib/conversationDisplay';
import {
  getClinicApplicationRoute,
  getWorkerApplicationRoute,
  getWorkerClinicProfileRoute,
} from '@/lib/routing';
import { webHover, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type MessageContextPanelProps = {
  conversation: Conversation | null;
  role: 'worker' | 'clinic';
};

function ContextAvatar({
  conversation,
  role,
}: {
  conversation: Conversation;
  role: 'worker' | 'clinic';
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
        size={56}
      />
    );
  }

  return (
    <WorkerProfileAvatar
      displayName={conversation.counterpart_name}
      photoUri={workerPhotoUri}
      size={56}
    />
  );
}

function ContextLink({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      ...webPointer(),
    },
    linkPressed: {
      opacity: 0.9,
    },
    linkText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.link,
        webHover(hovered, pressed, { backgroundColor: colors.primarySubtle }),
        pressed && styles.linkPressed,
      ]}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.linkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
    </Pressable>
  );
}

export function MessageContextPanel({ conversation, role }: MessageContextPanelProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    panel: {
      flex: 1,
      padding: spacing.lg,
      gap: spacing.lg,
    },
    label: {
      fontSize: 12,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    hero: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    title: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
      textAlign: 'center',
    },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.primarySubtle,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.3,
      textTransform: 'uppercase' as const,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      textAlign: 'center',
    },
    section: {
      gap: spacing.sm,
    },
    statusCard: {
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.backgroundGrouped,
      gap: spacing.xs,
    },
    statusTitle: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    statusBody: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    hint: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
  }));

  if (!conversation) {
    return (
      <View style={styles.panel}>
        <Text style={styles.label}>Thread details</Text>
        <Text style={styles.hint}>Select a conversation to see clinic, role, and quick actions here.</Text>
        {Platform.OS === 'web' ? (
          <Text style={styles.hint}>Use ↑ ↓ to move between conversations. Press Escape to focus the inbox.</Text>
        ) : null}
      </View>
    );
  }

  const display = formatConversationDisplay(conversation, role);
  const typeChip = getConversationTypeChip(conversation);

  const handleProfilePress = () => {
    if (role === 'worker') {
      router.push(getWorkerClinicProfileRoute(conversation.clinic_id));
    }
  };

  const handleApplicationPress = () => {
    if (!conversation.application_id) return;
    if (role === 'worker') {
      router.push(getWorkerApplicationRoute(conversation.application_id, 'messages-tab'));
      return;
    }
    router.push(getClinicApplicationRoute(conversation.application_id, 'messages-tab'));
  };

  const messagingStatus = conversation.can_send
    ? 'Messaging is open. Replies send instantly and notify the other person.'
    : conversation.counterpart_account_deleted
      ? 'This person is no longer on Chairside. Past messages remain visible.'
      : 'This thread is closed. You can still read the conversation history.';

  return (
    <View style={styles.panel}>
      <Text style={styles.label}>{role === 'worker' ? 'About this clinic' : 'About this applicant'}</Text>

      <View style={styles.hero}>
        <ContextAvatar conversation={conversation} role={role} />
        <Text style={styles.title}>{display.threadTitle}</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{typeChip.label}</Text>
        </View>
        <Text style={styles.subtitle}>{display.threadSubtitle}</Text>
      </View>

      <View style={styles.section}>
        {conversation.application_id ? (
          <ContextLink
            label="View application"
            icon="document-text-outline"
            onPress={handleApplicationPress}
          />
        ) : null}
        {role === 'worker' ? (
          <ContextLink
            label="View clinic profile"
            icon="business-outline"
            onPress={handleProfilePress}
          />
        ) : null}
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Messaging status</Text>
        <Text style={styles.statusBody}>{messagingStatus}</Text>
      </View>

      {Platform.OS === 'web' ? (
        <Text style={styles.hint}>↑ ↓ navigate conversations · Escape returns focus to inbox</Text>
      ) : null}
    </View>
  );
}
