export type MapsDestination = {
  latitude?: number | null;
  longitude?: number | null;
  label?: string | null;
};

function encodeDestinationQuery(destination: MapsDestination): string | null {
  if (destination.latitude != null && destination.longitude != null) {
    return `${destination.latitude},${destination.longitude}`;
  }

  const label = destination.label?.trim();
  return label ? label : null;
}

export function buildAppleMapsDirectionsUrl(destination: MapsDestination): string | null {
  const query = encodeDestinationQuery(destination);
  if (!query) return null;

  if (destination.latitude != null && destination.longitude != null) {
    const ll = `${destination.latitude},${destination.longitude}`;
    const label = destination.label?.trim();
    if (label) {
      return `https://maps.apple.com/?q=${encodeURIComponent(label)}&ll=${ll}`;
    }
    return `https://maps.apple.com/?ll=${ll}&q=${encodeURIComponent(ll)}`;
  }

  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

export function buildGoogleMapsDirectionsUrl(destination: MapsDestination): string | null {
  const query = encodeDestinationQuery(destination);
  if (!query) return null;

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
