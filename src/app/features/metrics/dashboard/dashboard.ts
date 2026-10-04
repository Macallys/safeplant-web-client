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
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected severityBadge(severity: ExposureSeverity | null): SeverityBadge | null {
    return severity ? SEVERITY_BADGES[severity] : null;
  }
}
