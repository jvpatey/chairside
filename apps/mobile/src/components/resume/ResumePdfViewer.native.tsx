import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

type PdfProps = {
  source: { uri: string; cache?: boolean };
  style?: StyleProp<ViewStyle>;
  trustAllCerts?: boolean;
  onLoadComplete?: () => void;
  onError?: (error: unknown) => void;
};

type ResumePdfViewerProps = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  onLoadComplete: () => void;
  onError: (message: string) => void;
};

export function ResumePdfViewer({ uri, style, onLoadComplete, onError }: ResumePdfViewerProps) {
  const { colors } = useTheme();
  const [PdfComponent, setPdfComponent] = useState<ComponentType<PdfProps> | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import('react-native-pdf')
      .then((module) => {
        if (!cancelled) {
          setPdfComponent(() => module.default);
        }
      })
      .catch(() => {
        if (!cancelled) {
          onError('Could not load the PDF viewer.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onError]);

  if (!PdfComponent) {
    return (
      <View style={[styles.loading, style]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <PdfComponent
      source={{ uri, cache: false }}
      style={style}
      trustAllCerts={Platform.OS === 'ios'}
      onLoadComplete={onLoadComplete}
      onError={(pdfError) => {
        const message =
          pdfError instanceof Error ? pdfError.message : 'Could not display this resume.';
        onError(message);
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
