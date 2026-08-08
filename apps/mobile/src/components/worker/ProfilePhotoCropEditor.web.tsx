import { View } from 'react-native';

import { ProfilePhotoCropEditorContent } from '@/components/worker/ProfilePhotoCropEditorContent';
import { WebDialogShell } from '@/components/ui/WebDialogShell.web';
import type { ProfilePhotoCropTransform } from '@/lib/profilePhotoCrop';

type ProfilePhotoCropEditorProps = {
  visible: boolean;
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  isSaving?: boolean;
  onCancel: () => void;
  onConfirm: (transform: ProfilePhotoCropTransform) => void;
};

export function ProfilePhotoCropEditor({
  visible,
  imageUri,
  imageWidth,
  imageHeight,
  isSaving = false,
  onCancel,
  onConfirm,
}: ProfilePhotoCropEditorProps) {
  return (
    <WebDialogShell
      visible={visible}
      onClose={() => {
        if (!isSaving) {
          onCancel();
        }
      }}
      maxWidth={420}
      backdropLabel="Cancel photo adjustment"
    >
      <View>
        <ProfilePhotoCropEditorContent
          imageUri={imageUri}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          isSaving={isSaving}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      </View>
    </WebDialogShell>
  );
}
