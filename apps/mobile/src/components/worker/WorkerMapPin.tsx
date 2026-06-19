import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type WorkerMapPinProps = {
  label: string;
  saved?: boolean;
};

export function WorkerMapPin({ label, saved = false }: WorkerMapPinProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    pin: {
      minWidth: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: saved ? colors.secondary : colors.primary,
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
    },
    label: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
  }));

  return (
    <View style={styles.pin}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

type WorkerMapWorkerPinProps = {
  size?: number;
};

export function WorkerMapWorkerPin({ size = 14 }: WorkerMapWorkerPinProps) {
  const styles = useThemedStyles(({ colors }) => ({
    dot: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surface,
    },
  }));

  return <View style={styles.dot} />;
}
