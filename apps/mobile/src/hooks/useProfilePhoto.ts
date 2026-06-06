import { deleteWorkerPhoto, uploadWorkerPhotoFromBase64 } from '@chairside/api';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { readFileAsBase64 } from '@/lib/readFileAsBase64';

export function useProfilePhoto() {
  const { user } = useAuth();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const storagePath = workerProfile?.photo_storage_path;
  const photoUri = useWorkerPhotoUri(storagePath);
  const [isUploading, setIsUploading] = useState(false);

  const pickPhoto = async () => {
    if (!user?.id) return;

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
      await uploadWorkerPhotoFromBase64(
        user.id,
        base64,
        asset.mimeType ?? 'image/jpeg',
        workerProfile?.photo_storage_path,
      );
      await refreshWorkerProfile();
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
    if (!user?.id || !storagePath) return;

    showConfirmActionSheet({
      title: 'Remove photo',
      message: 'Clinics will no longer see a profile photo with your applications.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        setIsUploading(true);
        try {
          await deleteWorkerPhoto(user.id, storagePath);
          await refreshWorkerProfile();
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
