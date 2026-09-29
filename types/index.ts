export interface Agency {
  id: number;
  url: string;
  name: string;
  featured: boolean;
  type: string;
  country_code: string;
  abbrev: string;
  description?: string;
  administrator?: string;
  founding_year?: string;
  launchers?: string;
  spacecraft?: string;
  parent?: string;
  image_url?: string;
  logo_url?: string;
}

export interface Rocket {
  id: number;
  configuration: {
    id: number;
    url: string;
    name: string;
    family: string;
    full_name: string;
    variant: string;
  };
}

export interface Location {
  id: number;
  url: string;
  name: string;
  country_code: string;
  map_image?: string;
  timezone_name?: string;
  total_launch_count?: number;
  total_landing_count?: number;
}

export interface Pad {
  id: number;
  url: string;
  agency_id?: number;
  name: string;
  info_url?: string;
  wiki_url?: string;
  map_url?: string;
  latitude: string;
  longitude: string;
  location: Location;
  map_image?: string;
  total_launch_count?: number;
}

export interface Mission {
  id: number;
  name: string;
  description?: string;
  launch_designator?: string;
  type?: string;
  orbit?: {
    id: number;
    name: string;
    abbrev: string;
  };
  agencies?: Agency[];
}

export type DataSource = "LL2" | "NASA_NeoWs" | "NASA_APOD" | "Other";

export interface LaunchImage {
  id?: number;
  name?: string;
  image_url?: string | null;
  thumbnail_url?: string | null;
  credit?: string | null;
}

export interface Launch {
  id: string;
  url: string;
  launch_library_id?: number;
  slug: string;
  name: string;
  source?: DataSource;
  status: {
    id: number;
    name: string;
    abbrev: string;
    description: string;
  };
  net: string;
  window_end?: string;
  window_start?: string;
  net_precision?: {
    id: number;
    name: string;
    abbrev: string;
    description: string;
  };
  probability?: number;
  weather_concerns?: string;
  holdreason?: string;
  failreason?: string;
  hashtag?: string;
  launch_service_provider: Agency;
  rocket: Rocket;
  mission?: Mission;
  pad: Pad;
  webcast_live?: boolean;
  image?: string | LaunchImage | null;
  infographic?: string;
  program?: Array<{
    id: number;
    url: string;
    name: string;
    description?: string;
    agencies?: Agency[];
    image_url?: string;
    start_date?: string;
    end_date?: string;
    info_url?: string;
    wiki_url?: string;
  }>;
  orbital_launch_attempt_count?: number;
  location_launch_attempt_count?: number;
  pad_launch_attempt_count?: number;
  agency_launch_attempt_count?: number;
  orbital_launch_attempt_count_year?: number;
  location_launch_attempt_count_year?: number;
  pad_launch_attempt_count_year?: number;
  agency_launch_attempt_count_year?: number;
}

export interface LaunchResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Launch[];
}

type MaybeArray<T> = T | T[];

export interface LaunchFilters {
  search?: string;
  net__gte?: string;
  net__lte?: string;
  status?: MaybeArray<number>;
  lsp__id?: MaybeArray<number>;
  ordering?: string;
  limit?: number;
  offset?: number;
  // Location filters
  location__id?: MaybeArray<number>;
  location__country_code?: MaybeArray<string>;
  // Rocket filters
  rocket__configuration__id?: MaybeArray<number>;
  rocket__configuration__family?: MaybeArray<string>;
  rocket__configuration__variant?: MaybeArray<string>;
  // Mission filters
  mission__id?: MaybeArray<number>;
  mission__type?: MaybeArray<string>;
  mission__orbit__id?: MaybeArray<number>;
  // Program filter
  program__id?: MaybeArray<number>;
}

// Re-export navigation types
export * from './navigation';
