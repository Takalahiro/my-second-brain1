export type WeatherDaily = { date: string; tMax: number; tMin: number; code: number };

export type WeatherForecast = {
  placeName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  fetchedAt: number;
  current: { temperature: number; windSpeed: number; weatherCode: number; isDay: 0 | 1 };
  daily: WeatherDaily[];
};

export type WeatherElement = { name: string; val: number };

export type WeatherBodyProps = {
  ui: Record<string, string>;
  placeName: string | null;
  forecast: WeatherForecast | null;
  loading: boolean;
  err: string | null;
  condition: string;
  elements: WeatherElement[];
  wmoLabel: (code: number) => string;
  formatAge: (ts: number) => string;
  weekday: (dateStr: string) => string;
  shortDate: (dateStr: string) => string;
  weatherGlyph: (code: number, isDay?: number) => string;
};

export type WeatherSettingsProps = {
  ui: Record<string, string>;
  placeQuery: string;
  onPlaceQueryChange: (v: string) => void;
  onSearch: () => void;
  onGeolocate: () => void;
  onRefresh: () => void;
};
