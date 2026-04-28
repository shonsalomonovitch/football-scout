import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerStatDetail } from '../../../core/models/player.model';

interface StatBar { label: string; value: number; max: number; }

// Key metrics shown as big numbers at the top
const KPI_IDS: { typeId: number; label: string; valueKey?: string }[] = [
  { typeId: 321, label: 'Apps' },
  { typeId: 52,  label: 'Goals' },
  { typeId: 79,  label: 'Assists' },
  { typeId: 118, label: 'Rating', valueKey: 'average' },
  { typeId: 119, label: 'Minutes' },
];

// Attacking bars — left column
const ATTACKING: { typeId: number; label: string; max: number }[] = [
  { typeId: 42,  label: 'Shots Total',        max: 60  },
  { typeId: 86,  label: 'Shots on Target',    max: 30  },
  { typeId: 117, label: 'Key Passes',         max: 50  },
  { typeId: 580, label: 'Big Chances Created',max: 20  },
  { typeId: 109, label: 'Successful Dribbles',max: 80  },
  { typeId: 98,  label: 'Total Crosses',      max: 60  },
  { typeId: 116, label: 'Accurate Passes',    max: 800 },
];

// Defensive bars — right column
const DEFENSIVE: { typeId: number; label: string; max: number }[] = [
  { typeId: 78,  label: 'Tackles',      max: 80  },
  { typeId: 100, label: 'Interceptions',max: 60  },
  { typeId: 106, label: 'Duels Won',    max: 150 },
  { typeId: 56,  label: 'Fouls',        max: 60  },
  { typeId: 96,  label: 'Fouls Drawn',  max: 60  },
  { typeId: 101, label: 'Clearances',   max: 50  },
  { typeId: 107, label: 'Aerials Won',  max: 50  },
];

@Component({
  selector: 'app-player-stats-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-stats-panel.component.html',
  styleUrl: './player-stats-panel.component.css',
})
export class PlayerStatsPanelComponent {
  @Input() set details(val: PlayerStatDetail[]) {
    this._details.set(val ?? []);
  }

  private _details = signal<PlayerStatDetail[]>([]);

  private byId = computed(() => new Map(this._details().map(d => [d.type_id, d])));

  kpis = computed(() =>
    KPI_IDS.map(k => {
      const d = this.byId().get(k.typeId);
      if (!d) return null;
      const raw = k.valueKey ? (d.value as any)[k.valueKey] : d.value.total;
      if (raw == null) return null;
      return { label: k.label, value: typeof raw === 'number' && !Number.isInteger(raw) ? raw.toFixed(2) : String(raw) };
    }).filter(Boolean) as { label: string; value: string }[]
  );

  attackingBars = computed(() => this.buildBars(ATTACKING));
  defensiveBars = computed(() => this.buildBars(DEFENSIVE));

  private buildBars(cfg: typeof ATTACKING): StatBar[] {
    return cfg
      .map(c => {
        const d = this.byId().get(c.typeId);
        const val = d?.value?.total;
        if (val == null || typeof val !== 'number') return null;
        return { label: c.label, value: val, max: c.max };
      })
      .filter((b): b is StatBar => b !== null && b.value > 0);
  }

  barPct(bar: StatBar): number {
    return Math.min(100, Math.round((bar.value / bar.max) * 100));
  }
}
