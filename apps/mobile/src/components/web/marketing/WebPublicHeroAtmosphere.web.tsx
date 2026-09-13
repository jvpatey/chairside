import { PageHeroGlow } from '@/components/ui/PageHeroGlow';

/**
 * Primary-blue hero wash for public legal/support/pricing pages on web.
 * Viewport-fixed so the gradient can fade fully instead of being clipped by a short hero.
 */
export function WebPublicHeroAtmosphere() {
  return <PageHeroGlow variant="form" accent="primary" viewportFixed />;
}
