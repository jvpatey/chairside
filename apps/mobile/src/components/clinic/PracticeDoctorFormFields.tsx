import { PRACTICE_DOCTOR_BIO_MAX_LENGTH, PRACTICE_DOCTOR_ROLE_OPTIONS } from '@chairside/config';
import { Pressable, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { PracticeDoctorAvatar } from '@/components/clinic/PracticeDoctorAvatar';
import { AuthField } from '@/components/onboarding/AuthField';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import {
  webHover,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

export type PracticeDoctorLocationOption = {
  value: string;
  label: string;
};

type PracticeDoctorFormFieldsProps = {
  name: string;
  title: string;
  bio: string;
  photoUri?: string | null;
  isPhotoLoading?: boolean;
  locationOptions?: PracticeDoctorLocationOption[];
  selectedLocationIds?: string[];
  onLocationIdsChange?: (locationIds: string[]) => void;
  onPickPhoto: () => void;
  onNameChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onBioChange: (value: string) => void;
};

export function PracticeDoctorFormFields({
  name,
  title,
  bio,
  photoUri,
  isPhotoLoading = false,
  locationOptions = [],
  selectedLocationIds = [],
  onLocationIdsChange,
  onPickPhoto,
  onNameChange,
  onTitleChange,
  onBioChange,
}: PracticeDoctorFormFieldsProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ spacing, typography }) => ({
    wrap: {
      gap: spacing.sm,
    },
    photoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    photoLink: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
    },
    roleSection: {
      gap: spacing.sm,
    },
    bioHint: {
      ...typography.subtitle,
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'right',
    },
  }));

  return (
    <View style={styles.wrap}>
      <FormSectionHeader icon="camera-outline" label="Doctor photo" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change doctor photo"
        onPress={onPickPhoto}
        style={({ pressed, hovered }) => [
          styles.photoRow,
          webPointer(),
          webHover(hovered, pressed, webTextLinkHoverStyles(colors)),
          pressed && { opacity: 0.88 },
        ]}>
        <PracticeDoctorAvatar
          name={name || 'Doctor'}
          photoUri={photoUri}
          isLoading={isPhotoLoading}
        />
        <Text style={[styles.photoLink, { color: colors.primary }]}>
          {photoUri ? 'Change photo' : 'Add photo'}
        </Text>
      </Pressable>

      <AuthField
        label="Doctor name"
        placeholder="e.g. Dr. Jane Smith"
        value={name}
        onChangeText={onNameChange}
        autoCapitalize="words"
        icon="person-outline"
      />

      <View style={styles.roleSection}>
        <AuthField
          label="Role or specialty"
          placeholder="e.g. Owner Dentist"
          value={title}
          onChangeText={onTitleChange}
          autoCapitalize="words"
          icon="ribbon-outline"
        />
        <FormSectionHeader icon="medkit-outline" label="Quick role" />
        <ChipSelector
          options={PRACTICE_DOCTOR_ROLE_OPTIONS.map((role) => ({
            value: role,
            label: role,
          }))}
          selected={title || null}
          onChange={(next) => onTitleChange(String(next))}
        />
      </View>

      {locationOptions.length > 0 && onLocationIdsChange ? (
        <View style={styles.roleSection}>
          <FormSectionHeader icon="location-outline" label="Works at" />
          <ChipSelector
            options={locationOptions}
            selected={selectedLocationIds}
            multiple
            horizontal={false}
            onChange={(value) => onLocationIdsChange(value as string[])}
          />
        </View>
      ) : null}

      <AuthField
        label="Bio"
        placeholder="A short note about this doctor’s background or focus"
        value={bio}
        onChangeText={(text) => onBioChange(text.slice(0, PRACTICE_DOCTOR_BIO_MAX_LENGTH))}
        autoCapitalize="sentences"
        multiline
        icon="document-text-outline"
      />
      <Text style={styles.bioHint}>
        {bio.length}/{PRACTICE_DOCTOR_BIO_MAX_LENGTH}
      </Text>
    </View>
  );
}
