import type { PracticeDoctor } from '@chairside/config';
import { StyleSheet, Text, View } from 'react-native';

import { PracticeDoctorAvatar } from '@/components/clinic/PracticeDoctorAvatar';
import { FieldValue } from '@/components/profile/ProfileDetailBlocks';
import { usePracticeDoctorPhotoUri } from '@/hooks/usePracticeDoctorPhotoUri';
import { fontSemibold, useThemedStyles } from '@/theme';

type PracticeDoctorListProps = {
  doctors: PracticeDoctor[];
};

function PracticeDoctorRow({ doctor }: { doctor: PracticeDoctor }) {
  const photoUri = usePracticeDoctorPhotoUri(doctor.photo_storage_path);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    name: {
      ...typography.body,
      fontFamily: fontSemibold,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    title: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
    bio: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      marginTop: spacing.xs,
    },
  }));

  return (
    <View style={styles.row}>
      <PracticeDoctorAvatar name={doctor.name} photoUri={photoUri} size={48} />
      <View style={styles.textBlock}>
        <Text style={styles.name}>{doctor.name}</Text>
        {doctor.title ? <Text style={styles.title}>{doctor.title}</Text> : null}
        {doctor.bio ? <Text style={styles.bio}>{doctor.bio}</Text> : null}
      </View>
    </View>
  );
}

export function PracticeDoctorList({ doctors }: PracticeDoctorListProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    list: {
      gap: 0,
    },
    item: {
      paddingBottom: spacing.sm,
    },
    itemSeparated: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
      marginTop: spacing.sm,
      paddingTop: spacing.md,
    },
  }));

  if (doctors.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {doctors.map((doctor, index) => (
        <View
          key={doctor.id}
          style={[styles.item, index > 0 && styles.itemSeparated]}>
          <PracticeDoctorRow doctor={doctor} />
        </View>
      ))}
    </View>
  );
}

export function PracticeDoctorReviewValue({ doctors }: PracticeDoctorListProps) {
  if (doctors.length === 0) return '—';

  return doctors
    .map((doctor) => (doctor.title ? `${doctor.name} (${doctor.title})` : doctor.name))
    .join(', ');
}

export function PracticeDoctorFieldValue({ doctors }: PracticeDoctorListProps) {
  if (doctors.length === 0) {
    return <FieldValue value={null} />;
  }

  return <PracticeDoctorList doctors={doctors} />;
}
