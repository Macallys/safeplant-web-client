import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../../shared/app-shell/app-shell';
import { METRICS_API } from '../metrics.api';
import { ExposureSeverity, PlantMetricsDashboardItem } from '../metrics.models';
import { SAFETY_RULES } from './safety-rules';

function average(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v !== null);
  return present.length ? present.reduce((sum, v) => sum + v, 0) / present.length : null;
}

type LoadState = 'loading' | 'ready' | 'error';

interface SeverityBadge {
  label: string;
  classes: string;
  dot: string;
}

const SEVERITY_BADGES: Record<ExposureSeverity, SeverityBadge> = {
  None: {
    label: 'Normal',
    classes: 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]',
    dot: 'bg-[#059669]',
  },
  Medium: {
    label: 'Severidad media',
    classes: 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]',
    dot: 'bg-[#d97706]',
  },
  High: {
    label: 'Severidad alta',
    classes: 'bg-[#fef3c7] border-[#fcd34d] text-[#78350f]',
    dot: 'bg-[#d97706]',
  },
};

@Component({
  selector: 'app-dashboard',
  imports: [NgOptimizedImage, RouterLink, DecimalPipe, AppShell],
  templateUrl: './dashboard.html',
  host: { class: 'block' },
})
export class Dashboard {
  private readonly api = inject(METRICS_API);

  protected readonly rules = SAFETY_RULES;

  protected readonly state = signal<LoadState>('loading');
  protected readonly items = signal<PlantMetricsDashboardItem[]>([]);
  protected readonly drafts = signal<Record<string, { co2: string; noise: string }>>({});
  protected readonly savingId = signal<string | null>(null);
  protected readonly limitNote = signal<Record<string, string>>({});

  // Front-end aggregates over the latest reading of each area.
  protected readonly co2Average = computed(() => average(this.items().map((i) => i.co2Ppm)));
  protected readonly noiseAverage = computed(() => average(this.items().map((i) => i.noiseDb)));
  protected readonly presenceAreas = computed(() =>
    this.items().filter((i) => i.presenceState === 'Detected'),
  );
  protected readonly presenceAreaNames = computed(() =>
    this.presenceAreas().map((i) => i.name).join(', '),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.getDashboard().subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.drafts.set(seedDrafts(res.items));
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected severityBadge(severity: ExposureSeverity | null): SeverityBadge | null {
    return severity ? SEVERITY_BADGES[severity] : null;
  }

  protected setDraft(areaId: string, field: 'co2' | 'noise', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.drafts.update((current) => ({
      ...current,
      [areaId]: { ...(current[areaId] ?? { co2: '', noise: '' }), [field]: value },
    }));
  }

  protected saveLimits(area: PlantMetricsDashboardItem, event: Event): void {
    event.preventDefault();
    const draft = this.drafts()[area.areaId];
    if (!draft || this.savingId()) {
      return;
    }

    const co2 = Number(draft.co2);
    const noise = Number(draft.noise);
    this.savingId.set(area.areaId);
    this.limitNote.update((current) => ({ ...current, [area.areaId]: '' }));
    this.api.configureThresholds(area.areaId, co2, noise).subscribe({
      next: (saved) => {
        this.savingId.set(null);
        this.items.update((list) =>
          list.map((item) =>
            item.areaId === saved.areaId
              ? { ...item, co2LimitPpm: saved.co2LimitPpm, noiseLimitDb: saved.noiseLimitDb }
              : item,
          ),
        );
        this.limitNote.update((current) => ({ ...current, [area.areaId]: 'Guardado.' }));
      },
      error: (error: unknown) => {
        this.savingId.set(null);
        this.limitNote.update((current) => ({ ...current, [area.areaId]: limitError(error) }));
      },
    });
  }
}

function seedDrafts(items: PlantMetricsDashboardItem[]): Record<string, { co2: string; noise: string }> {
  return Object.fromEntries(
    items.map((item) => [
      item.areaId,
      {
        co2: item.co2LimitPpm === null ? '' : String(item.co2LimitPpm),
        noise: item.noiseLimitDb === null ? '' : String(item.noiseLimitDb),
      },
    ]),
  );
}

function limitError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const code = readCode(error.error);
    if (code === 'co2_limit_out_of_range') {
      return 'El CO₂ tiene que ser un entero entre 1 y 50000.';
    }
    if (code === 'noise_limit_out_of_range') {
      return 'El ruido tiene que ser un entero entre 1 y 140.';
    }
  }

  return 'No se pudieron guardar los umbrales.';
}

function readCode(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('code' in body)) {
    return null;
  }

  const code = body.code;
  return typeof code === 'string' ? code : null;
}
