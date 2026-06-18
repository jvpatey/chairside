import { GradientHairline } from '@/components/ui/GradientHairline';

type ListGroupItemSeparatorProps = {
  /** Optional horizontal inset from the group edges. */
  inset?: number;
};

export function ListGroupItemSeparator({ inset = 0 }: ListGroupItemSeparatorProps) {
  return <GradientHairline inset={inset} />;
}
