import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { readFileAsBase64 } from '@/lib/readFileAsBase64';
import { useTheme, useThemedStyles } from '@/theme';
import {
  deleteClinicLocationLogo,
  uploadClinicLocationLogoFromBase64,
} from '@chairside/api';

export type PendingLocationPhoto = {
  uri: string;
  base64: string;
  contentType: string;
};

type ClinicLocationPhotoFieldProps = {
  organizationId: string | null | undefined;
  locationId: string | null | undefined;
  locationName: string;
  logoStoragePath: string | null | undefined;
  pendingPhoto: PendingLocationPhoto | null;
  onPendingPhotoChange: (photo: PendingLocationPhoto | null) => void;
  onUploaded?: () => Promise<void> | void;
};

export async function pickLocationPhotoFile(): Promise<PendingLocationPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to add a clinic photo.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const base64 = await readFileAsBase64(
    asset.uri,
    Platform.OS === 'web' ? (asset as { file?: File }).file : undefined,
  );

  return {
    uri: asset.uri,
    base64,
    contentType: asset.mimeType ?? 'image/jpeg',
  };
}

export async function uploadPendingLocationPhoto(input: {
  organizationId: string;
  locationId: string;
  pending: PendingLocationPhoto;
  existingStoragePath?: string | null;
}): Promise<void> {
  await uploadClinicLocationLogoFromBase64(
    input.organizationId,
    input.locationId,
    input.pending.base64,
    input.pending.contentType,
    input.existingStoragePath,
  );
}

export function ClinicLocationPhotoField({
  organizationId,
  locationId,
  locationName,
  logoStoragePath,
  pendingPhoto,
  onPendingPhotoChange,
  onUploaded,
}: ClinicLocationPhotoFieldProps) {
  const { colors } = useTheme();
  const savedUri = useClinicLogoUri(logoStoragePath);
  const displayUri = pendingPhoto?.uri ?? savedUri;
  const [isUploading, setIsUploading] = useState(false);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    section: { gap: spacing.sm, alignItems: 'center' as const },
    labelRow: { alignSelf: 'stretch' as const, gap: spacing.xs },
    label: { ...typography.body, fontWeight: '600' as const },
    hint: typography.subtitle,
    actions: {
      flexDirection: 'row' as const,
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    action: { ...typography.body, color: colors.primary, fontWeight: '600' as const },
    secondary: { ...typography.body, color: colors.labelSecondary },
  }));

  const handlePick = async () => {
    try {
      const picked = await pickLocationPhotoFile();
      if (!picked) return;

      if (organizationId && locationId) {
        setIsUploading(true);
        await uploadClinicLocationLogoFromBase64(
          organizationId,
          locationId,
          picked.base64,
          picked.contentType,
          logoStoragePath,
        );
        onPendingPhotoChange(null);
        await onUploaded?.();
      } else {
        onPendingPhotoChange(picked);
      }
    } catch (error) {
      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (pendingPhoto && !logoStoragePath) {
      onPendingPhotoChange(null);
      return;
    }

    if (!organizationId || !locationId) {
      onPendingPhotoChange(null);
      return;
    }

    showConfirmActionSheet({
      title: 'Remove photo',
      message: 'This location will no longer show a clinic photo.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        setIsUploading(true);
        try {
          await deleteClinicLocationLogo(organizationId, locationId, logoStoragePath);
          onPendingPhotoChange(null);
          await onUploaded?.();
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

  const hasPhoto = Boolean(displayUri);

  return (
    <View style={styles.section}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Clinic photo (optional)</Text>
        <Text style={styles.hint}>
          Matches the photo candidates see for an individual clinic at this location.
        </Text>
      </View>
      <Pressable
        onPress={() => void handlePick()}
        disabled={isUploading}
        accessibilityRole="button"
        accessibilityLabel={hasPhoto ? 'Change clinic photo' : 'Add clinic photo'}>
        <ClinicLogoAvatar
          clinicName={locationName || 'Clinic'}
          logoUri={displayUri}
          size={88}
          isLoading={isUploading}
        />
      </Pressable>
      <View style={styles.actions}>
        <Pressable disabled={isUploading} onPress={() => void handlePick()}>
          <Text style={styles.action}>
            {isUploading ? 'Uploading…' : hasPhoto ? 'Change photo' : 'Add photo'}
          </Text>
        </Pressable>
        {hasPhoto ? (
          <Pressable disabled={isUploading} onPress={handleRemove}>
            <Text style={styles.secondary}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
