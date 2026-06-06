import { deleteWorkerResume, uploadWorkerResumeFromBase64 } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { buildResumeFileName, openResumePreview } from '@/lib/openResumePreview';
import { useTheme, useThemedStyles } from '@/theme';

type ResumeUploadProps = {
  onUploaded?: () => void;
};

export function ResumeUpload({ onUploaded }: ResumeUploadProps) {
  const { user } = useAuth();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { colors } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

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
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textBlock: { flex: 1, gap: 2 },
    fileName: { ...typography.body, fontWeight: '600' },
    meta: typography.subtitle,
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    action: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      backgroundColor: colors.fillSubtle,
    },
    actionPrimary: { backgroundColor: colors.primary },
    actionText: { fontSize: 14, fontWeight: '600', color: colors.primary },
    actionTextPrimary: { color: colors.primaryOnPrimary },
    empty: typography.subtitle,
  }));

  const handlePick = async () => {
    if (!user?.id) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setIsUploading(true);
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await uploadWorkerResumeFromBase64(user.id, base64, asset.name ?? 'resume.pdf');
      await refreshWorkerProfile();
      onUploaded?.();
    } catch (error) {
      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = async () => {
    const storagePath = workerProfile?.resume_storage_path;
    if (!storagePath) return;

    setIsViewing(true);
    try {
      await openResumePreview(storagePath, resumeFileName);
    } catch (error) {
      Alert.alert(
        'Could not open resume',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsViewing(false);
    }
  };

  const handleRemove = async () => {
    if (!user?.id) return;

    showConfirmActionSheet({
      title: 'Remove resume',
      message: 'Clinics will no longer receive your resume with applications.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        setIsUploading(true);
        try {
          await deleteWorkerResume(user.id);
          await refreshWorkerProfile();
          onUploaded?.();
        } catch (error) {
          Alert.alert(
            'Could not remove',
            error instanceof Error ? error.message : 'Please try again.',
          );
        } finally {
          setIsUploading(false);
        }
      },
    });
  };

  const hasResume = Boolean(workerProfile?.resume_storage_path);
  const resumeFileName = buildResumeFileName({
    resumeFileName: workerProfile?.resume_file_name,
  });
  const isBusy = isUploading || isViewing;

  return (
    <View style={styles.card}>
      {hasResume ? (
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text" size={22} color={colors.primary} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.fileName} numberOfLines={1}>
              {workerProfile?.resume_file_name ?? 'Resume.pdf'}
            </Text>
            <Text style={styles.meta}>Optional PDF attached to role applications</Text>
          </View>
          {isBusy ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
      ) : (
        <Text style={styles.empty}>No resume uploaded. You can add an optional PDF anytime.</Text>
      )}

      <View style={styles.actions}>
        {hasResume ? (
          <Pressable style={styles.action} disabled={isBusy} onPress={() => void handleView()}>
            <Text style={styles.actionText}>{isViewing ? 'Opening…' : 'View'}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.action, !hasResume && styles.actionPrimary]}
          disabled={isBusy}
          onPress={handlePick}>
          <Text style={[styles.actionText, !hasResume && styles.actionTextPrimary]}>
            {hasResume ? 'Replace' : 'Upload PDF'}
          </Text>
        </Pressable>
        {hasResume ? (
          <Pressable style={styles.action} disabled={isBusy} onPress={handleRemove}>
            <Text style={styles.actionText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
