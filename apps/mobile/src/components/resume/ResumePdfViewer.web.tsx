import { createElement } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type ResumePdfViewerProps = {
  uri: string;
  style?: StyleProp<ViewStyle>;
  onLoadComplete: () => void;
  onError: (message: string) => void;
};

export function ResumePdfViewer({ uri, style, onLoadComplete, onError }: ResumePdfViewerProps) {
  const flatStyle = StyleSheet.flatten([styles.viewer, style]);

  return createElement('iframe', {
    src: uri,
    title: 'Resume preview',
    style: {
      border: 'none',
      width: '100%',
      height: '100%',
      ...(flatStyle as object),
    },
    onLoad: () => onLoadComplete(),
    onError: () => onError('Could not display this resume.'),
  });
}

const styles = StyleSheet.create({
  viewer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
