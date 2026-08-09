import { Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { fontSemibold, useThemedStyles } from '@/theme';

type ApplicantAvatarStackProps = {
  /** Display names for initials fallback. */
  names: string[];
  /** Optional signed photo URIs aligned with names. */
  photoUris?: (string | null)[];
  /** Optional storage paths resolved to signed URIs when `photoUris` is omitted. */
  photoPaths?: (string | null)[];
  maxVisible?: number;
  size?: number;
};

function StackAvatar({
  name,
  photoUri,
  photoPath,
  size,
}: {
  name: string;
  photoUri?: string | null;
  photoPath?: string | null;
  size: number;
}) {
  const resolvedUri = useWorkerPhotoUri(photoUri ? null : photoPath);
  return <WorkerProfileAvatar displayName={name} photoUri={photoUri ?? resolvedUri} size={size} />;
}

/** Overlapping applicant avatars for role cards and lists. */
export function ApplicantAvatarStack({
  names,
  photoUris = [],
  photoPaths = [],
  maxVisible = 3,
  size = 32,
}: ApplicantAvatarStackProps) {
  const visible = names.slice(0, maxVisible);
  const overflow = names.length - visible.length;
  const overlap = Math.round(size * 0.28);

  const styles = useThemedStyles(({ colors, radii }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarWrap: {
      borderRadius: radii.pill,
      borderWidth: 2,
      borderColor: colors.surface,
      backgroundColor: colors.surface,
    },
    overflow: {
      marginLeft: visible.length > 0 ? -overlap : 0,
      minWidth: size,
      height: size,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    overflowLabel: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  if (names.length === 0) return null;

  return (
    <View style={styles.row}>
      {visible.map((name, index) => (
        <View
          key={`${name}-${index}`}
          style={[styles.avatarWrap, index > 0 ? { marginLeft: -overlap } : null]}>
          <StackAvatar
            name={name}
            photoUri={photoUris[index]}
            photoPath={photoPaths[index]}
            size={size}
          />
        </View>
      ))}
      {overflow > 0 ? (
        <View style={styles.overflow}>
          <Text style={styles.overflowLabel}>+{overflow}</Text>
        </View>
      ) : null}
    </View>
  );
}
