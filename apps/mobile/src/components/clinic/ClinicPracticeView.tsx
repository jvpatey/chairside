import type { ClinicProfile } from '@chairside/api';
import { SPECIALTY_OPTIONS, getProvinceLabel, getTeamSizeRangeLabel } from '@chairside/config';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { PracticeDoctorFieldValue } from '@/components/clinic/PracticeDoctorList';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  ProfileSummaryBanner,
  ProfileTagRow,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { getHeroBandGradient, useTheme, useThemedStyles } from '@/theme';

type ClinicPracticeViewProps = {
  profile: ClinicProfile | null;
};

function PracticeHeroCard({
  clinicName,
  specialtyLabel,
  locationLabel,
}: {
  clinicName: string;
  specialtyLabel: string | null;
  locationLabel: string | null;
}) {
  const { colors, isDark } = useTheme();
  const heroGradient = getHeroBandGradient(colors, isDark, 'primary');

  const styles = useThemedStyles(({ colors, spacing, typography, radii, elevation, isDark }) => ({
    card: {
      borderRadius: radii.hero,
      overflow: 'hidden',
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.separator,
      position: 'relative',
      ...elevation('subtle'),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    title: {
      ...typography.title,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.labelPrimary,
    },
    meta: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      color: colors.labelSecondary,
    },
    empty: {
      ...typography.body,
      fontSize: 17,
      lineHeight: 24,
      textAlign: 'center',
      color: colors.labelSecondary,
      fontStyle: 'italic',
    },
    hint: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.labelSecondary,
      marginTop: spacing.xs,
    },
  }));

  const metaLine = [specialtyLabel, locationLabel].filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={heroGradient}
        locations={[0, 0.35, 0.65, 0.85, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Your practice</Text>
        <Text style={styles.title}>{clinicName}</Text>
        {metaLine ? (
          <Text style={styles.meta}>{metaLine}</Text>
        ) : (
          <Text style={styles.empty}>Add your specialty and location so candidates know where you are.</Text>
        )}
        <Text style={styles.hint}>
          The basics candidates see when browsing your roles, fill-ins, and clinic profile.
        </Text>
      </View>
    </View>
  );
}

export function ClinicPracticeView({ profile }: ClinicPracticeViewProps) {
  const { locations } = useClinicProfile();
  const doctorLocations = locations
    .filter((location) => location.is_active)
    .map((location) => ({ id: location.id, name: location.name }));
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
    intro: profileSettingsHintStyle({ typography, colors }),
    doctorsBlock: { gap: spacing.sm },
  }));

  if (!profile) {
    return (
      <ProfileEmptyState
        icon="business-outline"
        title="Add practice details"
        description="Add your practice details, location, and contact info to start posting."
      />
    );
  }

  const clinicName = profile.clinic_name?.trim() || 'Your practice';
  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === profile.specialty)?.label ?? null;
  const locationLabel = [profile.city, profile.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');
  const teamSizeLabel = getTeamSizeRangeLabel(profile.team_size_range ?? null);
  const softwareUsed = profile.software_used ?? [];
  const practiceDoctors = profile.practice_doctors ?? [];
  const address = [
    profile.address_line1,
    profile.address_line2,
    profile.city,
    getProvinceLabel(profile.province),
    profile.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <ProfileDetailStack>
      <ProfileSummaryBanner icon="information-circle-outline" title="What candidates see">
        <Text style={styles.intro}>
          Candidates use your contact details, location, and practice setup to decide whether a
          role or fill-in is a good fit before they apply or accept an interview.
        </Text>
      </ProfileSummaryBanner>

      <PracticeHeroCard
        clinicName={clinicName}
        specialtyLabel={specialtyLabel}
        locationLabel={locationLabel || null}
      />

      <SectionPanel stepNumber={1} stepAccent="primary" title="Contact">
        <Text style={styles.hint}>
          Who candidates can reach and how your team prefers to be contacted.
        </Text>
        <FieldBlock label="Contact name">
          <FieldValue value={profile.contact_name} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Phone">
          <FieldValue value={profile.phone} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel stepNumber={2} stepAccent="secondary" title="Location">
        <Text style={styles.hint}>
          Where your practice is based — shown on roles, fill-ins, and your public clinic profile.
        </Text>
        <FieldBlock label="City & province">
          <FieldValue value={locationLabel || null} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Full address">
          <FieldValue value={address || null} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel stepNumber={3} stepAccent="primary" title="Practice setup">
        <Text style={styles.hint}>
          Your clinical environment, team size, and doctors help candidates understand day-to-day
          work at your practice.
        </Text>
        <FieldBlock label="Specialty">
          <FieldValue value={specialtyLabel} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Software">
          <ProfileTagRow
            tags={softwareUsed}
            emptyText="Add the software systems your team uses."
          />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Operatories">
          <FieldValue value={profile.operatories_count?.toString() ?? null} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Team size">
          <FieldValue value={teamSizeLabel} />
        </FieldBlock>
        {practiceDoctors.length > 0 ? (
          <>
            <FieldDivider />
            <FieldBlock label="Doctors">
              <View style={styles.doctorsBlock}>
                <PracticeDoctorFieldValue
                  doctors={practiceDoctors}
                  locations={doctorLocations}
                />
              </View>
            </FieldBlock>
          </>
        ) : null}
      </SectionPanel>
    </ProfileDetailStack>
  );
}
