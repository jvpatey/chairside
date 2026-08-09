import { AdaptiveWebSheet } from '@/components/ui/AdaptiveWebSheet.web';
import { InterviewScheduleSheetBody } from '@/components/clinic/InterviewScheduleSheetBody';
import {
  InterviewScheduleSheetBottom,
  type InterviewScheduleSheetProps,
} from '@/components/clinic/InterviewScheduleSheet.tsx';

export type { InterviewScheduleSheetMode } from '@/components/clinic/InterviewScheduleSheetBody';

export function InterviewScheduleSheet(props: InterviewScheduleSheetProps) {
  const { visible, onClose } = props;

  return (
    <AdaptiveWebSheet
      visible={visible}
      onClose={onClose}
      maxWidth={600}
      showCloseButton
      backdropLabel="Close interview scheduler"
      bottomSheet={<InterviewScheduleSheetBottom {...props} />}
    >
      <InterviewScheduleSheetBody {...props} variant="dialog" />
    </AdaptiveWebSheet>
  );
}
