import type { PracticeDoctor } from '@chairside/config';
import { StyleSheet, Text, View } from 'react-native';

import { PracticeDoctorAvatar } from '@/components/clinic/PracticeDoctorAvatar';
import { FieldValue } from '@/components/profile/ProfileDetailBlocks';
import { usePracticeDoctorPhotoUri } from '@/hooks/usePracticeDoctorPhotoUri';
import { fontSemibold, useThemedStyles } from '@/theme';

export type PracticeDoctorLocationLookup = {
  id: string;
  name: string;
};

type PracticeDoctorListProps = {
  doctors: PracticeDoctor[];
  locations?: PracticeDoctorLocationLookup[];
};

function formatDoctorLocationNames(
  doctor: PracticeDoctor,
  locationsById: Map<string, string>,
): string | null {
  const names = (doctor.location_ids ?? [])
    .map((id) => locationsById.get(id))
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) return null;
  return names.join(' · ');
}

function PracticeDoctorRow({
  doctor,
  locationLabel,
}: {
  doctor: PracticeDoctor;
  locationLabel: string | null;
}) {
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
        {locationLabel ? <Text style={styles.title}>{locationLabel}</Text> : null}
        {doctor.bio ? <Text style={styles.bio}>{doctor.bio}</Text> : null}
      </View>
    </View>
  );
}

export function PracticeDoctorList({ doctors, locations = [] }: PracticeDoctorListProps) {
  const locationsById = new Map(locations.map((location) => [location.id, location.name]));

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
          <PracticeDoctorRow
            doctor={doctor}
            locationLabel={formatDoctorLocationNames(doctor, locationsById)}
          />
        </View>
      ))}
    </View>
  );
}

export function PracticeDoctorReviewValue({
  doctors,
  locations = [],
}: PracticeDoctorListProps) {
  if (doctors.length === 0) return '—';

  const locationsById = new Map(locations.map((location) => [location.id, location.name]));

  return doctors
    .map((doctor) => {
      const base = doctor.title ? `${doctor.name} (${doctor.title})` : doctor.name;
      const locationLabel = formatDoctorLocationNames(doctor, locationsById);
      return locationLabel ? `${base} — ${locationLabel}` : base;
    })
    .join(', ');
}

function PracticeDoctorReviewCard({
  doctor,
  locations,
}: {
  doctor: PracticeDoctor;
  locations: PracticeDoctorLocationLookup[];
}) {
  const photoUri = usePracticeDoctorPhotoUri(doctor.photo_storage_path);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    name: {
      ...typography.body,
      fontFamily: fontSemibold,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    title: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: 2,
    },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    chipLabel: {
      ...typography.subtitle,
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.card}>
      <PracticeDoctorAvatar name={doctor.name} photoUri={photoUri} size={44} />
      <View style={styles.textBlock}>
        <Text style={styles.name}>{doctor.name}</Text>
        {doctor.title ? <Text style={styles.title}>{doctor.title}</Text> : null}
        {locations.length > 0 ? (
          <View style={styles.chips}>
            {locations.map((location) => (
              <View key={location.id} style={styles.chip}>
                <Text style={styles.chipLabel}>{location.name}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Stacked doctor cards for clinic setup review (replaces a single comma-joined line). */
export function PracticeDoctorReviewSection({
  doctors,
  locations = [],
}: PracticeDoctorListProps) {
  const locationsById = new Map(locations.map((location) => [location.id, location.name]));

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    section: {
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: typography.subtitle.color,
    },
    list: {
      gap: spacing.sm,
    },
    empty: typography.subtitle,
  }));

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Doctors</Text>
      {doctors.length === 0 ? (
        <Text style={styles.empty}>—</Text>
      ) : (
        <View style={styles.list}>
          {doctors.map((doctor) => {
            const doctorLocations = (doctor.location_ids ?? [])
              .map((id) => {
                const name = locationsById.get(id);
                return name ? { id, name } : null;
              })
              .filter((item): item is PracticeDoctorLocationLookup => item != null);
            return (
              <PracticeDoctorReviewCard
                key={doctor.id}
                doctor={doctor}
                locations={doctorLocations}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

export function PracticeDoctorFieldValue({
  doctors,
  locations = [],
}: PracticeDoctorListProps) {
  if (doctors.length === 0) {
    return <FieldValue value={null} />;
  }

  return <PracticeDoctorList doctors={doctors} locations={locations} />;
}
