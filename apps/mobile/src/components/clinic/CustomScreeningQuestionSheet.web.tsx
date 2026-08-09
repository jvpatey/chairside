import { AdaptiveWebSheet } from '@/components/ui/AdaptiveWebSheet.web';
import { CustomScreeningQuestionSheetBody } from '@/components/clinic/CustomScreeningQuestionSheetBody';
import {
  CustomScreeningQuestionSheetBottom,
  type CustomScreeningQuestionSheetProps,
} from '@/components/clinic/CustomScreeningQuestionSheet.tsx';

export function CustomScreeningQuestionSheet(props: CustomScreeningQuestionSheetProps) {
  const { visible, onClose } = props;

  return (
    <AdaptiveWebSheet
      visible={visible}
      onClose={onClose}
      maxWidth={480}
      showCloseButton
      backdropLabel="Close custom question dialog"
      bottomSheet={<CustomScreeningQuestionSheetBottom {...props} />}
    >
      <CustomScreeningQuestionSheetBody {...props} variant="dialog" />
    </AdaptiveWebSheet>
  );
}
