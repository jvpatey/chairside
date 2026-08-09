import {
  SaveFormat,
  manipulateAsync,
} from 'expo-image-manipulator';

import {
  PROFILE_PHOTO_OUTPUT_SIZE,
  computeProfilePhotoCropRect,
  type ProfilePhotoCropTransform,
} from '@/lib/profilePhotoCrop';

export async function cropProfilePhotoToBase64(
  uri: string,
  imageWidth: number,
  imageHeight: number,
  cropViewportSize: number,
  transform: ProfilePhotoCropTransform,
): Promise<{ base64: string; mimeType: string }> {
  const cropRect = computeProfilePhotoCropRect(
    imageWidth,
    imageHeight,
    cropViewportSize,
    transform,
  );

  const result = await manipulateAsync(
    uri,
    [
      {
        crop: {
          originX: Math.round(cropRect.originX),
          originY: Math.round(cropRect.originY),
          width: Math.round(cropRect.size),
          height: Math.round(cropRect.size),
        },
      },
      { resize: { width: PROFILE_PHOTO_OUTPUT_SIZE } },
    ],
    {
      compress: 0.85,
      format: SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!result.base64) {
    throw new Error('Could not crop photo.');
  }

  return {
    base64: result.base64,
    mimeType: 'image/jpeg',
  };
}
