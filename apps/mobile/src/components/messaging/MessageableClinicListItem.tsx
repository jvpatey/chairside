import type { MessageableClinic } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { formatMessageableClinicMeta } from '@/lib/conversationDisplay';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type MessageableClinicListItemProps = {
  clinic: MessageableClinic;
  onPress: () => void;
  onViewProfile?: () => void;
  compact?: boolean;
  variant?: 'inbox' | 'directory';
};

export function MessageableClinicListItem({
  clinic,
  onPress,
  onViewProfile,
  compact = false,
  variant = 'inbox',
}: MessageableClinicListItemProps) {
  const { colors } = useTheme();
  const logoUri = useClinicLogoUri(clinic.logo_storage_path);
  const meta = formatMessageableClinicMeta(clinic);
  const hasExistingConversation = Boolean(clinic.existing_conversation_id);
  const descriptionPreview = clinic.description?.trim() || null;
  const messageLabel = hasExistingConversation ? 'Continue conversation' : 'Message clinic';
  const isDirectory = variant === 'directory';

  const avatarSize = isDirectory ? 48 : compact ? 36 : 40;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: compact ? spacing.sm + 2 : spacing.md,
      paddingHorizontal: compact ? spacing.sm : spacing.md,
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: { opacity: 0.92 },
    mainPressable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 0,
    },
    directoryCard: {
      gap: spacing.md,
    },
    directoryHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      minWidth: 0,
    },
    directoryHeaderChevron: {
      flexShrink: 0,
      paddingTop: 4,
    },
    directoryIdentity: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    textWrap: { flex: 1, gap: 2, minWidth: 0 },
    name: {
      ...typography.body,
      fontSize: isDirectory ? 18 : 17,
      lineHeight: isDirectory ? 23 : 22,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    description: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    status: {
      fontSize: 13,
      lineHeight: 18,
      color: hasExistingConversation ? colors.primary : colors.labelTertiary,
      fontWeight: hasExistingConversation ? '600' : '400',
    },
    directoryActions: {
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
  }));

  if (isDirectory) {
    return (
      <SurfaceCard padding="md">
        <View style={styles.directoryCard}>
          {onViewProfile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${clinic.clinic_name} profile`}
              accessibilityHint="Opens the clinic profile"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onViewProfile();
              }}
              style={({ pressed, hovered }) => [
                styles.directoryHeader,
                webPointer(),
                webHover(hovered, pressed, styles.rowHovered),
                pressed && styles.rowPressed,
              ]}>
              <ClinicLogoAvatar
                clinicName={clinic.clinic_name}
                logoUri={logoUri}
                size={avatarSize}
              />
              <View style={styles.directoryIdentity}>
                <Text style={styles.name} numberOfLines={2}>
                  {clinic.clinic_name}
                </Text>
                <Text style={styles.meta} numberOfLines={2}>
                  {meta}
                </Text>
                {descriptionPreview ? (
                  <Text style={styles.description} numberOfLines={3}>
                    {descriptionPreview}
                  </Text>
                ) : null}
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.labelTertiary}
                style={styles.directoryHeaderChevron}
              />
            </Pressable>
          ) : (
            <View style={styles.directoryHeader}>
              <ClinicLogoAvatar
                clinicName={clinic.clinic_name}
                logoUri={logoUri}
                size={avatarSize}
              />
              <View style={styles.directoryIdentity}>
                <Text style={styles.name} numberOfLines={2}>
                  {clinic.clinic_name}
                </Text>
                <Text style={styles.meta} numberOfLines={2}>
                  {meta}
                </Text>
                {descriptionPreview ? (
                  <Text style={styles.description} numberOfLines={3}>
                    {descriptionPreview}
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          <View style={styles.directoryActions}>
            <OnboardingButton label={messageLabel} onPress={onPress} />
          </View>
        </View>
      </SurfaceCard>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${clinic.clinic_name}. ${meta}. ${messageLabel}`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed, hovered }) => [
        styles.row,
        webPointer(),
        webHover(hovered, pressed, styles.rowHovered),
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.mainPressable}>
        <ClinicLogoAvatar clinicName={clinic.clinic_name} logoUri={logoUri} size={avatarSize} />
        <View style={styles.textWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {clinic.clinic_name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
          <Text style={styles.status} numberOfLines={1}>
            {messageLabel}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
    </Pressable>
  );
}
