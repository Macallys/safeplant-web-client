import { Service } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { MetricsApiContract } from './metrics.api';
import {
  ActuatorType,
  PlantHistoryResponse,
  PlantMetricsDashboardResponse,
  PresenceState,
} from './metrics.models';

// Sample payload with the exact shape of PlantMetricsDashboard (docs/api-dtos.md).
// Only this file holds sample data; swap it for MetricsApi in app.config.ts.
const DASHBOARD: PlantMetricsDashboardResponse = {
  items: [
    {
      areaId: 'area-a',
      name: 'Zona A',
      co2Ppm: 390,
      noiseDb: 71.8,
      presenceState: 'Cleared',
      severity: 'None',
      alertActive: false,
      highlighted: false,
    },
    {
      areaId: 'area-b',
      name: 'Zona B',
      co2Ppm: 425,
      noiseDb: 82.4,
      presenceState: 'Detected',
      severity: 'Medium',
      alertActive: true,
      highlighted: false,
    },
    {
      areaId: 'area-c',
      name: 'Zona C',
      co2Ppm: 682,
      noiseDb: 76,
      presenceState: 'Detected',
      severity: 'High',
      alertActive: true,
      highlighted: true,
    },
    {
      areaId: 'area-d',
      name: 'Zona D',
      co2Ppm: 310,
      noiseDb: 59.3,
      presenceState: 'Cleared',
      severity: 'None',
      alertActive: false,
      highlighted: false,
    },
    {
      // Area without readings yet: the Edge has not synced.
      areaId: 'area-e',
      name: 'Zona E',
      co2Ppm: null,
      noiseDb: null,
      presenceState: null,
      severity: null,
      alertActive: false,
      highlighted: false,
    },
  ],
};

const ACTUATOR_TYPES: ActuatorType[] = ['Extractor', 'Siren', 'Barrier'];
const SAMPLES_PER_PERIOD = 48;

// Deterministic pseudo-random generator so each area always draws the same curve.
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function buildHistory(areaId: string, from: string, to: string): PlantHistoryResponse {
  const area = DASHBOARD.items.find((i) => i.areaId === areaId);
  const empty: PlantHistoryResponse = {
    areaId,
    carbonDioxideReadings: [],
    noiseReadings: [],
    presenceChanges: [],
    alerts: [],
    actions: [],
  };
  // Unknown area or area without Edge sync: empty period (US23 scenario 3).
  if (!area || area.co2Ppm === null || area.noiseDb === null) return empty;

  const rand = seededRandom(areaId);
  const start = Date.parse(from);
  const end = Date.parse(to);
  const step = (end - start) / (SAMPLES_PER_PERIOD - 1);
  const at = (i: number) => new Date(start + i * step).toISOString();
  const peakAt = Math.floor(SAMPLES_PER_PERIOD * (0.6 + rand() * 0.3));
  const bump = (i: number) => Math.max(0, 1 - Math.abs(i - peakAt) / 4);

  const history: PlantHistoryResponse = { ...empty };
  for (let i = 0; i < SAMPLES_PER_PERIOD; i++) {
    const drift = i / SAMPLES_PER_PERIOD - 0.5;
    history.carbonDioxideReadings.push({
      id: `${areaId}-co2-${i}`,
      deviceId: `${areaId}-co2`,
      ppm: Math.round(area.co2Ppm * (0.85 + drift * 0.2 + rand() * 0.1) + bump(i) * area.co2Ppm * 0.4),
      recordedAt: at(i),
    });
    history.noiseReadings.push({
      id: `${areaId}-noise-${i}`,
      deviceId: `${areaId}-noise`,
      db: Math.round((area.noiseDb * (0.9 + rand() * 0.1) + bump(i) * 8) * 10) / 10,
      recordedAt: at(i),
    });
  }

  let state: PresenceState = 'Cleared';
  for (let i = 2; i < SAMPLES_PER_PERIOD; i += 3 + Math.floor(rand() * 6)) {
    state = state === 'Cleared' ? 'Detected' : 'Cleared';
    history.presenceChanges.push({
      id: `${areaId}-presence-${i}`,
      deviceId: `${areaId}-presence`,
      state,
      recordedAt: at(i),
    });
  }

  const alertCount = area.alertActive ? 7 : 3;
  for (let n = 0; n < alertCount; n++) {
    const raised = Math.floor(((n + rand()) * (SAMPLES_PER_PERIOD - 4)) / alertCount);
    const isLatestActive = area.alertActive && n === alertCount - 1;
    history.alerts.push({
      id: `ALR-${4000 + n * 100 + Math.floor(rand() * 100)}`,
      areaId,
      raisedAt: at(isLatestActive ? peakAt : raised),
      withdrawnAt: isLatestActive ? null : at(raised + 1 + Math.floor(rand() * 3)),
    });
    history.actions.push({
      id: `${areaId}-action-${n}`,
      areaId,
      type: ACTUATOR_TYPES[Math.floor(rand() * ACTUATOR_TYPES.length)],
      succeeded: rand() > 0.15,
      recordedAt: at(raised),
    });
  }
  return history;
}

@Service({ autoProvided: false })
export class MetricsMockApi implements MetricsApiContract {
  getDashboard(): Observable<PlantMetricsDashboardResponse> {
    return of(structuredClone(DASHBOARD)).pipe(delay(800));
  }

  getHistory(areaId: string, from: string, to: string): Observable<PlantHistoryResponse> {
    return of(buildHistory(areaId, from, to)).pipe(delay(600));
  }
}
