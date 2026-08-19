import {
  pickSquareImageCropCandidate,
  type SquareImageCropCandidate,
} from '@/lib/pickSquareImageCropCandidate';

export type DoctorPhotoCropCandidate = SquareImageCropCandidate;

/** Opens the library and returns an image for the in-app square crop editor. */
export async function pickDoctorPhotoFromLibrary(): Promise<DoctorPhotoCropCandidate | null> {
  return pickSquareImageCropCandidate({
    permissionMessage: 'Allow photo library access to add a doctor photo.',
  });
}
