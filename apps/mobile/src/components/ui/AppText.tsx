import { Text, type TextProps, type TextStyle } from 'react-native';

import { fontBold, fontExtraBold, fontRegular, fontSemibold, useTheme } from '@/theme';

type AppTextVariant = 'title' | 'subtitle' | 'body' | 'label' | 'display';

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
};

function resolveFontFamily(weight: TextStyle['fontWeight'] | undefined, variant: AppTextVariant) {
  if (variant === 'display') return fontExtraBold;
  if (weight === '800' || weight === 800) return fontExtraBold;
  if (weight === '700' || weight === 'bold' || weight === 700) return fontBold;
  if (weight === '600' || weight === 'semibold' || weight === 600) return fontSemibold;
  return fontRegular;
}

/** Text with Plus Jakarta Sans applied by default. */
export function AppText({ style, variant = 'body', ...props }: AppTextProps) {
  const { typography } = useTheme();
  const flat = Array.isArray(style) ? Object.assign({}, ...style) : (style ?? {});
  const weight = flat.fontWeight as TextStyle['fontWeight'] | undefined;
  const variantStyle =
    variant === 'title'
      ? typography.title
      : variant === 'subtitle'
        ? typography.subtitle
        : variant === 'label'
          ? typography.label
          : variant === 'display'
            ? {
                fontSize: 32,
                lineHeight: 36,
                fontWeight: '800' as const,
                fontFamily: fontExtraBold,
                letterSpacing: -0.6,
              }
            : typography.body;

  return (
    <Text
      {...props}
      style={[
        variantStyle,
        { fontFamily: resolveFontFamily(weight, variant) },
        style,
      ]}
    />
  );
}
