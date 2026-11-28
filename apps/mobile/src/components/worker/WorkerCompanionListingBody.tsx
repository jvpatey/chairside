import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import { ApplicationClinicMapsLink } from '@/components/worker/ApplicationClinicMapsLink';
import {
  hasSourcedContactChannels,
  SourcedListingContactActions,
  type SourcedListingContact,
} from '@/components/worker/SourcedListingContactActions';
import type { MapsDestination } from '@/lib/mapsDirections';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import {
  fontBold,
  fontSemibold,
  getSpotlightGradient,
  useTheme,
  useThemedStyles,
} from '@/theme';
import { getElevationStyle, radii } from '@/theme/tokens';

export type CompanionFact = { label: string; value: string };

type WorkerCompanionListingBodyProps = {
  /** Dominant line — fill-in date or role title. */
  title: string;
  /** Supporting line — role · hours, or employment type. */
  subtitle?: string | null;
  pay?: string | null;
  clinicName: string;
  place?: string | null;
  onClinicPress?: () => void;
  /** Extra fields only (software, schedule…). Location lives under clinic. */
  facts?: CompanionFact[];
  notes?: string | null;
  badge?: ReactNode;
  /** Sourced listings: quiet phone/email + copy under clinic. */
  contact?: SourcedListingContact | null;
  /** When mappable (coords), quiet directions link under place. */
  mapsDestination?: MapsDestination | null;
};

/** Single-document companion layout — hero for what/when/where, then contact + notes. */
export function WorkerCompanionListingBody({
  title,
  subtitle,
  pay,
  clinicName,
  place,
  onClinicPress,
  facts = [],
  notes,
  badge,
  contact,
  mapsDestination,
}: WorkerCompanionListingBodyProps) {
  const { colors, isDark } = useTheme();
  const heroWash = getSpotlightGradient(colors, isDark, 'primary');

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    root: {
      gap: spacing.lg,
      width: '100%' as const,
    },
    hero: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.lg,
      overflow: 'hidden' as const,
      backgroundColor: colors.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      ...getElevationStyle({ isDark, level: 'subtle' }),
    },
    heroWash: {
      ...StyleSheet.absoluteFillObject,
    },
    heroTop: {
      gap: spacing.xs,
    },
    badgeRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 30,
      lineHeight: 36,
      fontFamily: fontBold,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      color: colors.labelPrimary,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
    pay: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.primary,
      marginTop: 2,
    },
    clinicSection: {
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
      gap: spacing.sm,
    },
    clinicBlock: {
      gap: 2,
      ...webPointer(onClinicPress ? 'pointer' : 'default'),
    },
    clinicRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    clinicName: {
      flex: 1,
      minWidth: 0,
      fontSize: 17,
      lineHeight: 22,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    place: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    directions: {
      alignSelf: 'flex-start' as const,
    },
    contact: {
      gap: spacing.xs,
    },
    facts: {
      gap: spacing.sm,
    },
    factRow: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      gap: spacing.md,
    },
    factLabel: {
      width: 88,
      flexShrink: 0,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
    },
    factValue: {
      flex: 1,
      minWidth: 0,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    notes: {
      gap: spacing.sm,
    },
    notesLabel: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
    },
  }));

  // Drop Location facts — place already sits under the clinic name.
  const extraFacts = facts.filter((fact) => fact.label.toLowerCase() !== 'location');
  const showContact = Boolean(contact && hasSourcedContactChannels(contact));

  const clinicIdentity = (
    <View style={styles.clinicBlock}>
      <View style={styles.clinicRow}>
        <Text style={styles.clinicName} numberOfLines={2}>
          {clinicName}
        </Text>
        {onClinicPress ? (
          <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
        ) : null}
      </View>
      {place ? (
        <Text style={styles.place} numberOfLines={2}>
          {place}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <LinearGradient
          colors={[...heroWash]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroWash}
          pointerEvents="none"
        />
        <View style={styles.heroTop}>
          {badge ? <View style={styles.badgeRow}>{badge}</View> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {pay?.trim() ? <Text style={styles.pay}>{pay.trim()}</Text> : null}
        </View>

        <View style={styles.clinicSection}>
          {onClinicPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${clinicName}. View clinic profile`}
              onPress={onClinicPress}
              style={({ pressed, hovered }) => [
                webHover(hovered, pressed, webListRowHoverStyles(colors)),
                pressed && { opacity: 0.88 },
              ]}>
              {clinicIdentity}
            </Pressable>
          ) : (
            clinicIdentity
          )}

          {mapsDestination ? (
            <View style={styles.directions}>
              <ApplicationClinicMapsLink
                destination={mapsDestination}
                label="Get directions"
              />
            </View>
          ) : null}
        </View>
      </View>

      {showContact && contact ? (
        <View style={styles.contact}>
          <SourcedListingContactActions
            contact={contact}
            sections="rows"
            density="inline"
          />
        </View>
      ) : null}

      {extraFacts.length > 0 ? (
        <View style={styles.facts}>
          {extraFacts.map((fact) => (
            <View key={fact.label} style={styles.factRow}>
              <Text style={styles.factLabel}>{fact.label}</Text>
              <Text style={styles.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {notes?.trim() ? (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Notes</Text>
          <DetailProse text={notes.trim()} />
        </View>
      ) : null}
    </View>
  );
}
