import { AdaptiveWebSheet } from '@/components/ui/AdaptiveWebSheet.web';
import { CancelFillInSheetBody } from '@/components/clinic/CancelFillInSheetBody';
import {
  CancelFillInSheetBottom,
  type CancelFillInSheetProps,
} from '@/components/clinic/CancelFillInSheet.tsx';

export function CancelFillInSheet(props: CancelFillInSheetProps) {
  const { visible, onClose } = props;

  return (
    <AdaptiveWebSheet
      visible={visible}
      onClose={onClose}
      maxWidth={480}
      showCloseButton
      backdropLabel="Close cancel fill-in dialog"
      bottomSheet={<CancelFillInSheetBottom {...props} />}
    >
      <CancelFillInSheetBody {...props} variant="dialog" />
    </AdaptiveWebSheet>
  );
}
