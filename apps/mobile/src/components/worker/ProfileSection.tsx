import { Text, View, type ViewProps } from 'react-native';

import { EditPillButton } from '@/components/ui/EditPillButton';
import { useThemedStyles } from '@/theme';

type ProfileSectionProps = ViewProps & {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
};

export function ProfileSection({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  children,
  style,
  ...rest
}: ProfileSectionProps) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    wrap: { gap: spacing.md },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerText: { flex: 1, gap: spacing.xs, minWidth: 0 },
    title: { ...typography.body, fontWeight: '700', fontSize: 17 },
    subtitle: { ...typography.subtitle, fontSize: 14, lineHeight: 20 },
    titleAction: {
      marginTop: 1,
    },
  }));

  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {actionLabel && onActionPress ? (
          <EditPillButton
            label={actionLabel}
            onPress={onActionPress}
            style={styles.titleAction}
          />
        ) : null}
      </View>
      {children}
    </View>
  );
}
