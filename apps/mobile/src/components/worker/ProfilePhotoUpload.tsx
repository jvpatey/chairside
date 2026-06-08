import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import {
  webHover,
  webPillButtonHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ProfilePhotoUploadProps = {
  onUpdated?: () => void;
};

export function ProfilePhotoUpload({ onUpdated }: ProfilePhotoUploadProps) {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { photoUri, hasPhoto, isUploading, pickPhoto, removePhoto } = useProfilePhoto();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
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
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, alignItems: 'center' },
    action: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    actionHovered: webPillButtonHoverStyles(colors),
    actionPrimary: { backgroundColor: colors.primary },
    actionPrimaryHovered: {
      opacity: 0.92,
    },
    actionText: { fontSize: 14, fontWeight: '600', color: colors.primary },
    actionTextPrimary: { color: colors.primaryOnPrimary },
    empty: typography.subtitle,
  }));

  const handlePick = async () => {
    await pickPhoto();
    onUpdated?.();
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <WorkerProfileAvatar
          displayName={profile?.display_name}
          photoUri={photoUri}
          size={56}
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

      {!hasPhoto ? (
        <Text style={styles.empty}>Professional headshot recommended.</Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={({ pressed, hovered }) => [
            styles.action,
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
      </View>
    </View>
  );
}
