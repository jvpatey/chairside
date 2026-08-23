import 'react-native';

declare module 'react-native' {
  interface ViewStyle {
    display?: 'none' | 'flex' | 'contents' | 'grid' | (string & {});
    gridTemplateColumns?: string;
    justifySelf?: string;
    cursor?: CursorValue | 'grab' | 'grabbing' | 'default' | (string & {});
    boxShadow?: string;
    backdropFilter?: string;
    WebkitBackdropFilter?: string;
    minHeight?: DimensionValue | '100dvh';
    width?: DimensionValue | '100vw';
  }

  interface TextStyle {
    userSelect?: 'all' | 'text' | 'none' | 'auto' | 'contain' | (string & {});
    outlineStyle?: 'solid' | 'dotted' | 'dashed' | 'none';
  }

  interface ScrollViewProps {
    onMouseDown?: (event: NativeSyntheticEvent<{ clientX?: number }>) => void;
  }

  interface ScrollView {
    measureInWindow: (
      callback: (x: number, y: number, width: number, height: number) => void,
    ) => void;
  }

  interface ImageProps {
    draggable?: boolean;
    pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  }
}

declare module 'react-native/Libraries/Components/TextInput/TextInput' {
  interface TextInputProps {
    autoComplete?: string;
  }
}
