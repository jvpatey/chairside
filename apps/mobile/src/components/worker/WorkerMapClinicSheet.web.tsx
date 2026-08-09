import { AdaptiveWebSheet } from '@/components/ui/AdaptiveWebSheet.web';
import { WorkerMapClinicSheetBody } from '@/components/worker/WorkerMapClinicSheetBody';
import {
  WorkerMapClinicSheetBottom,
  type WorkerMapClinicSheetProps,
} from '@/components/worker/WorkerMapClinicSheet.tsx';

export function WorkerMapClinicSheet(props: WorkerMapClinicSheetProps) {
  const { visible, onClose, group } = props;

  if (!group) return null;

  return (
    <AdaptiveWebSheet
      visible={visible}
      onClose={onClose}
      maxWidth={640}
      showCloseButton
      backdropLabel="Close clinic details"
      bottomSheet={<WorkerMapClinicSheetBottom {...props} />}
    >
      <WorkerMapClinicSheetBody {...props} variant="dialog" />
    </AdaptiveWebSheet>
  );
}
