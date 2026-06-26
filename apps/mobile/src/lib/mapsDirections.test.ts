import { describe, expect, it } from 'vitest';

import { buildAppleMapsDirectionsUrl, buildGoogleMapsDirectionsUrl } from '@/lib/mapsDirectionsUrls';

describe('mapsDirections', () => {
  it('builds Apple Maps URLs from coordinates and label', () => {
    expect(
      buildAppleMapsDirectionsUrl({
        latitude: 44.65,
        longitude: -63.58,
        label: 'Harbour Dental, 123 Main St',
      }),
    ).toBe(
      'https://maps.apple.com/?q=Harbour%20Dental%2C%20123%20Main%20St&ll=44.65,-63.58',
    );
  });

  it('builds Google Maps directions URLs from address labels', () => {
    expect(
      buildGoogleMapsDirectionsUrl({
        label: '123 Main St, Halifax, NS',
      }),
    ).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=123%20Main%20St%2C%20Halifax%2C%20NS',
    );
  });
});
