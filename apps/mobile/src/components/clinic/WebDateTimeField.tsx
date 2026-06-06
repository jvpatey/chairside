import { View, type ViewStyle } from 'react-native';

type WebDateFieldProps = {
  label?: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  style?: ViewStyle;
};

type WebTimeFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  style?: ViewStyle;
};

/** Native stub — web implementation lives in WebDateTimeField.web.tsx */
export function WebDateField(_props: WebDateFieldProps) {
  return <View />;
}

export function WebTimeField(_props: WebTimeFieldProps) {
  return <View />;
}
