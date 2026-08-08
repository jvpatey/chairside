export const PROFILE_PHOTO_CROP_VIEWPORT = 280;
export const PROFILE_PHOTO_OUTPUT_SIZE = 512;
export const PROFILE_PHOTO_MIN_SCALE = 1;
export const PROFILE_PHOTO_MAX_SCALE = 3;

export type ProfilePhotoCropTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

export function getProfilePhotoBaseScale(
  imageWidth: number,
  imageHeight: number,
  cropViewportSize: number,
): number {
  return Math.max(cropViewportSize / imageWidth, cropViewportSize / imageHeight);
}

export function getProfilePhotoDisplaySize(
  imageWidth: number,
  imageHeight: number,
  cropViewportSize: number,
  transform: ProfilePhotoCropTransform,
): { width: number; height: number } {
  const baseScale = getProfilePhotoBaseScale(imageWidth, imageHeight, cropViewportSize);
  return {
    width: imageWidth * baseScale * transform.scale,
    height: imageHeight * baseScale * transform.scale,
  };
}

export function clampProfilePhotoTransform(
  imageWidth: number,
  imageHeight: number,
  cropViewportSize: number,
  transform: ProfilePhotoCropTransform,
): ProfilePhotoCropTransform {
  const scale = Math.min(
    PROFILE_PHOTO_MAX_SCALE,
    Math.max(PROFILE_PHOTO_MIN_SCALE, transform.scale),
  );
  const { width: displayWidth, height: displayHeight } = getProfilePhotoDisplaySize(
    imageWidth,
    imageHeight,
    cropViewportSize,
    { ...transform, scale },
  );

  const maxTranslateX = Math.max(0, (displayWidth - cropViewportSize) / 2);
  const maxTranslateY = Math.max(0, (displayHeight - cropViewportSize) / 2);

  return {
    scale,
    translateX: Math.min(maxTranslateX, Math.max(-maxTranslateX, transform.translateX)),
    translateY: Math.min(maxTranslateY, Math.max(-maxTranslateY, transform.translateY)),
  };
}

export function computeProfilePhotoCropRect(
  imageWidth: number,
  imageHeight: number,
  cropViewportSize: number,
  transform: ProfilePhotoCropTransform,
): { originX: number; originY: number; size: number } {
  const clamped = clampProfilePhotoTransform(
    imageWidth,
    imageHeight,
    cropViewportSize,
    transform,
  );
  const baseScale = getProfilePhotoBaseScale(imageWidth, imageHeight, cropViewportSize);
  const pixelScale = baseScale * clamped.scale;
  const cropSize = cropViewportSize / pixelScale;
  const centerX = imageWidth / 2 - clamped.translateX / pixelScale;
  const centerY = imageHeight / 2 - clamped.translateY / pixelScale;

  const originX = Math.max(0, Math.min(imageWidth - cropSize, centerX - cropSize / 2));
  const originY = Math.max(0, Math.min(imageHeight - cropSize, centerY - cropSize / 2));

  return {
    originX,
    originY,
    size: Math.min(cropSize, imageWidth - originX, imageHeight - originY),
  };
}
