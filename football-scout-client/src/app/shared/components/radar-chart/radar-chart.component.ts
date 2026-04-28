import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerStatDetail } from '../../../core/models/player.model';

export interface RadarDataset {
  label: string;
  values: number[];
  color: string;
}

const STAT_CONFIG: { typeId: number; label: string; max: number; valueKey?: string }[] = [
  { typeId: 52,  label: 'Goals',       max: 40   },
  { typeId: 79,  label: 'Assists',     max: 20   },
  { typeId: 42,  label: 'Shots',       max: 80   },
  { typeId: 86,  label: 'On Target',   max: 40   },
  { typeId: 78,  label: 'Tackles',     max: 100  },
  { typeId: 80,  label: 'Passes',      max: 1500 },
  { typeId: 116, label: 'Acc.Pass',    max: 1200 },
  { typeId: 117, label: 'Key Pass',    max: 60   },
  { typeId: 109, label: 'Dribbles',    max: 80   },
  { typeId: 100, label: 'Intercept',   max: 60   },
  { typeId: 118, label: 'Rating',      max: 10,  valueKey: 'average' },
  { typeId: 106, label: 'Duels Won',   max: 150  },
];

const PREFERRED_TYPE_IDS = [52, 79, 42, 78, 80, 117, 109, 100, 118, 106, 86, 116];

export function extractRadarData(details: PlayerStatDetail[]): { labels: string[]; values: number[] } {
  const labels: string[] = [];
  const values: number[] = [];
  const byTypeId = new Map(details.map(d => [d.type_id, d]));

  for (const typeId of PREFERRED_TYPE_IDS) {
    if (labels.length >= 6) break;
    const cfg = STAT_CONFIG.find(c => c.typeId === typeId);
    if (!cfg) continue;
    const detail = byTypeId.get(typeId);
    if (!detail) continue;
    const raw = cfg.valueKey ? (detail.value as any)[cfg.valueKey] : detail.value.total;
    if (raw == null || typeof raw !== 'number' || isNaN(raw)) continue;
    const pct = Math.min(100, Math.round((raw / cfg.max) * 100));
    labels.push(cfg.label);
    values.push(pct);
  }

  return { labels, values };
}

interface RadarPoint { x: number; y: number; }

@Component({
  selector: 'app-radar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (axes().length >= 3) {
      <div class="radar-outer">
        <svg [attr.viewBox]="viewBox" class="radar-svg" aria-hidden="true">
          <defs>
            <radialGradient [attr.id]="uid + '_fill'" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stop-color="#22c55e" stop-opacity="0.42"/>
              <stop offset="70%"  stop-color="#16a34a" stop-opacity="0.18"/>
              <stop offset="100%" stop-color="#16a34a" stop-opacity="0.04"/>
            </radialGradient>
            <filter [attr.id]="uid + '_glow'" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Shaded concentric rings -->
          @for (ring of rings; track ring; let ri = $index) {
            <polygon
              [attr.points]="gridPoints(ring)"
              fill="transparent"
              [class]="ring === 100 ? 'radar-ring radar-ring-outer' : 'radar-ring'"
              [attr.stroke-width]="ring === 100 ? '1.5' : '0.75'"
              [attr.stroke-dasharray]="ring < 100 ? '3,3' : ''"
            />
          }

          <!-- Ring % labels on top axis -->
          @for (ring of [25, 50, 75]; track ring) {
            <text
              [attr.x]="cx + 5"
              [attr.y]="cy - (ring / 100) * r + 3"
              class="ring-label"
            >{{ ring }}</text>
          }

          <!-- Axis spokes -->
          @for (ax of axes(); track ax.index) {
            <line
              [attr.x1]="cx" [attr.y1]="cy"
              [attr.x2]="ax.outerX" [attr.y2]="ax.outerY"
              class="radar-spoke" stroke-width="1"
            />
          }

          <!-- League avg polygon: dashed, rendered behind player -->
          @if (datasets.length > 1) {
            <polygon
              [attr.points]="dataPoints(datasets[1].values)"
              fill="rgba(107,114,128,0.07)"
              stroke="rgba(156,163,175,0.50)"
              stroke-width="1.5"
              stroke-dasharray="5,3"
              stroke-linejoin="round"
            />
          }

          <!-- Player polygon: radial gradient fill + outer glow -->
          @if (datasets.length >= 1) {
            <polygon
              [attr.points]="dataPoints(datasets[0].values)"
              [attr.fill]="'url(#' + uid + '_fill)'"
              stroke="#16a34a"
              stroke-width="2.5"
              stroke-linejoin="round"
              [attr.filter]="'url(#' + uid + '_glow)'"
            />
            <!-- Vertex: outer halo + inner dot -->
            @for (pt of dataPointList(datasets[0].values); track $index) {
              <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="6"   fill="rgba(34,197,94,0.14)" />
              <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5" class="radar-vertex-inner" stroke="#22c55e" stroke-width="2" />
            }
          }

          <!-- Axis labels -->
          @for (ax of axes(); track ax.index) {
            <text
              [attr.x]="ax.labelX"
              [attr.y]="ax.labelY"
              text-anchor="middle"
              dominant-baseline="middle"
              class="radar-label"
            >{{ ax.label }}</text>
          }
        </svg>

        <!-- Legend -->
        <div class="radar-legend">
          @for (ds of datasets; track ds.label; let i = $index) {
            <div class="legend-item">
              <span
                class="legend-swatch"
                [class.legend-swatch-dash]="i > 0"
                [style.background]="i === 0 ? ds.color : 'transparent'"
                [style.border-color]="ds.color"
              ></span>
              <span class="legend-name">{{ ds.label }}</span>
              @if (i === 0 && overallScore() !== null) {
                <span class="legend-score">{{ overallScore() }}</span>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .radar-outer { width: 100%; max-width: 360px; margin: 0 auto; }
    .radar-svg   { width: 100%; height: auto; display: block; }

    /* Grid rings — adaptive stroke for light/dark */
    .radar-ring       { stroke: rgba(15,23,42,0.10); }
    .radar-ring-outer { stroke: rgba(15,23,42,0.20); }
    .radar-spoke      { stroke: rgba(15,23,42,0.08); }
    .radar-vertex-inner { fill: #f8fafc; }

    :host-context([data-theme="dark"]) .radar-ring       { stroke: rgba(255,255,255,0.07); }
    :host-context([data-theme="dark"]) .radar-ring-outer { stroke: rgba(255,255,255,0.22); }
    :host-context([data-theme="dark"]) .radar-spoke      { stroke: rgba(255,255,255,0.09); }
    :host-context([data-theme="dark"]) .radar-vertex-inner { fill: #111214; }

    .radar-label {
      font-size: 10px;
      fill: #6b7280;
      font-family: 'Barlow Condensed', 'Inter', sans-serif;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .ring-label {
      font-size: 8px;
      fill: rgba(107,114,128,0.38);
      font-family: 'Inter', sans-serif;
      font-variant-numeric: tabular-nums;
    }

    .radar-legend {
      display: flex;
      justify-content: center;
      gap: 18px;
      margin-top: 10px;
      flex-wrap: wrap;
    }

    .legend-item { display: flex; align-items: center; gap: 7px; }

    .legend-swatch {
      display: block;
      width: 18px;
      height: 3px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .legend-swatch-dash {
      background: transparent !important;
      height: 0;
      border-top: 2px dashed;
      width: 16px;
    }

    .legend-name {
      font-size: 11px;
      color: #6b7280;
      font-family: 'Inter', sans-serif;
    }

    .legend-score {
      font-size: 11px;
      font-weight: 800;
      color: #16a34a;
      background: rgba(22,163,74,0.12);
      border: 1px solid rgba(22,163,74,0.28);
      padding: 1px 7px;
      border-radius: 4px;
      font-variant-numeric: tabular-nums;
      font-family: 'Inter', sans-serif;
    }
  `],
})
export class RadarChartComponent {
  @Input() labels: string[] = [];
  @Input() datasets: RadarDataset[] = [];

  private static _count = 0;
  readonly uid = `rc${++RadarChartComponent._count}`;

  readonly cx = 200;
  readonly cy = 200;
  readonly r  = 130;
  readonly labelPad = 26;
  readonly viewBox   = '0 0 400 400';
  readonly rings     = [25, 50, 75, 100];

  overallScore = computed(() => {
    const vals = this.datasets[0]?.values;
    if (!vals?.length) return null;
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  });

  axes = computed(() =>
    this.labels.map((label, i) => {
      const angle  = (2 * Math.PI / this.labels.length) * i - Math.PI / 2;
      const outerX = this.cx + this.r * Math.cos(angle);
      const outerY = this.cy + this.r * Math.sin(angle);
      const labelX = this.cx + (this.r + this.labelPad) * Math.cos(angle);
      const labelY = this.cy + (this.r + this.labelPad) * Math.sin(angle);
      return { label, index: i, outerX, outerY, labelX, labelY };
    })
  );

  gridPoints(pct: number): string {
    const n = this.labels.length;
    if (n < 3) return '';
    const rr = (pct / 100) * this.r;
    return Array.from({ length: n }, (_, i) => {
      const angle = (2 * Math.PI / n) * i - Math.PI / 2;
      return `${this.cx + rr * Math.cos(angle)},${this.cy + rr * Math.sin(angle)}`;
    }).join(' ');
  }

  dataPoints(values: number[]): string {
    return this.dataPointList(values).map(p => `${p.x},${p.y}`).join(' ');
  }

  dataPointList(values: number[]): RadarPoint[] {
    const n = this.labels.length;
    return values.slice(0, n).map((v, i) => {
      const angle = (2 * Math.PI / n) * i - Math.PI / 2;
      const rr    = (v / 100) * this.r;
      return { x: this.cx + rr * Math.cos(angle), y: this.cy + rr * Math.sin(angle) };
    });
  }
}
