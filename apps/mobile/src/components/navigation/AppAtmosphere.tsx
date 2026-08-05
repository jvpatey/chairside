import { PageHeroGlow } from '@/components/ui/PageHeroGlow';
import type { GradientAccent } from '@/theme';
import type { TabAtmosphereIntensity } from '@/lib/tabAtmosphereRoutes';

type AppAtmosphereProps = {
  intensity?: Exclude<TabAtmosphereIntensity, 'none'>;
  accent?: GradientAccent;
  /** Web tablet — one viewport-fixed gradient behind sidebar and content. */
  viewportFixed?: boolean;
};

/** Soft brand wash fixed to the top of tab and hero surfaces (static — no drifting orbs). */
export function AppAtmosphere({
  intensity = 'prominent',
  accent = 'primary',
  viewportFixed = false,
}: AppAtmosphereProps) {
  const variant = intensity === 'prominent' ? 'accent' : 'subtle';
  return <PageHeroGlow variant={variant} accent={accent} viewportFixed={viewportFixed} />;
}
