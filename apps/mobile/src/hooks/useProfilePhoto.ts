import { deleteWorkerPhoto, uploadWorkerPhotoFromBase64 } from '@chairside/api';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { cropProfilePhotoToBase64 } from '@/lib/cropProfilePhoto';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { loadImageDimensions } from '@/lib/loadImageDimensions';
import {
  PROFILE_PHOTO_CROP_VIEWPORT,
  type ProfilePhotoCropTransform,
} from '@/lib/profilePhotoCrop';
import { readFileAsBase64 } from '@/lib/readFileAsBase64';

export type ProfilePhotoCropCandidate = {
  uri: string;
  mimeType: string;
  width: number;
  height: number;
  file?: File;
};

export function useProfilePhoto() {
  const { user } = useAuth();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const storagePath = workerProfile?.photo_storage_path;
  const photoUri = useWorkerPhotoUri(storagePath);
  const [isUploading, setIsUploading] = useState(false);
  const [cropCandidate, setCropCandidate] = useState<ProfilePhotoCropCandidate | null>(null);

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
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const dimensions =
        asset.width && asset.height
          ? { width: asset.width, height: asset.height }
          : await loadImageDimensions(asset.uri);

      setCropCandidate({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        width: dimensions.width,
        height: dimensions.height,
        file: Platform.OS === 'web' ? (asset as { file?: File }).file : undefined,
      });
    } catch (error) {
      Alert.alert(
        'Could not open photo',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const cancelCrop = () => {
    setCropCandidate(null);
  };

  const confirmCrop = async (transform: ProfilePhotoCropTransform) => {
    if (!user?.id || !cropCandidate) return;

    setIsUploading(true);
    try {
      const cropped = await cropProfilePhotoToBase64(
        cropCandidate.uri,
        cropCandidate.width,
        cropCandidate.height,
        PROFILE_PHOTO_CROP_VIEWPORT,
        transform,
      );
      await uploadWorkerPhotoFromBase64(
        user.id,
        cropped.base64,
        cropped.mimeType,
        workerProfile?.photo_storage_path,
      );
      setCropCandidate(null);
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
    cropCandidate,
    pickPhoto,
    cancelCrop,
    confirmCrop,
    removePhoto,
  };
}
