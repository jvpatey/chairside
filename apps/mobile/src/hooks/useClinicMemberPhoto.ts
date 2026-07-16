import {
  deleteClinicMemberPhoto,
  uploadClinicMemberPhotoFromBase64,
} from '@chairside/api';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicMemberPhotoUri } from '@/hooks/useClinicMemberPhotoUri';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { readFileAsBase64 } from '@/lib/readFileAsBase64';

export function useClinicMemberPhoto() {
  const { membership, organization, refreshClinicProfile } = useClinicProfile();
  const storagePath = membership?.photo_storage_path;
  const photoUri = useClinicMemberPhotoUri(storagePath);
  const [isUploading, setIsUploading] = useState(false);

  const organizationId = organization?.id ?? membership?.organization_id;
  const membershipId = membership?.id;

  const pickPhoto = async () => {
    if (!organizationId || !membershipId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo library access to add a profile photo.',
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setIsUploading(true);
      const base64 = await readFileAsBase64(
        asset.uri,
        Platform.OS === 'web' ? (asset as { file?: File }).file : undefined,
      );
      await uploadClinicMemberPhotoFromBase64(
        organizationId,
        membershipId,
        base64,
        asset.mimeType ?? 'image/jpeg',
        membership?.photo_storage_path,
      );
      await refreshClinicProfile();
    } catch (error) {
      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!organizationId || !membershipId || !storagePath) return;

    showConfirmActionSheet({
      title: 'Remove photo',
      message: 'Your group profile will no longer show a photo.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        setIsUploading(true);
        try {
          await deleteClinicMemberPhoto(organizationId, membershipId, storagePath);
          await refreshClinicProfile();
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

  return {
    photoUri,
    hasPhoto: Boolean(storagePath),
    isUploading,
    pickPhoto,
    removePhoto,
  };
}
