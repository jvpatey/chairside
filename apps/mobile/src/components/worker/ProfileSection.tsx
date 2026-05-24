import { Text, View, type ViewProps } from 'react-native';

import { useThemedStyles } from '@/theme';

type ProfileSectionProps = ViewProps & {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function ProfileSection({ title, subtitle, children, style, ...rest }: ProfileSectionProps) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    wrap: { gap: spacing.sm },
    title: { ...typography.body, fontWeight: '700', fontSize: 17 },
    subtitle: { ...typography.subtitle, fontSize: 14, lineHeight: 20 },
  }));

  return (
    <View style={[styles.wrap, style]} {...rest}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}
