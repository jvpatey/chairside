import { describe, expect, it } from 'vitest';

import {
  PROFILE_PHOTO_CROP_VIEWPORT,
  clampProfilePhotoTransform,
  computeProfilePhotoCropRect,
} from './profilePhotoCrop';

describe('profilePhotoCrop', () => {
  it('keeps the crop square inside the image bounds', () => {
    const rect = computeProfilePhotoCropRect(1200, 800, PROFILE_PHOTO_CROP_VIEWPORT, {
      scale: 1.2,
      translateX: 40,
      translateY: -20,
    });

    expect(rect.originX).toBeGreaterThanOrEqual(0);
    expect(rect.originY).toBeGreaterThanOrEqual(0);
    expect(rect.originX + rect.size).toBeLessThanOrEqual(1200);
    expect(rect.originY + rect.size).toBeLessThanOrEqual(800);
  });

  it('centers the crop when no transform is applied', () => {
    const rect = computeProfilePhotoCropRect(1000, 1000, PROFILE_PHOTO_CROP_VIEWPORT, {
      scale: 1,
      translateX: 0,
      translateY: 0,
    });

    expect(rect.size).toBeCloseTo(1000, 0);
    expect(rect.originX).toBeCloseTo(0, 0);
    expect(rect.originY).toBeCloseTo(0, 0);
  });

  it('clamps panning so the crop area stays covered', () => {
    const clamped = clampProfilePhotoTransform(800, 1200, PROFILE_PHOTO_CROP_VIEWPORT, {
      scale: 1,
      translateX: 500,
      translateY: -500,
    });

    expect(Math.abs(clamped.translateX)).toBeLessThan(500);
    expect(Math.abs(clamped.translateY)).toBeLessThan(500);
  });
});
