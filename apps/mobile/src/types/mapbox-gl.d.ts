declare module 'mapbox-gl' {
  export class Map {
    constructor(options: Record<string, unknown>);
    addControl(control: unknown, position?: string): this;
    on(type: string, listener: (...args: unknown[]) => void): this;
    off(type: string, listener: (...args: unknown[]) => void): this;
    remove(): void;
    flyTo(options: Record<string, unknown>): this;
    fitBounds(bounds: unknown, options?: Record<string, unknown>): this;
    getCenter(): { lng: number; lat: number };
    getZoom(): number;
    resize(): void;
  }

  export class Marker {
    constructor(options?: Record<string, unknown>);
    setLngLat(lngLat: [number, number] | { lng: number; lat: number }): this;
    addTo(map: Map): this;
    remove(): void;
    getElement(): HTMLElement;
  }

  export class Popup {
    constructor(options?: Record<string, unknown>);
    setLngLat(lngLat: [number, number] | { lng: number; lat: number }): this;
    setHTML(html: string): this;
    addTo(map: Map): this;
    remove(): void;
  }

  export class NavigationControl {
    constructor(options?: Record<string, unknown>);
  }

  export as namespace mapboxgl;
  export = mapboxgl;
}

