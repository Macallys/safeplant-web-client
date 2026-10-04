import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, map, of, startWith, switchMap } from 'rxjs';
import { AppShell } from '../../../shared/app-shell/app-shell';
import { METRICS_API } from '../metrics.api';
import { PlantHistoryResponse, PlantMetricsDashboardItem } from '../metrics.models';
import { ChartPoint, TelemetryChart } from './telemetry-chart';

type Period = '1h' | '6h' | '12h' | '24h';

const PERIOD_HOURS: Record<Period, number> = { '1h': 1, '6h': 6, '12h': 12, '24h': 24 };
const PAGE_SIZE = 5;

type Load<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error' };

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}

@Component({
  selector: 'app-history',
  imports: [AppShell, DatePipe, NgOptimizedImage, TelemetryChart],
  templateUrl: './history.html',
  host: { class: 'block' },
})
export class AlertsHistory {
  private readonly api = inject(METRICS_API);
  private readonly router = inject(Router);

  protected readonly periods = Object.keys(PERIOD_HOURS) as Period[];
  protected readonly period = signal<Period>('24h');
  private readonly reloadTick = signal(0);

  private readonly areaId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('areaId'))),
    { initialValue: null },
  );

  // Zone selector: areas come from PlantMetricsDashboard.
  protected readonly areas = toSignal(
    this.api.getDashboard().pipe(
      map((res): Load<PlantMetricsDashboardItem[]> => ({ status: 'ready', data: res.items })),
      catchError(() => of<Load<PlantMetricsDashboardItem[]>>({ status: 'error' })),
    ),
    { initialValue: { status: 'loading' } as Load<PlantMetricsDashboardItem[]> },
  );

  protected readonly areaList = computed(() => {
    const areas = this.areas();
    return areas.status === 'ready' ? areas.data : [];
  });

  protected readonly selectedArea = computed(
    () => this.areaList().find((a) => a.areaId === this.areaId()) ?? null,
  );

  private readonly request = computed(() => {
    const areaId = this.areaId();
    if (!areaId) return null;
    this.reloadTick();
    const to = Date.now();
    const from = to - PERIOD_HOURS[this.period()] * 3_600_000;
    return { areaId, from, to };
  });

  private readonly result = toSignal(
    toObservable(this.request).pipe(
      filter((req) => req !== null),
      switchMap((req) =>
        this.api.getHistory(req.areaId, new Date(req.from).toISOString(), new Date(req.to).toISOString()).pipe(
          map((data) => ({ req, load: { status: 'ready', data } as Load<PlantHistoryResponse> })),
          catchError(() => of({ req, load: { status: 'error' } as Load<PlantHistoryResponse> })),
          startWith({ req, load: { status: 'loading' } as Load<PlantHistoryResponse> }),
        ),
      ),
    ),
  );

  protected readonly status = computed(() => this.result()?.load.status ?? 'loading');
  protected readonly window = computed(() => this.result()?.req ?? null);

  // Refetch keeps the previous frame visible (dimmed) instead of flashing a skeleton.
  private readonly lastData = signal<PlantHistoryResponse | null>(null);
  protected readonly data = this.lastData.asReadonly();

  protected readonly page = signal(0);

  constructor() {
    effect(() => {
      const load = this.result()?.load;
      if (load?.status === 'ready') {
        this.lastData.set(load.data);
        this.page.set(0);
      }
    });

    // `/alerts` has no area: open the first area of the plant.
    effect(() => {
      const first = this.areaList()[0];
      if (!this.areaId() && first) {
        this.router.navigate(['/metrics', first.areaId, 'history'], { replaceUrl: true });
      }
    });
  }

  protected readonly alerts = computed(() =>
    [...(this.data()?.alerts ?? [])].sort((a, b) => b.raisedAt.localeCompare(a.raisedAt)),
  );
  protected readonly activeAlerts = computed(() => this.alerts().filter((a) => a.withdrawnAt === null).length);
  protected readonly withdrawnAlerts = computed(() => this.alerts().filter((a) => a.withdrawnAt !== null));
  protected readonly meanResolutionMinutes = computed(() => {
    const ms = average(
      this.withdrawnAlerts().map((a) => Date.parse(a.withdrawnAt!) - Date.parse(a.raisedAt)),
    );
    return ms === null ? null : ms / 60_000;
  });
  protected readonly actions = computed(() => this.data()?.actions ?? []);
  protected readonly succeededActions = computed(() => this.actions().filter((a) => a.succeeded).length);

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.alerts().length / PAGE_SIZE)));
  protected readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i));
  protected readonly pageAlerts = computed(() =>
    this.alerts().slice(this.page() * PAGE_SIZE, (this.page() + 1) * PAGE_SIZE),
  );
  protected readonly pageStart = computed(() => this.page() * PAGE_SIZE);

  protected readonly co2Points = computed<ChartPoint[]>(() =>
    (this.data()?.carbonDioxideReadings ?? []).map((r) => ({ t: Date.parse(r.recordedAt), v: r.ppm })),
  );
  protected readonly noisePoints = computed<ChartPoint[]>(() =>
    (this.data()?.noiseReadings ?? []).map((r) => ({ t: Date.parse(r.recordedAt), v: r.db })),
  );
  protected readonly presencePoints = computed<ChartPoint[]>(() =>
    (this.data()?.presenceChanges ?? []).map((r) => ({
      t: Date.parse(r.recordedAt),
      v: r.state === 'Detected' ? 1 : 0,
    })),
  );

  protected readonly co2Latest = computed(() => this.co2Points().at(-1)?.v ?? null);
  protected readonly co2Average = computed(() => average(this.co2Points().map((p) => p.v)));
  protected readonly noiseLatest = computed(() => this.noisePoints().at(-1)?.v ?? null);
  protected readonly noiseAverage = computed(() => average(this.noisePoints().map((p) => p.v)));
  protected readonly presenceDetections = computed(() => this.presencePoints().filter((p) => p.v === 1).length);

  protected readonly isEmpty = computed(() => {
    const d = this.data();
    return (
      !!d &&
      !d.alerts.length &&
      !d.actions.length &&
      !d.carbonDioxideReadings.length &&
      !d.noiseReadings.length &&
      !d.presenceChanges.length
    );
  });

  protected selectArea(areaId: string): void {
    this.router.navigate(['/metrics', areaId, 'history']);
  }

  protected reload(): void {
    this.reloadTick.update((n) => n + 1);
  }

  protected duration(raisedAt: string, withdrawnAt: string): string {
    const minutes = Math.round((Date.parse(withdrawnAt) - Date.parse(raisedAt)) / 60_000);
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  }
}
