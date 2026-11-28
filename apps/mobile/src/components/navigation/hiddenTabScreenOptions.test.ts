import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { isWebTabSceneFocused, type TabAtmosphereRole } from '@/lib/tabAtmosphereRoutes';

import { hiddenTabScreenOptions } from './hiddenTabScreenOptions';

const APP_DIR = path.resolve(__dirname, '../../../app');

function readLayout(group: '(tabs)' | '(clinic-tabs)'): string {
  return fs.readFileSync(path.join(APP_DIR, group, '_layout.tsx'), 'utf8');
}

function declaredScreenNames(source: string): string[] {
  return [...source.matchAll(/<Tabs\.Screen\s+name="([^"]+)"/g)].map((m) => m[1]!);
}

describe.each([
  ['(tabs)', 'worker'],
  ['(clinic-tabs)', 'clinic'],
] as const)('%s layout', (group, role: TabAtmosphereRole) => {
  const source = readLayout(group);

  it('never uses href: null (Expo Router 58 treats it as hidden and redirects Home)', () => {
    expect(source).not.toMatch(/href:\s*null/);
    expect(hiddenTabScreenOptions).not.toHaveProperty('href');
    expect(hiddenTabScreenOptions).not.toHaveProperty('hidden');
  });

  it('focuses exactly one declared scene for detail routes on web', () => {
    const names = declaredScreenNames(source);
    const paths =
      role === 'worker'
        ? [
            '/fill-in-availability',
            '/shift/abc-123',
            '/job/abc-123',
            '/open-fill-ins',
            '/fillins',
            '/',
          ]
        : ['/shift/abc-123', '/job/abc-123', '/post-shift', '/fill-ins', '/'];

    for (const pathname of paths) {
      const focused = names.filter((name) => isWebTabSceneFocused(name, pathname, role));
      expect(focused, pathname).toHaveLength(1);
    }
  });
});
