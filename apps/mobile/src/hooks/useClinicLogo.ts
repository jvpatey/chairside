import { deleteClinicLogo, uploadClinicLogoFromBase64 } from '@chairside/api';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { readFileAsBase64 } from '@/lib/readFileAsBase64';

export function useClinicLogo() {
  const { user } = useAuth();
  const { clinicProfile, refreshClinicProfile } = useClinicProfile();
  const storagePath = clinicProfile?.logo_storage_path;
  const logoUri = useClinicLogoUri(storagePath);
  const [isUploading, setIsUploading] = useState(false);

  const pickLogo = async () => {
    if (!user?.id) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo library access to add a clinic logo.',
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
      await uploadClinicLogoFromBase64(
        user.id,
        base64,
        asset.mimeType ?? 'image/jpeg',
        clinicProfile?.logo_storage_path,
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

  const removeLogo = async () => {
    if (!user?.id || !storagePath) return;

    showConfirmActionSheet({
      title: 'Remove logo',
      message: 'Your clinic profile will no longer show a logo.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        setIsUploading(true);
        try {
          await deleteClinicLogo(user.id, storagePath);
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
    logoUri,
    hasLogo: Boolean(storagePath),
    isUploading,
    pickLogo,
    removeLogo,
  };
}
