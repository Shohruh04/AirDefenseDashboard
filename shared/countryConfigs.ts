// ─── Country Configuration Registry ─────────────────────────────────────────
// Centralizes all country-specific data: coordinates, defense systems, aircraft,
// air bases, and threat models. Eliminates duplication across client/server.

export interface AircraftModelDef {
  model: string;
  callsignPrefix: string;
}

export interface DefenseSystem {
  designation: string;
  speed: number;       // km/h (0 for gun systems)
  range: number;       // km
  type: "long" | "medium" | "short" | "gun" | "cram" | "manpads";
}

export interface AirBase {
  name: string;
  lat: number;
  lng: number;
}

export interface CountryConfig {
  id: string;
  name: string;
  flag: string;
  radarCenter: { lat: number; lng: number };
  mapBounds: {
    latMin: number; latMax: number;
    lngMin: number; lngMax: number;
  };
  spawnBounds: {
    latMin: number; latMax: number;
    lngMin: number; lngMax: number;
  };
  defaultZoom: number;
  defenseSystems: DefenseSystem[];
  commercialModels: AircraftModelDef[];
  militaryModels: AircraftModelDef[];
  privateModels: AircraftModelDef[];
  droneModels: AircraftModelDef[];
  unknownModels: AircraftModelDef[];
  threatModels: AircraftModelDef[];  // Hostile-specific (cruise missiles, attack drones)
  airBases: AirBase[];
  callsignPrefixes: {
    commercial: string[];
    military: string[];
  };
}

// ─── Germany ─────────────────────────────────────────────────────────────────

const GERMANY_CONFIG: CountryConfig = {
  id: "germany",
  name: "Germany",
  flag: "DE",
  radarCenter: { lat: 50.0, lng: 10.0 },
  mapBounds: { latMin: 47.0, latMax: 55.5, lngMin: 5.5, lngMax: 15.5 },
  spawnBounds: { latMin: 47.5, latMax: 55.0, lngMin: 6.0, lngMax: 15.0 },
  defaultZoom: 6,

  defenseSystems: [
    { designation: "IRIS-T SLM", speed: 3600, range: 40, type: "medium" },
    { designation: "IRIS-T SLS", speed: 3200, range: 12, type: "short" },
    { designation: "MIM-104 Patriot PAC-3", speed: 5000, range: 160, type: "long" },
    { designation: "Gepard SPAAG (35mm)", speed: 0, range: 5.5, type: "gun" },
    { designation: "Ozelot LeFlaSys (Stinger)", speed: 2400, range: 6, type: "manpads" },
    { designation: "MANTIS NBS C-RAM (35mm)", speed: 0, range: 3, type: "cram" },
    { designation: "Skyranger 30", speed: 0, range: 4, type: "gun" },
  ],

  commercialModels: [
    { model: "Airbus A320neo", callsignPrefix: "DLH" },
    { model: "Airbus A321neo", callsignPrefix: "DLH" },
    { model: "Boeing 737-800", callsignPrefix: "EWG" },
    { model: "Airbus A330-300", callsignPrefix: "DLH" },
    { model: "Boeing 747-8", callsignPrefix: "DLH" },
    { model: "Airbus A350-900", callsignPrefix: "DLH" },
    { model: "Embraer E195-E2", callsignPrefix: "CFG" },
    { model: "Airbus A220-300", callsignPrefix: "EWG" },
    // Overflying airlines
    { model: "Boeing 777-300ER", callsignPrefix: "BAW" },
    { model: "Airbus A380-800", callsignPrefix: "UAE" },
    { model: "Boeing 787-9 Dreamliner", callsignPrefix: "KLM" },
  ],

  militaryModels: [
    { model: "Eurofighter Typhoon", callsignPrefix: "GAF" },
    { model: "Tornado IDS", callsignPrefix: "GAF" },
    { model: "Tornado ECR", callsignPrefix: "GAF" },
    { model: "A400M Atlas", callsignPrefix: "GAF" },
    { model: "C-130J Hercules", callsignPrefix: "GAF" },
    { model: "CH-53G", callsignPrefix: "GAF" },
    { model: "NH90", callsignPrefix: "GAF" },
  ],

  privateModels: [
    { model: "Cessna Citation X", callsignPrefix: "D-C" },
    { model: "Beechcraft King Air 350", callsignPrefix: "D-I" },
    { model: "Pilatus PC-12", callsignPrefix: "D-F" },
    { model: "Gulfstream G650", callsignPrefix: "D-A" },
    { model: "Cessna 172 Skyhawk", callsignPrefix: "D-E" },
  ],

  droneModels: [
    { model: "Heron TP", callsignPrefix: "HERON" },
    { model: "RQ-4 Euro Hawk", callsignPrefix: "EHAWK" },
    { model: "DJI Mavic (civilian)", callsignPrefix: "UNK" },
  ],

  unknownModels: [
    { model: "Unidentified Fixed-Wing", callsignPrefix: "UNK" },
    { model: "Unidentified Rotorcraft", callsignPrefix: "UNK" },
    { model: "Unidentified Low-RCS", callsignPrefix: "UNK" },
  ],

  threatModels: [
    { model: "Shahed-136 Loitering Munition", callsignPrefix: "SHAHED" },
    { model: "Orlan-10", callsignPrefix: "ORLAN" },
    { model: "Kalibr 3M14 Cruise Missile", callsignPrefix: "CRUISE" },
    { model: "Kh-101 Cruise Missile", callsignPrefix: "CRUISE" },
    { model: "Iskander-M (9M723)", callsignPrefix: "BALLISTIC" },
  ],

  airBases: [
    { name: "Neuburg (JG 74)", lat: 48.71, lng: 11.21 },
    { name: "Laage (JG 73)", lat: 53.92, lng: 12.27 },
    { name: "Norvenich (TLG 31)", lat: 50.83, lng: 6.66 },
    { name: "Buchel (TLG 33)", lat: 50.17, lng: 7.06 },
    { name: "Wunstorf (LTG 62)", lat: 52.46, lng: 9.43 },
    { name: "Jagel (AG 51)", lat: 54.46, lng: 9.52 },
    { name: "Manching (WTD 61)", lat: 48.72, lng: 11.54 },
  ],

  callsignPrefixes: {
    commercial: ["DLH", "EWG", "CFG", "BER", "GWI"],
    military: ["GAF", "TYPHOON", "TORNADO", "ATLAS"],
  },
};

// ─── Uzbekistan ──────────────────────────────────────────────────────────────

const UZBEKISTAN_CONFIG: CountryConfig = {
  id: "uzbekistan",
  name: "Uzbekistan",
  flag: "UZ",
  radarCenter: { lat: 41.3, lng: 69.3 },
  mapBounds: { latMin: 37.0, latMax: 46.0, lngMin: 56.0, lngMax: 74.0 },
  spawnBounds: { latMin: 37.5, latMax: 45.5, lngMin: 57.0, lngMax: 73.0 },
  defaultZoom: 6,

  defenseSystems: [
    { designation: "HQ-9B", speed: 4800, range: 200, type: "long" },
    { designation: "S-125-2M Pechora-2M", speed: 2400, range: 35, type: "medium" },
    { designation: "S-125M1 Neva-M1", speed: 2400, range: 25, type: "medium" },
    { designation: "S-75 Dvina", speed: 3600, range: 45, type: "long" },
    { designation: "HQ-7 (FM-90)", speed: 2800, range: 15, type: "short" },
    { designation: "HQ-12", speed: 3600, range: 50, type: "medium" },
    { designation: "ZSU-23-4 Shilka (23mm)", speed: 0, range: 2.5, type: "gun" },
  ],

  commercialModels: [
    { model: "Boeing 787-8 Dreamliner", callsignPrefix: "UZB" },
    { model: "Airbus A320neo", callsignPrefix: "UZB" },
    { model: "Boeing 767-300ER", callsignPrefix: "UZB" },
    { model: "Airbus A321neo", callsignPrefix: "HYA" },
    { model: "Embraer E190", callsignPrefix: "HYA" },
    // Overflying airlines
    { model: "Boeing 737-800", callsignPrefix: "THY" },
    { model: "Airbus A330-300", callsignPrefix: "AFL" },
    { model: "Boeing 777-200", callsignPrefix: "CCA" },
  ],

  militaryModels: [
    { model: "MiG-29 Fulcrum", callsignPrefix: "FULCRUM" },
    { model: "MiG-29UB Fulcrum", callsignPrefix: "FULCRUM" },
    { model: "Su-27 Flanker", callsignPrefix: "FLANKER" },
    { model: "Su-27UB Flanker", callsignPrefix: "FLANKER" },
    { model: "Su-25 Frogfoot", callsignPrefix: "FROGFOOT" },
    { model: "Su-24 Fencer", callsignPrefix: "FENCER" },
    { model: "Mi-24 Hind", callsignPrefix: "HIND" },
    { model: "Mi-8/17 Hip", callsignPrefix: "HIP" },
    { model: "Il-76 Candid", callsignPrefix: "CANDID" },
    { model: "An-26 Curl", callsignPrefix: "CURL" },
  ],

  privateModels: [
    { model: "Cessna 208 Caravan", callsignPrefix: "UK-" },
    { model: "Beechcraft King Air 200", callsignPrefix: "UK-" },
    { model: "Cessna 172 Skyhawk", callsignPrefix: "UK-" },
  ],

  droneModels: [
    { model: "WJ-700", callsignPrefix: "DRONE" },
    { model: "Orlan-10E", callsignPrefix: "ORLAN" },
    { model: "DJI Matrice (civilian)", callsignPrefix: "UNK" },
  ],

  unknownModels: [
    { model: "Unidentified Fixed-Wing", callsignPrefix: "UNK" },
    { model: "Unidentified Rotorcraft", callsignPrefix: "UNK" },
    { model: "Unidentified Low-RCS", callsignPrefix: "UNK" },
  ],

  threatModels: [
    { model: "Militant Drone (Afghanistan)", callsignPrefix: "DRONE" },
    { model: "Unidentified UAV", callsignPrefix: "UAV" },
    { model: "Cross-border Intrusion", callsignPrefix: "INTRUDER" },
    { model: "Modified Commercial Drone", callsignPrefix: "UNK" },
  ],

  airBases: [
    { name: "Karshi-Khanabad (K2)", lat: 38.83, lng: 65.92 },
    { name: "Chirchik", lat: 41.47, lng: 69.58 },
    { name: "Tuzel (Tashkent)", lat: 41.26, lng: 69.28 },
    { name: "Nukus", lat: 42.49, lng: 59.62 },
    { name: "Navoi", lat: 40.12, lng: 65.17 },
    { name: "Termez", lat: 37.24, lng: 67.31 },
    { name: "Jizzakh", lat: 40.48, lng: 67.88 },
  ],

  callsignPrefixes: {
    commercial: ["UZB", "HYA"],
    military: ["FULCRUM", "FLANKER", "FROGFOOT", "FENCER", "HIND"],
  },
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  germany: GERMANY_CONFIG,
  uzbekistan: UZBEKISTAN_CONFIG,
};

export const DEFAULT_COUNTRY = "germany";

export function getCountryConfig(id: string): CountryConfig {
  return COUNTRY_CONFIGS[id] ?? COUNTRY_CONFIGS[DEFAULT_COUNTRY];
}

// Helper: get model pools as a flat record by aircraft type (for simulation compatibility)
export function getModelPools(config: CountryConfig): Record<string, AircraftModelDef[]> {
  return {
    Commercial: config.commercialModels,
    Military: config.militaryModels,
    Private: config.privateModels,
    Drone: config.droneModels,
    Unknown: config.unknownModels,
  };
}

// Helper: get SAM-capable systems (speed > 0, for missile launches)
export function getMissileSystems(config: CountryConfig): { designation: string; speed: number }[] {
  return config.defenseSystems
    .filter(s => s.speed > 0)
    .map(s => ({ designation: s.designation, speed: s.speed }));
}
