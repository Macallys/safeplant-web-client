import { inject, InjectionToken, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlantHistoryResponse, PlantMetricsDashboardResponse } from './metrics.models';

export interface MetricsApiContract {
  getDashboard(): Observable<PlantMetricsDashboardResponse>;
  getHistory(areaId: string, from: string, to: string): Observable<PlantHistoryResponse>;
}

export const METRICS_API = new InjectionToken<MetricsApiContract>('METRICS_API');

@Service()
export class MetricsApi implements MetricsApiContract {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<PlantMetricsDashboardResponse> {
    // TODO(backend): path is "To discuss" in docs/api-dtos.md (PlantMetricsDashboard).
    return this.http.get<PlantMetricsDashboardResponse>(
      `${environment.apiBaseUrl}/api/v1/metrics/dashboard`,
    );
  }

  getHistory(areaId: string, from: string, to: string): Observable<PlantHistoryResponse> {
    // TODO(backend): path is "To discuss" in docs/api-dtos.md (PlantHistory).
    return this.http.get<PlantHistoryResponse>(
      `${environment.apiBaseUrl}/api/v1/areas/${encodeURIComponent(areaId)}/history`,
      { params: { from, to } },
    );
  }
}
