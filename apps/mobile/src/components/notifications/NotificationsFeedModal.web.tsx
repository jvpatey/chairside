import { AdaptiveWebSheet } from '@/components/ui/AdaptiveWebSheet.web';
import { NotificationsFeedBody } from '@/components/notifications/NotificationsFeedBody';
import {
  NotificationsFeedModalBottom,
  type NotificationsFeedModalProps,
} from './NotificationsFeedModal.tsx';

export function NotificationsFeedModal({ visible, onClose }: NotificationsFeedModalProps) {
  return (
    <AdaptiveWebSheet
      visible={visible}
      onClose={onClose}
      maxWidth={500}
      showCloseButton
      backdropLabel="Close notifications"
      bottomSheet={<NotificationsFeedModalBottom visible={visible} onClose={onClose} />}
    >
      <NotificationsFeedBody visible={visible} onClose={onClose} variant="dialog" />
    </AdaptiveWebSheet>
  );
}
