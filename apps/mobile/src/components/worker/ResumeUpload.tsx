import { deleteWorkerResume, uploadWorkerResumeFromBase64 } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { buildResumeFileName, openResumePreview } from '@/lib/openResumePreview';
import { readFileAsBase64 } from '@/lib/readFileAsBase64';
import {
  webHover,
  webPointer,
  webPillButtonHoverStyles,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ResumeUploadProps = {
  onUploaded?: () => void;
  embedded?: boolean;
};

export function ResumeUpload({ onUploaded, embedded = false }: ResumeUploadProps) {
  const { user } = useAuth();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { colors } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

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
    embeddedRow: {
      justifyContent: 'center',
      maxWidth: '100%',
    },
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
    actionEmbeddedSingle: {
      flex: 1,
      alignItems: 'center',
    },
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
    embeddedEmpty: {
      ...typography.subtitle,
      textAlign: 'center',
      color: colors.labelSecondary,
    },
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
      const base64 = await readFileAsBase64(
        asset.uri,
        Platform.OS === 'web' ? (asset as { file?: File }).file : undefined,
      );
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

  const actionButtons = (
    <>
      {hasResume ? (
        <Pressable
          style={({ pressed, hovered }) => [
            styles.action,
            webHover(hovered, pressed, styles.actionHovered, isBusy),
            pressed && { opacity: 0.85 },
          ]}
          disabled={isBusy}
          onPress={() => void handleView()}>
          <Text style={styles.actionText}>{isViewing ? 'Opening…' : 'View'}</Text>
        </Pressable>
      ) : null}
      <Pressable
        style={({ pressed, hovered }) => [
          styles.action,
          embedded && !hasResume && styles.actionEmbeddedSingle,
          !hasResume && styles.actionPrimary,
          webHover(
            hovered,
            pressed,
            !hasResume ? styles.actionPrimaryHovered : styles.actionHovered,
            isBusy,
          ),
          pressed && { opacity: 0.85 },
        ]}
        disabled={isBusy}
        onPress={handlePick}>
        <Text style={[styles.actionText, !hasResume && styles.actionTextPrimary]}>
          {hasResume ? 'Replace' : 'Upload PDF'}
        </Text>
      </Pressable>
      {hasResume ? (
        <Pressable
          style={({ pressed, hovered }) => [
            styles.action,
            webHover(hovered, pressed, styles.actionHovered, isBusy),
            pressed && { opacity: 0.85 },
          ]}
          disabled={isBusy}
          onPress={handleRemove}>
          <Text style={styles.actionText}>Remove</Text>
        </Pressable>
      ) : null}
    </>
  );

  return (
    <View style={styles.card}>
      {hasResume ? (
        <View style={[styles.row, embedded && styles.embeddedRow]}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text" size={22} color={colors.primary} />
          </View>
          <View style={[styles.textBlock, embedded && { flex: 0, flexShrink: 1 }]}>
            <Text style={styles.fileName} numberOfLines={1}>
              {workerProfile?.resume_file_name ?? 'Resume.pdf'}
            </Text>
            {!embedded ? (
              <Text style={styles.meta}>Optional PDF attached to role applications</Text>
            ) : null}
          </View>
          {isBusy ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
      ) : (
        <Text style={embedded ? styles.embeddedEmpty : styles.empty}>
          {embedded
            ? 'No resume uploaded yet.'
            : 'No resume uploaded. You can add an optional PDF anytime.'}
        </Text>
      )}

      <View
        style={[
          embedded ? styles.embeddedActions : styles.actions,
          embedded && !hasResume && styles.embeddedActionsSingle,
        ]}>
        {actionButtons}
      </View>
    </View>
  );
}
