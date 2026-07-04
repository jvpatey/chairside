import { PageHeroGlow } from '@/components/ui/PageHeroGlow';
import type { GradientAccent } from '@/theme';

/** Soft brand wash with gentle aurora drift for auth screens (sign-in, sign-up, role). */
export function AuthHeroGlow({ accent = 'primary' }: { accent?: GradientAccent }) {
  return <PageHeroGlow variant="form" accent={accent} motion />;
}
