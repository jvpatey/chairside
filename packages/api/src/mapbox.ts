export type MapboxFeature = {
  id: string;
  place_name: string;
  text: string;
  address?: string;
  center: [number, number];
  context?: { id: string; text: string; short_code?: string }[];
};

export type AddressSuggestion = {
  id: string;
  label: string;
  feature: MapboxFeature;
};

export type ParsedAddress = {
  address_line1: string;
  city: string;
  province: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  formatted: string;
};

function getContextText(feature: MapboxFeature, prefix: string): string | undefined {
  return feature.context?.find((item) => item.id.startsWith(prefix))?.text;
}

function getRegionCode(feature: MapboxFeature): string {
  const region = feature.context?.find((item) => item.id.startsWith('region.'));
  const shortCode = region?.short_code;
  if (shortCode?.startsWith('CA-')) {
    return shortCode.slice(3);
  }
  return 'NS';
}

export function parseMapboxFeature(feature: MapboxFeature): ParsedAddress {
  const streetNumber = feature.address ?? '';
  const streetName = feature.text ?? '';
  const address_line1 =
    [streetNumber, streetName].filter(Boolean).join(' ').trim() ||
    (feature.place_name.split(',')[0]?.trim() ?? '');

  const city =
    getContextText(feature, 'place.') ??
    getContextText(feature, 'locality.') ??
    getContextText(feature, 'district.') ??
    '';

  const postal_code = getContextText(feature, 'postcode.') ?? '';
  const province = getRegionCode(feature);
  const [longitude, latitude] = feature.center;

  return {
    address_line1,
    city,
    province,
    postal_code,
    latitude,
    longitude,
    formatted: feature.place_name,
  };
}

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const trimmed = query.trim();

  if (!token || trimmed.length < 3) {
    return [];
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`,
  );
  url.searchParams.set('access_token', token);
  url.searchParams.set('country', 'ca');
  url.searchParams.set('types', 'address');
  url.searchParams.set('proximity', '-63.5752,44.6488');
  url.searchParams.set('limit', '5');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Address search failed');
  }

  const data = (await response.json()) as { features?: MapboxFeature[] };
  return (data.features ?? []).map((feature) => ({
    id: feature.id,
    label: feature.place_name,
    feature,
  }));
}
