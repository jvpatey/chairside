import type { WorkerProfile } from '@chairside/api';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ApplicationPackagePreview } from '@/components/worker/ApplicationPackagePreview';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { fontSemibold, useThemedStyles } from '@/theme';

type ApplicationKitPreviewProps = {
  profile: WorkerProfile | null;
  displayName?: string | null;
  photoStoragePath?: string | null;
  showDefaultNote?: boolean;
  embedded?: boolean;
  title?: string;
  hint?: string;
  footer?: ReactNode;
};

export function ApplicationKitPreview({
  profile,
  displayName: displayNameProp,
  photoStoragePath,
  showDefaultNote = true,
  embedded = false,
  title,
  hint,
  footer,
}: ApplicationKitPreviewProps) {
  const { profile: authProfile } = useAuth();
  const displayName = displayNameProp ?? authProfile?.display_name;
  const resolvedPhotoPath = photoStoragePath ?? profile?.photo_storage_path;
  const photoUri = useWorkerPhotoUri(resolvedPhotoPath);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    shell: embedded
      ? { gap: spacing.md }
      : {
          gap: spacing.md,
        },
    header: {
      gap: spacing.xs,
    },
    previewLabel: {
      fontSize: 12,
      fontFamily: fontSemibold,
      fontWeight: '700',
      letterSpacing: 0.45,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    hint: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
      alignItems: 'center',
    },
    emptyTitle: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.labelPrimary,
    },
    emptyBody: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.labelSecondary,
    },
    footer: {
      paddingTop: spacing.xs,
    },
  }));

  const resolvedTitle = title ?? (embedded ? undefined : 'What clinics see');

  if (!profile) {
    return (
      <View style={styles.shell}>
        {resolvedTitle ? (
          <View style={styles.header}>
            <Text style={styles.previewLabel}>{resolvedTitle}</Text>
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
          </View>
        ) : null}
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Preview not ready</Text>
          <Text style={styles.emptyBody}>Complete your professional background first.</Text>
        </View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      {resolvedTitle || hint ? (
        <View style={styles.header}>
          {resolvedTitle ? <Text style={styles.previewLabel}>{resolvedTitle}</Text> : null}
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
      ) : null}
      <ApplicationPackagePreview
        profile={profile}
        displayName={displayName}
        photoUri={photoUri}
        showDefaultNote={showDefaultNote}
      />
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}
