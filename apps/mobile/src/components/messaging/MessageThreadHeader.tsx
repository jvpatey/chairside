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

type MessageThreadHeaderProps = {
  conversation: Conversation | null;
  role: 'worker' | 'clinic';
  title: string;
  subtitle: string;
  compact?: boolean;
  /** When false, only the counterpart name is shown (context panel carries the rest). */
  showContextDetails?: boolean;
  onBack?: () => void;
};

function HeaderAvatar({
  conversation,
  role,
  size,
}: {
  conversation: Conversation;
  role: 'worker' | 'clinic';
  size: number;
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

export function MessageThreadHeader({
  conversation,
  role,
  title,
  subtitle,
  compact = false,
  showContextDetails = true,
  onBack,
}: MessageThreadHeaderProps) {
  const { colors } = useTheme();
  const display = conversation ? formatConversationDisplay(conversation, role) : null;
  const typeChip = conversation ? getConversationTypeChip(conversation) : null;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      ...webPointer(),
    },
    backButtonPressed: {
      opacity: 0.75,
    },
    identityPressable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 0,
      borderRadius: 12,
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    identityPressed: {
      opacity: 0.92,
    },
    textWrap: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    title: {
      ...typography.body,
      fontSize: compact ? 16 : 17,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    titleMinimal: {
      ...typography.body,
      fontSize: compact ? 16 : 17,
      fontWeight: '700',
      color: colors.labelPrimary,
      flex: 1,
      minWidth: 0,
    },
    chipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: colors.primarySubtle,
    },
    chipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.2,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      flexShrink: 1,
    },
  }));

  const handleIdentityPress = () => {
    if (!conversation) return;

    if (role === 'worker') {
      if (conversation.conversation_type === 'application' && conversation.application_id) {
        router.push(getWorkerApplicationRoute(conversation.application_id, 'messages-tab'));
        return;
      }
      router.push(getWorkerClinicProfileRoute(conversation.clinic_id));
      return;
    }

    if (conversation.application_id) {
      router.push(getClinicApplicationRoute(conversation.application_id, 'messages-tab'));
    }
  };

  const headerTitle = display?.threadTitle ?? title;
  const headerSubtitle = display?.threadSubtitle ?? subtitle;

  if (!showContextDetails) {
    return (
      <View style={styles.container}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            hitSlop={8}
            style={({ pressed, hovered }) => [
              styles.backButton,
              webHover(hovered, pressed, { backgroundColor: colors.fillSubtle }),
              pressed && styles.backButtonPressed,
            ]}>
            <Ionicons
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
              size={22}
              color={colors.primary}
            />
          </Pressable>
        ) : null}
        <Text style={styles.titleMinimal} numberOfLines={1}>
          {headerTitle}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={8}
          style={({ pressed, hovered }) => [
            styles.backButton,
            webHover(hovered, pressed, { backgroundColor: colors.fillSubtle }),
            pressed && styles.backButtonPressed,
          ]}>
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={22}
            color={colors.primary}
          />
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${headerTitle}. ${headerSubtitle}`}
        disabled={!conversation}
        onPress={handleIdentityPress}
        style={({ pressed }) => [styles.identityPressable, pressed && styles.identityPressed]}>
        {conversation ? <HeaderAvatar conversation={conversation} role={role} size={compact ? 36 : 40} /> : null}
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {headerTitle}
          </Text>
          <View style={styles.chipRow}>
            {typeChip ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{typeChip.label}</Text>
              </View>
            ) : null}
            <Text style={styles.subtitle} numberOfLines={compact ? 1 : 2}>
              {headerSubtitle}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
