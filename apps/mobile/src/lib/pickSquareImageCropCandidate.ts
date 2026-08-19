import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

import { loadImageDimensions } from '@/lib/loadImageDimensions';

export type SquareImageCropCandidate = {
  uri: string;
  mimeType: string;
  width: number;
  height: number;
  file?: File;
};

/** Opens the library and returns a full image for the in-app square crop editor. */
export async function pickSquareImageCropCandidate(options?: {
  permissionMessage?: string;
}): Promise<SquareImageCropCandidate | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Permission needed',
      options?.permissionMessage ?? 'Allow photo library access to add a photo.',
    );
    return null;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const dimensions =
      asset.width && asset.height
        ? { width: asset.width, height: asset.height }
        : await loadImageDimensions(asset.uri);

    return {
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
      width: dimensions.width,
      height: dimensions.height,
      file: Platform.OS === 'web' ? (asset as { file?: File }).file : undefined,
    };
  } catch (error) {
    Alert.alert(
      'Could not open photo',
      error instanceof Error ? error.message : 'Please try again.',
    );
    return null;
  }
}
