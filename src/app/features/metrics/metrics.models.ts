// PlantMetricsDashboard — docs/api-dtos.md (Plant Monitoring).
// TODO(backend): path `GET /api/v1/metrics/dashboard` is "To discuss".

export type PresenceState = 'Detected' | 'Cleared';

export type ExposureSeverity = 'None' | 'Medium' | 'High';

export interface PlantMetricsDashboardItem {
  areaId: string;
  name: string;
  co2Ppm: number | null;
  noiseDb: number | null;
  presenceState: PresenceState | null;
  // The contract allows null / `None` until the Edge syncs.
  severity: ExposureSeverity | null;
  alertActive: boolean;
  highlighted: boolean;
}

export interface PlantMetricsDashboardResponse {
  items: PlantMetricsDashboardItem[];
}

// PlantHistory — docs/api-dtos.md (Plant Monitoring).
// TODO(backend): path `GET /api/v1/areas/{areaId}/history?from&to` is "To discuss"
// (also whether it stays one composite response or three GETs). `nextCursor` is "To discuss".

export interface CarbonDioxideReading {
  id: string;
  deviceId: string;
  ppm: number;
  recordedAt: string;
}

export interface NoiseReading {
  id: string;
  deviceId: string;
  db: number;
  recordedAt: string;
}

export interface PresenceChange {
  id: string;
  deviceId: string;
  state: PresenceState;
  recordedAt: string;
}

// EnvironmentalAlert. TODO(backend): alertType, severity and measuredValue are "To discuss".
export interface EnvironmentalAlert {
  id: string;
  areaId: string;
  raisedAt: string;
  withdrawnAt: string | null;
}

export type ActuatorType = 'Extractor' | 'Siren' | 'Barrier';

// AutomaticActuatorAction. TODO(backend): failure reason is "To discuss".
export interface AutomaticActuatorAction {
  id: string;
  areaId: string;
  type: ActuatorType;
  succeeded: boolean;
  recordedAt: string;
}

export interface PlantHistoryResponse {
  areaId: string;
  carbonDioxideReadings: CarbonDioxideReading[];
  noiseReadings: NoiseReading[];
  presenceChanges: PresenceChange[];
  alerts: EnvironmentalAlert[];
  actions: AutomaticActuatorAction[];
}
