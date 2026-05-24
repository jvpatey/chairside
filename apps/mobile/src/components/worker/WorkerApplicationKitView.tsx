import type { WorkerProfile } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ApplicationKitPreview } from '@/components/worker/ApplicationKitPreview';
import { ResumeUpload } from '@/components/worker/ResumeUpload';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerApplicationKitViewProps = {
  profile: WorkerProfile | null;
  displayPreview?: boolean;
};

export function WorkerApplicationKitView({
  profile,
  displayPreview = true,
}: WorkerApplicationKitViewProps) {
  const { colors } = useTheme();
  const [previewOpen, setPreviewOpen] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: { gap: spacing.md },
    previewToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
    },
    previewToggleText: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
  }));

  return (
    <View style={styles.wrap}>
      <ResumeUpload />

      {displayPreview ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: previewOpen }}
            style={styles.previewToggle}
            onPress={() => setPreviewOpen((open) => !open)}>
            <Text style={styles.previewToggleText}>Preview what clinics see</Text>
            <Ionicons
              name={previewOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.labelSecondary}
            />
          </Pressable>
          {previewOpen ? <ApplicationKitPreview profile={profile} /> : null}
        </>
      ) : null}
    </View>
  );
}
