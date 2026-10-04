import { Component, computed, input, signal } from '@angular/core';

export interface ChartPoint {
  t: number;
  v: number;
}

const W = 300;
const H = 176;
const PAD = { left: 34, right: 10, top: 18, bottom: 22 };

function niceStep(raw: number): number {
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power;
}

export function utcTime(t: number): string {
  const d = new Date(t);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-telemetry-chart',
  templateUrl: './telemetry-chart.html',
  host: { class: 'block' },
})
export class TelemetryChart {
  readonly points = input.required<ChartPoint[]>();
  readonly from = input.required<number>();
  readonly to = input.required<number>();
  readonly color = input.required<string>();
  readonly label = input.required<string>();
  readonly unit = input('');
  readonly decimals = input(0);
  /** Two-state series (presence): step line, 0/1 axis. */
  readonly binary = input(false);

  protected readonly width = W;
  protected readonly height = H;
  protected readonly plotLeft = PAD.left;
  protected readonly plotRight = W - PAD.right;
  protected readonly baseline = H - PAD.bottom;

  protected readonly hovered = signal<number | null>(null);

  private readonly yDomain = computed<[number, number, number]>(() => {
    if (this.binary()) return [0, 1, 1];
    const values = this.points().map((p) => p.v);
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    if (lo === hi) {
      lo -= 1;
      hi += 1;
    }
    const step = niceStep((hi - lo) / 4);
    return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step, step];
  });

  private x(t: number): number {
    const span = this.to() - this.from() || 1;
    return PAD.left + ((t - this.from()) / span) * (W - PAD.left - PAD.right);
  }

  private y(v: number): number {
    const [lo, hi] = this.yDomain();
    return H - PAD.bottom - ((v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
  }

  protected readonly coords = computed(() =>
    this.points().map((p) => ({ ...p, x: this.x(p.t), y: this.y(p.v) })),
  );

  protected readonly yTicks = computed(() => {
    const [lo, hi, step] = this.yDomain();
    const ticks: { y: number; label: string }[] = [];
    for (let v = lo; v <= hi + step / 2; v += step) {
      ticks.push({ y: this.y(v), label: this.binary() ? (v ? 'Sí' : 'No') : String(+v.toFixed(2)) });
    }
    return ticks;
  });

  protected readonly xTicks = computed(() => {
    const count = 5;
    const span = this.to() - this.from();
    return Array.from({ length: count }, (_, i) => {
      const t = this.from() + (span * i) / (count - 1);
      return { x: this.x(t), label: utcTime(t), anchor: i === 0 ? 'start' : i === count - 1 ? 'end' : 'middle' };
    });
  });

  protected readonly linePath = computed(() => {
    const c = this.coords();
    if (!c.length) return '';
    if (!this.binary()) return c.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
    // Step line held until the end of the period.
    let d = `M${c[0].x},${c[0].y}`;
    for (let i = 1; i < c.length; i++) d += ` H${c[i].x} V${c[i].y}`;
    return `${d} H${this.plotRight}`;
  });

  protected readonly areaPath = computed(() => {
    const c = this.coords();
    if (!c.length) return '';
    const lastX = this.binary() ? this.plotRight : c[c.length - 1].x;
    return `${this.linePath()} L${lastX},${this.baseline} L${c[0].x},${this.baseline} Z`;
  });

  protected readonly peak = computed(() => {
    if (this.binary()) return null;
    const c = this.coords();
    return c.length ? c.reduce((max, p) => (p.v > max.v ? p : max)) : null;
  });

  protected readonly active = computed(() => {
    const i = this.hovered();
    return i === null ? null : (this.coords()[i] ?? null);
  });

  protected format(v: number): string {
    if (this.binary()) return v ? 'Presencia detectada' : 'Sin presencia';
    const n = v.toFixed(this.decimals());
    return this.unit() ? `${n} ${this.unit()}` : n;
  }

  protected readonly time = utcTime;

  protected onPointerMove(event: PointerEvent, svg: Element): void {
    const rect = svg.getBoundingClientRect();
    const xView = ((event.clientX - rect.left) / rect.width) * W;
    const c = this.coords();
    if (!c.length) return;
    let best = 0;
    for (let i = 1; i < c.length; i++) {
      if (Math.abs(c[i].x - xView) < Math.abs(c[best].x - xView)) best = i;
    }
    this.hovered.set(best);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const last = this.coords().length - 1;
    if (last < 0) return;
    const current = this.hovered() ?? last;
    const next =
      event.key === 'ArrowLeft' ? Math.max(0, current - 1)
      : event.key === 'ArrowRight' ? Math.min(last, current + 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    this.hovered.set(next);
  }
}
