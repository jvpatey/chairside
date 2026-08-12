import { EmptyState } from '@/components/ui/EmptyState';
import { useTabAtmosphere } from '@/contexts/TabAtmosphereContext';
import { Platform, View } from 'react-native';
import { useTheme, useThemedStyles } from '@/theme';

type MessageThreadPlaceholderProps = {
  role: 'worker' | 'clinic';
  /** True when inbox has rows but none is selected (filtered empty, etc.). */
  filteredEmpty?: boolean;
  /** Split-view detail pane on web — lets tab atmosphere show through. */
  embedded?: boolean;
};

export function MessageThreadPlaceholder({
  role,
  filteredEmpty = false,
  embedded = false,
}: MessageThreadPlaceholderProps) {
  const { colors } = useTheme();
  const tabAtmosphere = useTabAtmosphere();
  const showTabAtmosphere = tabAtmosphere !== 'none';
  const transparentShell = showTabAtmosphere || (embedded && Platform.OS === 'web');

  const styles = useThemedStyles(({ colors }) => ({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: transparentShell ? 'transparent' : colors.background,
    },
  }));

  const copy =
    role === 'worker'
      ? {
          title: filteredEmpty ? 'No matching conversations' : 'No messages yet',
          body: filteredEmpty
            ? 'Try a different filter to see more conversations.'
            : 'When you message a clinic or apply for a role, your conversations will appear here.',
        }
      : {
          title: filteredEmpty ? 'No matching conversations' : 'No messages yet',
          body: filteredEmpty
            ? 'Try a different filter to see more conversations.'
            : 'When applicants reach out, you start an open inquiry, or you message them, conversations will appear here.',
        };

  return (
    <View style={styles.container}>
      <EmptyState embedded icon="chatbubbles-outline" title={copy.title} message={copy.body} />
    </View>
  );
}
