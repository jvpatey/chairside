import { deleteClinicLogo, uploadClinicLogoFromBase64 } from '@chairside/api';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { readFileAsBase64 } from '@/lib/readFileAsBase64';

/** Survives React remounts (Strict Mode / screen refresh) during setup upload. */
const logoPreviewByClinicId = new Map<string, string>();
const logoPathByClinicId = new Map<string, string>();

function normalizeImageContentType(contentType: string | null | undefined): string {
  const raw = (contentType ?? '').toLowerCase();
  if (raw === 'image/jpg' || raw === 'image/jpeg') return 'image/jpeg';
  if (raw === 'image/png') return 'image/png';
  if (raw === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function toDataUri(base64: string, contentType: string): string {
  return `data:${normalizeImageContentType(contentType)};base64,${base64}`;
}

export function useClinicLogo() {
  const { user } = useAuth();
  const { clinicId, clinicProfile, refreshClinicProfile } = useClinicProfile();
  const ownerClinicId = clinicId ?? user?.id ?? null;
  const cacheKey = ownerClinicId ?? 'pending';

  const savedPath = clinicProfile?.logo_storage_path?.trim() || null;
  const [previewUri, setPreviewUriState] = useState<string | null>(
    () => logoPreviewByClinicId.get(cacheKey) ?? null,
  );
  const [optimisticPath, setOptimisticPathState] = useState<string | null>(
    () => logoPathByClinicId.get(cacheKey) ?? null,
  );
  const [isUploading, setIsUploading] = useState(false);

  const setPreviewUri = (uri: string | null) => {
    if (uri) logoPreviewByClinicId.set(cacheKey, uri);
    else logoPreviewByClinicId.delete(cacheKey);
    setPreviewUriState(uri);
  };

  const setOptimisticPath = (path: string | null) => {
    if (path) logoPathByClinicId.set(cacheKey, path);
    else logoPathByClinicId.delete(cacheKey);
    setOptimisticPathState(path);
  };

  const storagePath = savedPath || optimisticPath || logoPathByClinicId.get(cacheKey) || null;
  const remoteUri = useClinicLogoUri(storagePath);

  // Always prefer the local preview for this session. Do not clear it when a
  // remote URL arrives — signed/remote loads were flashing then failing and
  // wiping the avatar back to initials.
  const logoUri =
    previewUri ||
    logoPreviewByClinicId.get(cacheKey) ||
    remoteUri;

  const pickLogo = async () => {
    if (!ownerClinicId) return;

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
      const contentType = normalizeImageContentType(asset.mimeType);
      setIsUploading(true);

      const base64 = await readFileAsBase64(
        asset.uri,
        Platform.OS === 'web' ? (asset as { file?: File }).file : undefined,
      );
      setPreviewUri(toDataUri(base64, contentType));

      const { storagePath: uploadedPath } = await uploadClinicLogoFromBase64(
        ownerClinicId,
        base64,
        contentType,
        savedPath ?? optimisticPath,
      );
      setOptimisticPath(uploadedPath);

      const refreshed = await refreshClinicProfile();
      const refreshedPath = refreshed?.logo_storage_path?.trim() || null;
      if (refreshedPath) {
        setOptimisticPath(refreshedPath);
      }
    } catch (error) {
      // Keep any preview that already rendered unless upload never started.
      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeLogo = async () => {
    const pathToRemove = storagePath;
    if (!ownerClinicId || !pathToRemove) {
      setPreviewUri(null);
      setOptimisticPath(null);
      return;
    }

    showConfirmActionSheet({
      title: 'Remove logo',
      message: 'Your clinic profile will no longer show a logo.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        setIsUploading(true);
        try {
          await deleteClinicLogo(ownerClinicId, pathToRemove);
          setPreviewUri(null);
          setOptimisticPath(null);
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
    hasLogo: Boolean(storagePath) || Boolean(logoUri),
    isUploading,
    pickLogo,
    removeLogo,
  };
}
