import {
  deleteClinicMemberPhoto,
  uploadClinicMemberPhotoFromBase64,
} from '@chairside/api';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicMemberPhotoUri } from '@/hooks/useClinicMemberPhotoUri';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { cropProfilePhotoToBase64 } from '@/lib/cropProfilePhoto';
import {
  pickSquareImageCropCandidate,
  type SquareImageCropCandidate,
} from '@/lib/pickSquareImageCropCandidate';
import {
  PROFILE_PHOTO_CROP_VIEWPORT,
  type ProfilePhotoCropTransform,
} from '@/lib/profilePhotoCrop';

export function useClinicMemberPhoto() {
  const { membership, organization, refreshClinicProfile } = useClinicProfile();
  const storagePath = membership?.photo_storage_path;
  const photoUri = useClinicMemberPhotoUri(storagePath);
  const [isUploading, setIsUploading] = useState(false);
  const [cropCandidate, setCropCandidate] = useState<SquareImageCropCandidate | null>(null);

  const organizationId = organization?.id ?? membership?.organization_id;
  const membershipId = membership?.id;

  const pickPhoto = async () => {
    if (!organizationId || !membershipId) return;

    const candidate = await pickSquareImageCropCandidate({
      permissionMessage: 'Allow photo library access to add a profile photo.',
    });
    if (!candidate) return;

    setCropCandidate(candidate);
  };

  const cancelCrop = () => {
    setCropCandidate(null);
  };

  const confirmCrop = async (transform: ProfilePhotoCropTransform) => {
    if (!organizationId || !membershipId || !cropCandidate) return;

    setIsUploading(true);
    try {
      const cropped = await cropProfilePhotoToBase64(
        cropCandidate.uri,
        cropCandidate.width,
        cropCandidate.height,
        PROFILE_PHOTO_CROP_VIEWPORT,
        transform,
      );
      setCropCandidate(null);
      await uploadClinicMemberPhotoFromBase64(
        organizationId,
        membershipId,
        cropped.base64,
        cropped.mimeType,
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
    cropCandidate,
    pickPhoto,
    cancelCrop,
    confirmCrop,
    removePhoto,
  };
}
