import { AdaptiveWebSheet } from '@/components/ui/AdaptiveWebSheet.web';
import { PracticeDoctorEditSheetBody } from '@/components/clinic/PracticeDoctorEditSheetBody';
// @ts-expect-error TS5097 — explicit extension required to avoid web circular import
import { PracticeDoctorEditSheetBottom, type PracticeDoctorEditSheetProps } from '@/components/clinic/PracticeDoctorEditSheet.tsx';

export function PracticeDoctorEditSheet(props: PracticeDoctorEditSheetProps) {
  const { visible, onClose } = props;

  return (
    <AdaptiveWebSheet
      visible={visible}
      onClose={onClose}
      maxWidth={640}
      showCloseButton
      backdropLabel="Close edit doctor dialog"
      bottomSheet={<PracticeDoctorEditSheetBottom {...props} />}
    >
      <PracticeDoctorEditSheetBody {...props} variant="dialog" />
    </AdaptiveWebSheet>
  );
}
