import 'mapbox-gl/dist/mapbox-gl.css';

// Explicit .tsx extension avoids Metro resolving this back to _layout.web.tsx (infinite loop).
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
