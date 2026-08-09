import {
  PROFILE_PHOTO_OUTPUT_SIZE,
  computeProfilePhotoCropRect,
  type ProfilePhotoCropTransform,
} from '@/lib/profilePhotoCrop';

function loadHtmlImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load photo.'));
    image.src = uri;
  });
}

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
  const image = await loadHtmlImage(uri);
  const canvas = document.createElement('canvas');
  canvas.width = PROFILE_PHOTO_OUTPUT_SIZE;
  canvas.height = PROFILE_PHOTO_OUTPUT_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not crop photo.');
  }

  context.drawImage(
    image,
    cropRect.originX,
    cropRect.originY,
    cropRect.size,
    cropRect.size,
    0,
    0,
    PROFILE_PHOTO_OUTPUT_SIZE,
    PROFILE_PHOTO_OUTPUT_SIZE,
  );

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const base64 = dataUrl.split(',')[1];
  if (!base64) {
    throw new Error('Could not crop photo.');
  }

  return {
    base64,
    mimeType: 'image/jpeg',
  };
}
