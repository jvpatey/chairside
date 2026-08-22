import 'mapbox-gl/dist/mapbox-gl.css';

// Metro requires the explicit .tsx extension so web does not re-resolve this file.
// @ts-expect-error TS5097 — extension required for bundler resolution
import RootLayout, { ErrorBoundary, unstable_settings } from './_layout.tsx';

import { WebDocumentTitleManager } from '@/components/web/WebDocumentTitleManager.web';

export { ErrorBoundary, unstable_settings };

export default function WebRootLayout() {
  return (
    <>
      <WebDocumentTitleManager />
      <RootLayout />
    </>
  );
}
