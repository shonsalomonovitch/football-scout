import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-goal-scene',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="goal-scene" aria-hidden="true">

      <!-- ── Static SVG: pitch markings, goal frame, and player ── -->
      <svg class="scene-svg" viewBox="0 0 480 130" preserveAspectRatio="xMaxYMax meet">

        <!-- Grass stripes -->
        <rect x="0" y="100" width="480" height="30" fill="rgba(0,230,118,0.03)"/>
        <rect x="0" y="86"  width="480" height="14" fill="rgba(0,230,118,0.025)"/>
        <rect x="0" y="72"  width="480" height="14" fill="rgba(0,230,118,0.02)"/>

        <!-- Penalty area -->
        <rect x="0" y="60" width="90" height="70" fill="none"
          stroke="rgba(0,230,118,0.12)" stroke-width="1"/>
        <!-- Six-yard box -->
        <rect x="0" y="78" width="32" height="35" fill="none"
          stroke="rgba(0,230,118,0.08)" stroke-width="1"/>
        <!-- Penalty spot -->
        <circle cx="68" cy="112" r="2" fill="rgba(0,230,118,0.25)"/>
        <!-- Penalty arc -->
        <path d="M90,85 Q130,72 90,59" fill="none"
          stroke="rgba(0,230,118,0.10)" stroke-width="1"/>

        <!-- Ground line -->
        <line x1="0" y1="128" x2="480" y2="128"
          stroke="rgba(0,230,118,0.18)" stroke-width="1.5"/>

        <!-- ── Goal (right side) ── -->
        <rect class="goal-post" x="375" y="42" width="3.5" height="88" rx="1.5"/>
        <rect class="goal-post" x="452" y="42" width="3.5" height="88" rx="1.5"/>
        <rect class="goal-crossbar" x="375" y="42" width="81" height="3.5" rx="1.5"/>
        <!-- Net horizontal -->
        <line class="net-line" x1="378" y1="60"  x2="452" y2="60"  stroke-width="1"/>
        <line class="net-line" x1="378" y1="78"  x2="452" y2="78"  stroke-width="1"/>
        <line class="net-line" x1="378" y1="96"  x2="452" y2="96"  stroke-width="1"/>
        <line class="net-line" x1="378" y1="114" x2="452" y2="114" stroke-width="1"/>
        <!-- Net vertical -->
        <line class="net-line" x1="393" y1="46" x2="393" y2="130" stroke-width="1"/>
        <line class="net-line" x1="408" y1="46" x2="408" y2="130" stroke-width="1"/>
        <line class="net-line" x1="423" y1="46" x2="423" y2="130" stroke-width="1"/>
        <line class="net-line" x1="438" y1="46" x2="438" y2="130" stroke-width="1"/>
        <!-- Post shadow -->
        <rect x="375" y="42" width="2" height="88" rx="1" fill="rgba(0,0,0,0.15)"/>

        <!-- ── Player figure ── -->
        <g [class.kicking]="playerKicking" class="player-figure">

          <!-- Shadow on ground -->
          <ellipse cx="74" cy="127" rx="12" ry="2.5"
            fill="rgba(0,0,0,0.28)" class="player-shadow"/>

          <!-- Plant leg (left, static) -->
          <line class="player-limb" x1="68" y1="110" x2="62" y2="128"
            stroke-width="3.5" stroke-linecap="round"/>
          <!-- Plant foot -->
          <line class="player-limb" x1="62" y1="128" x2="56" y2="128"
            stroke-width="3" stroke-linecap="round"/>

          <!-- Torso (leaning forward) -->
          <line class="player-torso" x1="71" y1="95" x2="68" y2="110"
            stroke-width="5" stroke-linecap="round"/>

          <!-- Left arm (forward, balance) -->
          <line class="player-limb" x1="70" y1="99" x2="80" y2="107"
            stroke-width="2.5" stroke-linecap="round"/>
          <!-- Right arm (back) -->
          <line class="player-limb" x1="70" y1="99" x2="62" y2="106"
            stroke-width="2.5" stroke-linecap="round"/>

          <!-- Head -->
          <circle class="player-head" cx="72" cy="89" r="5.5"/>

          <!-- ── Kick leg (right) — animated around hip at (68, 110) ── -->
          <g class="kick-leg">
            <!-- Thigh -->
            <line class="player-limb" x1="68" y1="110" x2="74" y2="121"
              stroke-width="3.5" stroke-linecap="round"/>
            <!-- Shin -->
            <line class="player-limb" x1="74" y1="121" x2="78" y2="128"
              stroke-width="3" stroke-linecap="round"/>
            <!-- Boot (green accent — the kicking foot) -->
            <line x1="78" y1="128" x2="86" y2="127"
              stroke="rgba(22,163,74,0.90)" stroke-width="3.5" stroke-linecap="round"/>
          </g>

        </g>

      </svg>

      <!-- ── Ball (div, CSS animated) ── -->
      <div class="ball-wrap" [class.ball-flying]="playerKicking">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="#e2e8f0" stroke="rgba(0,0,0,0.30)" stroke-width="1"/>
          <path d="M12 3.5 l2.6 1.9 -1 3.1H10.4L9.4 5.4z"
            fill="rgba(15,15,25,0.68)" stroke-linejoin="round"/>
          <path d="M4.8 9.4 l2-1.5 2.3 1.6 -.9 2.8H5.6z"
            fill="rgba(15,15,25,0.55)"/>
          <path d="M19.2 9.4 l-2-1.5 -2.3 1.6 .9 2.8H18.4z"
            fill="rgba(15,15,25,0.55)"/>
          <line x1="9.4"  y1="5.4"  x2="4.8"  y2="9.4"  stroke="rgba(0,0,0,0.25)" stroke-width="0.8"/>
          <line x1="14.6" y1="5.4"  x2="19.2" y2="9.4"  stroke="rgba(0,0,0,0.25)" stroke-width="0.8"/>
          <line x1="10.4" y1="8.5"  x2="8.2"  y2="12.8" stroke="rgba(0,0,0,0.20)" stroke-width="0.8"/>
          <line x1="13.6" y1="8.5"  x2="15.8" y2="12.8" stroke="rgba(0,0,0,0.20)" stroke-width="0.8"/>
        </svg>
      </div>

      <!-- ── Net flash ── -->
      <div class="net-flash" [class.net-flashing]="netFlashing"></div>

      <!-- ── GOAL! text ── -->
      <div class="goal-text" [class.goal-visible]="goalVisible">GOAL!</div>

      <!-- ── Confetti ── -->
      @if (showConfetti) {
        <div class="confetti-wrap">
          @for (dot of confettiDots; track dot.id) {
            <div class="confetti-dot"
              [style.left.px]="dot.x"
              [style.top.px]="dot.y"
              [style.background]="dot.color"
              [style.animation-delay.ms]="dot.delay"
              [style.animation-duration.ms]="dot.duration">
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    /* ── Light mode SVG color tokens (default) ── */
    :host {
      --post-fill:    rgba(30, 41, 59, 0.65);
      --net-stroke:   rgba(30, 41, 59, 0.18);
      --player-limb:  rgba(51, 65, 85, 0.70);
      --player-torso: rgba(30, 41, 59, 0.75);
      --player-head:  rgba(30, 41, 59, 0.70);
    }

    /* ── Dark mode overrides ── */
    :host-context([data-theme="dark"]) {
      --post-fill:    rgba(240, 244, 255, 0.72);
      --net-stroke:   rgba(255, 255, 255, 0.14);
      --player-limb:  rgba(200, 210, 230, 0.75);
      --player-torso: rgba(200, 210, 230, 0.82);
      --player-head:  rgba(200, 210, 230, 0.78);
    }

    /* ── Apply tokens to SVG elements ── */
    .goal-post    { fill: var(--post-fill); }
    .goal-crossbar { fill: var(--post-fill); }
    .net-line     { stroke: var(--net-stroke); }
    .player-limb  { stroke: var(--player-limb); }
    .player-torso { stroke: var(--player-torso); }
    .player-head  { fill: var(--player-head); }

    /* ── Scene container ── */
    .goal-scene {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 480px;
      height: 130px;
      pointer-events: none;
      user-select: none;
    }

    .scene-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    /* ── Player figure ── */
    .player-shadow {
      transition: transform 0.1s ease;
    }

    /* Kick leg: pivot around the hip (68, 110) in SVG space */
    .kick-leg {
      transform-origin: 68px 110px;
      transform-box: view-box;
    }

    /* Wind-up then kick through */
    @keyframes kick-swing {
      0%   { transform: rotate(0deg); }
      18%  { transform: rotate(28deg); }   /* leg pulled back (wind-up) */
      55%  { transform: rotate(-42deg); }  /* kick: leg swings through ball */
      72%  { transform: rotate(-34deg); }  /* follow-through */
      100% { transform: rotate(0deg); }    /* settle */
    }

    .player-figure.kicking .kick-leg {
      animation: kick-swing 880ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    }

    /* ── Ball ── */
    .ball-wrap {
      position: absolute;
      left: 72px;       /* aligned to player's kicking foot */
      bottom: 2px;
      will-change: transform, opacity;
    }

    @keyframes ball-flight {
      0%    { transform: translate(0, 0) rotate(0deg);            opacity: 1; }
      22%   { transform: translate(60px, -68px) rotate(180deg);   opacity: 1; }
      50%   { transform: translate(160px, -55px) rotate(360deg);  opacity: 1; }
      78%   { transform: translate(265px, -38px) rotate(520deg);  opacity: 1; }
      92%   { transform: translate(320px, -28px) rotate(580deg);  opacity: 0.4; }
      100%  { transform: translate(340px, -26px) rotate(610deg);  opacity: 0; }
    }

    .ball-wrap.ball-flying {
      animation: ball-flight 900ms 200ms cubic-bezier(0.3, 0, 0.6, 1) both;
    }

    /* ── Net flash ── */
    .net-flash {
      position: absolute;
      right: 5px;
      top: 42px;
      width: 76px;
      height: 88px;
      background: radial-gradient(ellipse at center,
        rgba(0,230,118,0.40) 0%, rgba(0,230,118,0.05) 70%, transparent 100%);
      pointer-events: none;
      opacity: 0;
    }

    @keyframes net-flash-anim {
      0%   { opacity: 1; }
      25%  { opacity: 1; }
      100% { opacity: 0; }
    }

    .net-flash.net-flashing {
      animation: net-flash-anim 600ms 80ms ease both;
    }

    /* ── GOAL! text ── */
    .goal-text {
      position: absolute;
      right: 14px;
      top: 6px;
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--color-accent);
      text-shadow: 0 0 20px rgba(0,230,118,0.7), 0 0 40px rgba(0,230,118,0.3);
      will-change: transform, opacity;
      white-space: nowrap;
      opacity: 0;
      transform: scale(0.5) translateY(8px);
    }

    @keyframes goal-appear {
      0%   { opacity: 0; transform: scale(0.4) translateY(10px); }
      60%  { opacity: 1; transform: scale(1.15) translateY(-4px); }
      80%  { opacity: 1; transform: scale(1) translateY(0); }
      100% { opacity: 0; transform: scale(0.9) translateY(-4px); }
    }

    .goal-text.goal-visible {
      animation: goal-appear 1800ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    /* ── Confetti ── */
    .confetti-wrap {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .confetti-dot {
      position: absolute;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      animation: confetti-burst linear both;
    }

    @keyframes confetti-burst {
      0%   { transform: translate(0, 0) scale(1);   opacity: 1; }
      100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .goal-scene { width: 340px; height: 100px; opacity: 0.55; }
    }
    @media (max-width: 600px) {
      .goal-scene { display: none; }
    }
  `],
})
export class GoalSceneComponent implements OnInit, OnDestroy {
  playerKicking = false;
  goalVisible   = false;
  netFlashing   = false;
  showConfetti  = false;

  readonly confettiDots = Array.from({ length: 14 }, (_, i) => ({
    id:       i,
    x:        380 + Math.cos((i / 14) * Math.PI * 2) * 28,
    y:        85  + Math.sin((i / 14) * Math.PI * 2) * 20,
    color:    ['rgba(0,230,118,0.9)', 'rgba(74,222,128,0.85)', 'rgba(245,158,11,0.85)', 'rgba(240,244,255,0.75)'][i % 4],
    delay:    i * 30,
    duration: 600 + (i % 3) * 120,
  }));

  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    setTimeout(() => this.kick(), 1800);
    this.intervalId = setInterval(() => this.kick(), 5500);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  kick(): void {
    // Reset all states
    this.playerKicking = false;
    this.goalVisible   = false;
    this.netFlashing   = false;
    this.showConfetti  = false;

    // Frame break so CSS sees the reset before re-triggering
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.playerKicking = true;

        // Ball reaches goal at ~1100ms (200ms delay + 900ms flight)
        setTimeout(() => {
          this.goalVisible  = true;
          this.netFlashing  = true;
          this.showConfetti = true;

          setTimeout(() => {
            this.showConfetti = false;
          }, 1200);
        }, 1100);
      });
    });
  }
}
