import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { ProfilePhotoCropEditor } from '@/components/worker/ProfilePhotoCropEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import type { ProfilePhotoCropTransform } from '@/lib/profilePhotoCrop';
import {
  webHover,
  webPillButtonHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ProfilePhotoUploadProps = {
  onUpdated?: () => void;
  embedded?: boolean;
  displayName?: string | null;
};

export function ProfilePhotoUpload({
  onUpdated,
  embedded = false,
  displayName,
}: ProfilePhotoUploadProps) {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const {
    photoUri,
    hasPhoto,
    isUploading,
    cropCandidate,
    pickPhoto,
    cancelCrop,
    confirmCrop,
    removePhoto,
  } = useProfilePhoto();
  const avatarSize = embedded ? 80 : 56;
  const resolvedDisplayName = displayName?.trim() || profile?.display_name;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: embedded
      ? {
          alignItems: 'center',
          gap: spacing.md,
          paddingTop: spacing.xs,
        }
      : {
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.separator,
          padding: spacing.md,
          gap: spacing.sm,
        },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    textBlock: { flex: 1, gap: 2 },
    title: { ...typography.body, fontWeight: '600' },
    meta: typography.subtitle,
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
      alignItems: 'center',
    },
    embeddedActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      width: '100%',
    },
    embeddedActionsSingle: {
      alignSelf: 'stretch',
    },
    action: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    actionEmbeddedSingle: {
      flex: 1,
      alignItems: 'center',
    },
    actionHovered: webPillButtonHoverStyles(colors),
    actionPrimary: { backgroundColor: colors.primary },
    actionPrimaryHovered: {
      opacity: 0.92,
    },
    actionText: { fontSize: 14, fontWeight: '600', color: colors.primary },
    actionTextPrimary: { color: colors.primaryOnPrimary },
  }));

  const handlePick = async () => {
    await pickPhoto();
  };

  const handleConfirmCrop = async (transform: ProfilePhotoCropTransform) => {
    await confirmCrop(transform);
    onUpdated?.();
  };

  const actionButtons = (
    <>
      <Pressable
        style={({ pressed, hovered }) => [
          styles.action,
          embedded && !hasPhoto && styles.actionEmbeddedSingle,
          !hasPhoto && styles.actionPrimary,
          webHover(hovered, pressed, !hasPhoto ? styles.actionPrimaryHovered : styles.actionHovered, isUploading),
          pressed && { opacity: 0.85 },
        ]}
        disabled={isUploading}
        onPress={() => void handlePick()}>
        <Text style={[styles.actionText, !hasPhoto && styles.actionTextPrimary]}>
          {hasPhoto ? 'Change photo' : 'Add photo'}
        </Text>
      </Pressable>
      {hasPhoto ? (
        <Pressable
          style={({ pressed, hovered }) => [
            styles.action,
            webHover(hovered, pressed, styles.actionHovered, isUploading),
            pressed && { opacity: 0.85 },
          ]}
          disabled={isUploading}
          onPress={removePhoto}>
          <Text style={styles.actionText}>Remove</Text>
        </Pressable>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <>
        <View style={styles.card}>
          <WorkerProfileAvatar
            displayName={resolvedDisplayName}
            photoUri={photoUri}
            size={avatarSize}
            isLoading={isUploading}
          />
          <View style={[styles.embeddedActions, !hasPhoto && styles.embeddedActionsSingle]}>
            {actionButtons}
          </View>
        </View>
        {cropCandidate ? (
          <ProfilePhotoCropEditor
            visible
            imageUri={cropCandidate.uri}
            imageWidth={cropCandidate.width}
            imageHeight={cropCandidate.height}
            isSaving={isUploading}
            onCancel={cancelCrop}
            onConfirm={(transform) => void handleConfirmCrop(transform)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <View style={styles.card}>
        <View style={styles.row}>
          <WorkerProfileAvatar
            displayName={resolvedDisplayName}
            photoUri={photoUri}
            size={avatarSize}
            isLoading={isUploading}
          />
          <View style={styles.textBlock}>
            <Text style={styles.title}>Profile photo</Text>
            <Text style={styles.meta}>
              Optional — included with role and fill-in applications.
            </Text>
          </View>
          {isUploading ? <ActivityIndicator color={colors.primary} /> : null}
        </View>

        <View style={styles.actions}>{actionButtons}</View>
      </View>
      {cropCandidate ? (
        <ProfilePhotoCropEditor
          visible
          imageUri={cropCandidate.uri}
          imageWidth={cropCandidate.width}
          imageHeight={cropCandidate.height}
          isSaving={isUploading}
          onCancel={cancelCrop}
          onConfirm={(transform) => void handleConfirmCrop(transform)}
        />
      ) : null}
    </>
  );
}
