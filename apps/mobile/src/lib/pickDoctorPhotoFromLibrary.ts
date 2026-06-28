import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

import { readFileAsBase64 } from '@/lib/readFileAsBase64';

type PickedDoctorPhoto = {
  previewUri: string;
  base64: string;
  contentType: string;
};

export async function pickDoctorPhotoFromLibrary(): Promise<PickedDoctorPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to add a doctor photo.');
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
    previewUri: asset.uri,
    base64,
    contentType: asset.mimeType ?? 'image/jpeg',
  };
}
