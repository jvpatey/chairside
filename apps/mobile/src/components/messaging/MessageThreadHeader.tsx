import type { Conversation } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { ActionMenuSheet } from '@/components/ui/ActionMenuSheet';
import { PageHeader } from '@/components/ui/PageHeader';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import {
  formatConversationDisplay,
  getConversationTypeChip,
} from '@/lib/conversationDisplay';
import { getHideConversationMessage } from '@/lib/conversationHide';
import {
  getClinicApplicationRoute,
  getWorkerApplicationRoute,
  getWorkerClinicProfileRoute,
} from '@/lib/routing';
import { webHover, webIconButtonHoverStyles, webPointer } from '@/lib/webPressableStyles';
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
  onRemoveFromInbox?: () => Promise<void> | void;
  /** Wide web split view includes a collapsible context panel. */
  contextPanelAvailable?: boolean;
  contextPanelCollapsed?: boolean;
  onToggleContextPanel?: () => void;
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

function ThreadHeaderActions({
  conversation,
  role,
  onRemoveFromInbox,
  contextPanelAvailable,
  contextPanelCollapsed,
  onToggleContextPanel,
}: {
  conversation: Conversation | null;
  role: 'worker' | 'clinic';
  onRemoveFromInbox?: () => Promise<void> | void;
  contextPanelAvailable?: boolean;
  contextPanelCollapsed?: boolean;
  onToggleContextPanel?: () => void;
}) {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexShrink: 0,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: radii.sm,
      alignItems: 'center',
      justifyContent: 'center',
      ...webPointer(),
    },
    iconButtonHovered: webIconButtonHoverStyles(colors),
    iconButtonPressed: {
      opacity: 0.8,
    },
    detailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      height: 36,
      borderRadius: radii.sm,
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    detailsButtonHovered: {
      backgroundColor: colors.primarySubtle,
    },
    detailsButtonActive: {
      backgroundColor: colors.primarySubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    detailsLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  const handleRemoveConfirmed = async () => {
    try {
      await onRemoveFromInbox?.();
    } catch (error) {
      Alert.alert(
        'Could not remove',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const showDetailsToggle = Boolean(contextPanelAvailable && onToggleContextPanel);
  const showRemoveMenu = Boolean(onRemoveFromInbox && conversation);

  if (!showDetailsToggle && !showRemoveMenu) return null;

  return (
    <>
      <View style={styles.row}>
        {showDetailsToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={contextPanelCollapsed ? 'Show details panel' : 'Hide details panel'}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggleContextPanel?.();
            }}
            style={({ pressed, hovered }) => [
              styles.detailsButton,
              !contextPanelCollapsed && styles.detailsButtonActive,
              webHover(hovered, pressed, styles.detailsButtonHovered),
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.labelSecondary} />
            <Text style={styles.detailsLabel}>Details</Text>
          </Pressable>
        ) : null}
        {showRemoveMenu ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Conversation options"
            hitSlop={8}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMenuVisible(true);
            }}
            style={({ pressed, hovered }) => [
              styles.iconButton,
              webHover(hovered, pressed, styles.iconButtonHovered),
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.labelSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ActionMenuSheet
        visible={menuVisible}
        title={
          conversation ? formatConversationDisplay(conversation, role).cardName : 'Conversation'
        }
        actions={[
          ...(showRemoveMenu
            ? [
                {
                  label: 'Remove from inbox',
                  destructive: true,
                  onPress: () => {
                    setMenuVisible(false);
                    setConfirmVisible(true);
                  },
                },
              ]
            : []),
        ]}
        onClose={() => setMenuVisible(false)}
      />

      {conversation && onRemoveFromInbox ? (
        <ActionMenuSheet
          visible={confirmVisible}
          title="Remove conversation?"
          message={getHideConversationMessage(conversation)}
          actions={[
            {
              label: 'Remove',
              destructive: true,
              onPress: () => {
                void handleRemoveConfirmed();
              },
            },
          ]}
          onClose={() => setConfirmVisible(false)}
        />
      ) : null}
    </>
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
  onRemoveFromInbox,
  contextPanelAvailable,
  contextPanelCollapsed,
  onToggleContextPanel,
}: MessageThreadHeaderProps) {
  const display = conversation ? formatConversationDisplay(conversation, role) : null;
  const typeChip = conversation ? getConversationTypeChip(conversation) : null;

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    identityPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 0,
      borderRadius: radii.md,
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
      router.push(
        getWorkerClinicProfileRoute(conversation.clinic_id, {
          returnTo: 'messages-tab',
          conversationId: conversation.id,
        }),
      );
      return;
    }

    if (conversation.application_id) {
      router.push(getClinicApplicationRoute(conversation.application_id, 'messages-tab'));
    }
  };

  const headerTitle = display?.threadTitle ?? title;
  const headerSubtitle = display?.threadSubtitle ?? subtitle;

  const trailing = (
    <ThreadHeaderActions
      conversation={conversation}
      role={role}
      onRemoveFromInbox={onRemoveFromInbox}
      contextPanelAvailable={contextPanelAvailable}
      contextPanelCollapsed={contextPanelCollapsed}
      onToggleContextPanel={onToggleContextPanel}
    />
  );

  const compactTitle = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${headerTitle}. ${headerSubtitle}`}
      disabled={!conversation}
      onPress={handleIdentityPress}
      style={({ pressed }) => [styles.identityPressable, pressed && styles.identityPressed]}
    >
      {conversation ? (
        <HeaderAvatar conversation={conversation} role={role} size={compact ? 36 : 40} />
      ) : null}
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
          {headerSubtitle ? (
            <Text style={styles.subtitle} numberOfLines={compact ? 1 : 2}>
              {headerSubtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );

  if (!showContextDetails) {
    return (
      <PageHeader
        variant="detail"
        title={compactTitle}
        onBack={onBack}
        compact={compact}
        showNotifications={false}
        trailing={trailing}
      />
    );
  }

  const identityTitle = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${headerTitle}. ${headerSubtitle}`}
      disabled={!conversation}
      onPress={handleIdentityPress}
      style={({ pressed }) => [styles.identityPressable, pressed && styles.identityPressed]}
    >
      {conversation ? (
        <HeaderAvatar conversation={conversation} role={role} size={compact ? 36 : 40} />
      ) : null}
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
  );

  return (
    <PageHeader
      variant="detail"
      title={identityTitle}
      onBack={onBack}
      compact={compact}
      showNotifications={false}
      trailing={trailing}
    />
  );
}
