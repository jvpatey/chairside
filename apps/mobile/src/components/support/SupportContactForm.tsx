import {
  SUPPORT_CONTACT_SUBJECTS,
  submitSupportContact,
  type SupportContactSubject,
} from '@chairside/api';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useAuth } from '@/contexts/AuthContext';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const SUCCESS_MESSAGE = 'Message sent! We typically respond within one to two business days.';

export function SupportContactForm() {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<SupportContactSubject | ''>('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.display_name?.trim() && !name) {
      setName(profile.display_name.trim());
    }
    if (user?.email?.trim() && !email) {
      setEmail(user.email.trim());
    }
  }, [email, name, profile?.display_name, user?.email]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.md,
    },
    subjectLabel: {
      ...typography.subtitle,
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
      marginBottom: spacing.xs,
    },
    subjectList: {
      gap: spacing.xs,
    },
    subjectOption: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...webPointer(),
    },
    subjectOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    subjectOptionHovered: webListRowHoverStyles(colors),
    subjectOptionPressed: {
      opacity: 0.88,
    },
    subjectOptionText: {
      ...typography.body,
      fontSize: 15,
      color: colors.labelPrimary,
    },
    subjectOptionTextSelected: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    honeypot: Platform.OS === 'web'
      ? ({
          position: 'absolute',
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0,
        } as const)
      : { display: 'none' as const },
    bannerSuccess: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.success,
      backgroundColor: `${colors.success}14`,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    bannerError: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.destructive,
      backgroundColor: `${colors.destructive}14`,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    hint: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  const handleSubmit = async () => {
    if (status === 'loading') return;

    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      setStatus('error');
      setErrorMessage('All fields are required.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      await submitSupportContact({
        name: name.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
        website: website.trim() || undefined,
      });
      setStatus('success');
      setMessage('');
      setSubject('');
      setWebsite('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not send message. Please try again.',
      );
    }
  };

  return (
    <View style={styles.wrap}>
      {status === 'success' ? (
        <Text style={styles.bannerSuccess} accessibilityRole="alert">
          {SUCCESS_MESSAGE}
        </Text>
      ) : null}

      {status === 'error' && errorMessage ? (
        <Text style={styles.bannerError} accessibilityRole="alert">
          {errorMessage}
        </Text>
      ) : null}

      {Platform.OS === 'web' ? (
        <View style={styles.honeypot} aria-hidden>
          <AuthField
            label="Website"
            placeholder="Leave blank"
            value={website}
            onChangeText={setWebsite}
            autoComplete="off"
          />
        </View>
      ) : null}

      <AuthField
        label="Name"
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="name"
        editable={status !== 'loading'}
      />

      <AuthField
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        editable={status !== 'loading'}
      />

      <View>
        <Text style={styles.subjectLabel}>Subject</Text>
        <View style={styles.subjectList}>
          {SUPPORT_CONTACT_SUBJECTS.map((option) => {
            const selected = subject === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                disabled={status === 'loading'}
                onPress={() => setSubject(option)}
                style={({ pressed, hovered }) => [
                  styles.subjectOption,
                  selected && styles.subjectOptionSelected,
                  webHover(hovered, pressed, styles.subjectOptionHovered),
                  pressed && styles.subjectOptionPressed,
                ]}>
                <Text
                  style={[
                    styles.subjectOptionText,
                    selected && styles.subjectOptionTextSelected,
                  ]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <AuthField
        label="Message"
        placeholder="Describe your issue or question…"
        value={message}
        onChangeText={setMessage}
        multiline
        autoCapitalize="sentences"
        editable={status !== 'loading'}
      />

      <OnboardingButton
        label={status === 'loading' ? 'Sending…' : 'Send message'}
        onPress={() => void handleSubmit()}
        disabled={status === 'loading'}
      />

      <Text style={styles.hint}>
        Include steps to reproduce for bugs, and your device model if reporting an app issue.
      </Text>
    </View>
  );
}
