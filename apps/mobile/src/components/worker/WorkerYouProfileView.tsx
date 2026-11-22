import {
  getAuthErrorMessage,
  getWorkerRoleTypes,
  isWorkerProfileComplete,
  joinDisplayName,
  resolveAuthNameParts,
  updateAuthEmail,
  updateProfileName,
  type WorkerProfile,
} from '@chairside/api';
import { normalizePhoneForStorage, ROLE_TYPE_OPTIONS, type RoleType } from '@chairside/config';
import type { User } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { AccountChangePasswordSection } from '@/components/account/AccountChangePasswordSection';
import { AccountDeleteAccountCard } from '@/components/account/AccountDeleteAccountCard';
import { AccountLegalLinks } from '@/components/account/AccountLegalLinks';
import { AccountSignOutCard } from '@/components/account/AccountSignOutCard';
import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  ProfileDetailStack,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormSuccessBanner } from '@/components/ui/FormSuccessBanner';
import { ProfilePhotoUpload } from '@/components/worker/ProfilePhotoUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { userHasEmailPasswordLogin } from '@/lib/authProviders';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { WORKER_AUTH_LEGAL_PATHS } from '@/lib/routing';
import {
  getWorkerProfileFormMissing,
  getWorkerProfileIncompleteBanner,
} from '@/lib/workerProfileFormMissing';
import { colorWithAlpha, useThemedStyles } from '@/theme';

const PROVINCE_OPTIONS = [
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
] as const;

type ProvinceCode = (typeof PROVINCE_OPTIONS)[number]['value'];

type WorkerYouProfileViewProps = {
  user: User;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  workerProfile: WorkerProfile | null;
  onProfileRefresh: () => Promise<unknown>;
  isSigningOut: boolean;
  onSignOut: () => void;
  isDeleting: boolean;
  onDeleteAccount: () => void;
  deleteDescription: string;
};

/** Editable profile essentials + account controls on one page. */
export function WorkerYouProfileView({
  user,
  displayName,
  firstName,
  lastName,
  workerProfile,
  onProfileRefresh,
  isSigningOut,
  onSignOut,
  isDeleting,
  onDeleteAccount,
  deleteDescription,
}: WorkerYouProfileViewProps) {
  const { refreshProfile } = useAuth();
  const { refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { isWide } = useResponsiveLayout();
  const busy = isSigningOut || isDeleting;
  const showPassword = userHasEmailPasswordLogin(user);

  const seededName = useMemo(
    () =>
      resolveAuthNameParts({
        firstName,
        lastName,
        displayName,
        userMetadata: user.user_metadata as Record<string, unknown> | undefined,
      }),
    [displayName, firstName, lastName, user.user_metadata],
  );

  const [formFirstName, setFormFirstName] = useState(seededName.firstName);
  const [formLastName, setFormLastName] = useState(seededName.lastName);
  const [email, setEmail] = useState(user.email?.trim() ?? '');
  const [phone, setPhone] = useState(
    workerProfile?.phone ? formatPhoneNumber(workerProfile.phone) : '',
  );
  const [roleTypes, setRoleTypes] = useState<RoleType[]>(() => getWorkerRoleTypes(workerProfile));
  const [city, setCity] = useState(workerProfile?.city?.trim() ?? '');
  const [province, setProvince] = useState<ProvinceCode>(
    (workerProfile?.province as ProvinceCode | undefined) ?? 'NS',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const profileComplete = isWorkerProfileComplete(workerProfile);

  useEffect(() => {
    setFormFirstName(seededName.firstName);
    setFormLastName(seededName.lastName);
  }, [seededName.firstName, seededName.lastName]);

  useEffect(() => {
    setEmail(user.email?.trim() ?? '');
  }, [user.email]);

  useEffect(() => {
    if (!workerProfile) return;
    setRoleTypes(getWorkerRoleTypes(workerProfile));
    setPhone(workerProfile.phone ? formatPhoneNumber(workerProfile.phone) : '');
    setCity(workerProfile.city?.trim() ?? '');
    if (workerProfile.province) {
      setProvince(workerProfile.province as ProvinceCode);
    }
  }, [workerProfile]);

  const missing = useMemo(
    () =>
      getWorkerProfileFormMissing({
        firstName: formFirstName,
        lastName: formLastName,
        phone,
        roleTypes,
        city,
        province,
      }),
    [city, formFirstName, formLastName, phone, province, roleTypes],
  );
  const incompleteBanner = getWorkerProfileIncompleteBanner(missing);

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    root: {
      gap: spacing.xl,
      width: '100%' as const,
    },
    hint: profileSettingsHintStyle({ typography, colors }),
    hintNeeded: {
      ...profileSettingsHintStyle({ typography, colors }),
      color: colors.primary,
      fontWeight: '600' as const,
    },
    nameRow: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.md,
    },
    nameField: isWide ? { flex: 1, minWidth: 0 } : {},
    incompleteBanner: {
      backgroundColor: `${colors.primary}14`,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 4,
    },
    incompleteTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    incompleteBody: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    neededWrap: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.45 : 0.35),
      backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.1 : 0.06),
      padding: spacing.sm,
      gap: spacing.sm,
    },
    quiet: {
      gap: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    sectionLabel: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
      marginBottom: spacing.sm,
    },
    quietHint: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  const normalizedPhone = normalizePhoneForStorage(phone);
  const canSave =
    Boolean(formFirstName.trim()) &&
    Boolean(formLastName.trim()) &&
    roleTypes.length > 0 &&
    Boolean(normalizedPhone) &&
    Boolean(city.trim()) &&
    Boolean(province);

  const handleSave = async () => {
    if (!canSave) {
      setFormError(
        missing.phone
          ? 'Add a mobile number — fill-ins are alerted by SMS.'
          : 'Add your name, role, phone, and city to save.',
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await updateProfileName(user.id, {
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
      });

      const nextEmail = email.trim();
      const currentEmail = user.email?.trim() ?? '';
      let emailNote: string | null = null;
      if (nextEmail && nextEmail.toLowerCase() !== currentEmail.toLowerCase()) {
        await updateAuthEmail(nextEmail);
        emailNote =
          'Check your inbox to confirm the new email if Supabase asks you to verify it.';
      }

      await save({
        role_types: roleTypes,
        phone: normalizedPhone,
        city: city.trim(),
        province,
      });

      await refreshProfile(user.id);
      await refreshWorkerProfile();
      await onProfileRefresh();

      setFormSuccess(
        emailNote
          ? `Profile saved. ${emailNote}`
          : 'Profile saved. Text alerts are on for nearby fill-ins.',
      );
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Profile saved',
          emailNote ?? 'Text alerts are on for nearby fill-ins.',
        );
      }
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not save', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      {incompleteBanner ? (
        <View style={styles.incompleteBanner}>
          <Text style={styles.incompleteTitle}>{incompleteBanner.title}</Text>
          <Text style={styles.incompleteBody}>{incompleteBanner.body}</Text>
        </View>
      ) : null}

      <FormErrorBanner message={formError} />
      <FormSuccessBanner message={formSuccess} />

      <ProfileDetailStack>
        <SectionPanel icon="camera-outline" iconAccent="primary" title="Profile photo">
          <Text style={styles.hint}>Optional — shown when you apply to clinics.</Text>
          <ProfilePhotoUpload
            embedded
            displayName={joinDisplayName(formFirstName, formLastName)}
            onUpdated={() => void refreshWorkerProfile()}
          />
        </SectionPanel>

        <SectionPanel icon="person-outline" iconAccent="secondary" title="Your name">
          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <AuthField
                label="First name"
                placeholder="First name"
                value={formFirstName}
                onChangeText={setFormFirstName}
                autoCapitalize="words"
                autoComplete="given-name"
                required
                invalid={missing.firstName}
              />
            </View>
            <View style={styles.nameField}>
              <AuthField
                label="Last name"
                placeholder="Last name"
                value={formLastName}
                onChangeText={setFormLastName}
                autoCapitalize="words"
                autoComplete="family-name"
                required
                invalid={missing.lastName}
              />
            </View>
          </View>
        </SectionPanel>

        <SectionPanel icon="mail-outline" iconAccent="primary" title="Email">
          <Text style={styles.hint}>
            Optional — useful for account recovery. Fill-in alerts still go by text.
          </Text>
          <AuthField
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
        </SectionPanel>

        <SectionPanel icon="call-outline" iconAccent="secondary" title="Mobile phone">
          <View style={missing.phone ? styles.neededWrap : undefined}>
            <Text style={missing.phone ? styles.hintNeeded : styles.hint}>
              {missing.phone
                ? 'Fill-in openings are sent by text — add a mobile number so you don’t miss them.'
                : 'Used for fill-in text alerts. Texts turn on by default when you save a number.'}
            </Text>
            <AuthField
              label="Mobile phone"
              placeholder={PHONE_NUMBER_PLACEHOLDER}
              value={phone}
              onChangeText={(text) => setPhone(formatPhoneNumber(text))}
              keyboardType="phone-pad"
              required
              invalid={missing.phone}
              validated={Boolean(normalizedPhone)}
              accent="secondary"
            />
          </View>
        </SectionPanel>

        <SectionPanel icon="ribbon-outline" iconAccent="primary" title="Roles">
          <View style={missing.roles ? styles.neededWrap : undefined}>
            <Text style={missing.roles ? styles.hintNeeded : styles.hint}>
              Helps show the right jobs and fill-ins nearby.
            </Text>
            <ChipSelector
              options={[...ROLE_TYPE_OPTIONS]}
              selected={roleTypes}
              multiple
              onChange={(value) => setRoleTypes(value as RoleType[])}
            />
          </View>
        </SectionPanel>

        <SectionPanel icon="location-outline" iconAccent="secondary" title="Where you work">
          <View style={missing.city || missing.province ? styles.neededWrap : undefined}>
            <Text style={missing.city || missing.province ? styles.hintNeeded : styles.hint}>
              City and province help show openings near you.
            </Text>
            <AuthField
              label="City"
              placeholder="City"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
              required
              invalid={missing.city}
              accent="secondary"
            />
            <ChipSelector
              options={[...PROVINCE_OPTIONS]}
              selected={province}
              multiple={false}
              onChange={(value) => setProvince(value as ProvinceCode)}
              accent="secondary"
            />
          </View>
        </SectionPanel>
      </ProfileDetailStack>

      <OnboardingButton
        label={isSubmitting ? 'Saving…' : profileComplete ? 'Save changes' : 'Save profile'}
        disabled={isSubmitting || busy}
        onPress={() => void handleSave()}
      />

      {showPassword ? (
        <View style={styles.quiet}>
          <Text style={styles.sectionLabel}>Password</Text>
          <AccountChangePasswordSection user={user} showSectionLabel={false} />
        </View>
      ) : null}

      <View style={styles.quiet}>
        <Text style={styles.sectionLabel}>Legal & support</Text>
        <AccountLegalLinks legalPaths={WORKER_AUTH_LEGAL_PATHS} />
      </View>

      <View style={styles.quiet}>
        <Text style={styles.quietHint}>Sign out on this device anytime.</Text>
        <AccountSignOutCard
          isSigningOut={isSigningOut}
          disabled={busy || isSubmitting}
          onSignOut={onSignOut}
        />
        <AccountDeleteAccountCard
          isDeleting={isDeleting}
          disabled={busy || isSubmitting}
          description={deleteDescription}
          onDeleteAccount={onDeleteAccount}
        />
      </View>
    </View>
  );
}
