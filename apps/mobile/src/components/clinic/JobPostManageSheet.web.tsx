import { AdaptiveWebSheet } from '@/components/ui/AdaptiveWebSheet.web';
import { JobPostManageSheetBody } from '@/components/clinic/JobPostManageSheetBody';
// @ts-expect-error TS5097 — explicit extension required to avoid web circular import
import { JobPostManageSheetBottom, type JobPostManageSheetProps } from '@/components/clinic/JobPostManageSheet.tsx';

export function JobPostManageSheet(props: JobPostManageSheetProps) {
  const { visible, onClose } = props;

  return (
    <AdaptiveWebSheet
      visible={visible}
      onClose={onClose}
      maxWidth={480}
      showCloseButton
      backdropLabel="Close manage posting menu"
      bottomSheet={<JobPostManageSheetBottom {...props} />}
    >
      <JobPostManageSheetBody {...props} variant="dialog" />
    </AdaptiveWebSheet>
  );
}
