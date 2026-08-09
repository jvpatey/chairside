import { AdaptiveWebSheet } from '@/components/ui/AdaptiveWebSheet.web';
import { ClinicWorkerCrmSheetBody } from '@/components/clinic/ClinicWorkerCrmSheetBody';
import {
  ClinicWorkerCrmSheetBottom,
  type ClinicWorkerCrmSheetProps,
} from '@/components/clinic/ClinicWorkerCrmSheet.tsx';

export function ClinicWorkerCrmSheet(props: ClinicWorkerCrmSheetProps) {
  const { visible, onClose } = props;

  return (
    <AdaptiveWebSheet
      visible={visible}
      onClose={onClose}
      maxWidth={640}
      showCloseButton
      backdropLabel="Close private notes editor"
      bottomSheet={<ClinicWorkerCrmSheetBottom {...props} />}
    >
      <ClinicWorkerCrmSheetBody {...props} variant="dialog" />
    </AdaptiveWebSheet>
  );
}
