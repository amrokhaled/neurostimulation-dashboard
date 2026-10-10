// ============================================================================
// ADAPTIVE CLOSED-LOOP NEUROSTIMULATION SYSTEM
// MONOCHROME DOT-MATRIX AESTHETIC + COLOR TRAIL ON MOUSE/HOVER (60 FPS ENGINE)
// ============================================================================

const state = {
  inWelcome: true,
  isZooming: false,
  activeTab: 'tab-story',
  mouseX: -1000,
  mouseY: -1000,
  tiltX: 0,
  tiltY: 0,
  targetTiltX: 0,
  targetTiltY: 0,
  simMode: 'calm',
  epicaMode: 'clean',
  debounceWindow: [0, 0, 0, 0, 0],
  tick: 0
};

// Track which canvas/container is hovered so canvases ignite with color on hover
const hoveredCanvases = new Set();

// ── 6 Callout Pills Around the Dot-Matrix Brain (Matching Reference Image) ───
const HOTSPOT_NODES = [
  {
    bx: -0.58, by: -0.34,
    pillSide: 'left', pillYOffset: -135,
    shortLabel: '0.5–50 Hz Filter',
    color: '#00e5ff',
    tag: 'PREFRONTAL CORTEX • EPIC A',
    title: '0.5–50 Hz Bandpass (No 60 Hz Notch)',
    desc: 'Cleans 22 unified EEG channels and automatically eliminates the 60 Hz US mains hum without wasting MCU cycles on a Notch filter.',
    stat: '22 Bipolar Channels @ 256 Hz'
  },
  {
    bx: -0.62, by: 0.04,
    pillSide: 'left', pillYOffset: 0,
    shortLabel: '16 / 4 / 4 Split',
    color: '#fbbf24',
    tag: 'FRONTAL LOBE • ZERO LEAKAGE',
    title: 'Strict Patient-Wise Split (16 / 4 / 4)',
    desc: 'Partitions all 24 CHB-MIT patients strictly by person so the AI learns real seizure morphology instead of memorizing patient background.',
    stat: 'Automated CI Leakage Guardrail'
  },
  {
    bx: -0.32, by: 0.36,
    pillSide: 'left', pillYOffset: 135,
    shortLabel: 'LIF SNN Core',
    color: '#d62976',
    tag: 'TEMPORAL LOBE • EPIC B SNN',
    title: '154 → 128 → 64 → 2 LIF Network',
    desc: 'Encodes 154 features into 25-step binary spike trains processed by Leaky Integrate-and-Fire layers (β = 0.9) trained with 349:1 Weighted BCE.',
    stat: 'T = 25 Steps • β = 0.9 Leak'
  },
  {
    bx: 0.48, by: -0.36,
    pillSide: 'right', pillYOffset: -135,
    shortLabel: '100% Event Recall',
    color: '#00e5ff',
    tag: 'PARIETAL LOBE • CLINICAL VALIDATION',
    title: '100% Clinical Event Recall (46 / 46)',
    desc: 'While isolated 2s window recall was 23%, evaluating complete clinical seizures proved the SNN detected all 46 unseen seizure events.',
    stat: 'SNN: 100% (46/46) vs RF: 97.8%'
  },
  {
    bx: 0.64, by: 0.02,
    pillSide: 'right', pillYOffset: 0,
    shortLabel: 'INT8 • 27.4 KB',
    color: '#d62976',
    tag: 'OCCIPITAL LOBE • CORTEX-M7 SILICON',
    title: 'Symmetric INT8 Quantization (27.4 KB)',
    desc: 'Compresses 28,032 FP32 weights into 28,032 bytes (5.3% of SRAM) with ΔF1 = −0.000036 and 0.61 ms inference latency.',
    stat: '0.61 ms Latency (80× Headroom)'
  },
  {
    bx: 0.38, by: 0.46,
    pillSide: 'right', pillYOffset: 135,
    shortLabel: '3-in-5s Safety',
    color: '#fbbf24',
    tag: 'CEREBELLUM • SAFETY ENFORCER',
    title: 'Temporal False-Alarm Blocker',
    desc: 'Suppresses the 147 raw false alarms/hr by requiring ≥3 positive detections within 5 seconds before waking the RL controller and safety shield.',
    stat: 'Independent Hardware Safety Shield'
  }
];

const REPORT_FIGURES = [
  { src: 'assets/figures/chb01_03_psd.png', title: 'Epic A Fig. 1 — 60 Hz Mains Hum (PSD)', desc: 'PSD of raw channel FP1-F7 showing the 60 Hz powerline spike, auto-removed by our 50 Hz upper cutoff.' },
  { src: 'assets/figures/raw_vs_filtered_example.png', title: 'Epic A Fig. 2 — Raw vs. Filtered EEG', desc: 'Top: raw noisy signal. Bottom: clean 0.5–50 Hz bandpass-filtered signal.' },
  { src: 'assets/figures/seizure_vs_nonseizure_example.png', title: 'Epic A Fig. 3 — Non-Seizure vs. Seizure', desc: 'Calm interictal background (Class 0) vs. high-amplitude ictal discharges (Class 1).' },
  { src: 'assets/figures/epic_b_fig_1.png', title: 'Epic B Fig. 1 — Closed-Loop Pipeline', desc: 'Complete signal flow from EEG sensing and 7-feature extraction to INT8 SNN inference and temporal decision logic.' },
  { src: 'assets/figures/epic_b_fig_2.png', title: 'Epic B Fig. 2 — Training Convergence', desc: 'Training loss and validation F1-score across epochs under 349:1 Weighted BCE.' },
  { src: 'assets/figures/spike_raster_example.png', title: 'Epic B Fig. 3 — Spike Raster (154 × 25)', desc: 'Rate-coded spike representation of 154 normalized features over T=25 simulation steps.' },
  { src: 'assets/figures/epic_b_fig_4.png', title: 'Epic B Fig. 4 — Window ROC & PR Curves', desc: 'Statistical comparison between Random Forest and SNN at window level.' },
  { src: 'assets/figures/epic_b_fig_5.png', title: 'Epic B Fig. 5 — AWGN Noise Sensitivity', desc: 'SNN recall across Signal-to-Noise Ratios under simulated electrode noise.' },
  { src: 'assets/figures/epic_b_fig_6.png', title: 'Epic B Fig. 6 — Missing Channel Stress', desc: 'Effect of simulated electrode dropout on seizure detection recall.' },
  { src: 'assets/figures/epic_b_fig_7.png', title: 'Epic B Fig. 7 — Robustness RF vs. SNN', desc: 'Side-by-side degradation comparison under signal degradation scenarios.' }
];

// ── Anatomical Brain Silhouette & Internal Folds ─────────────────────────────
const BRAIN_OUTLINE = [
  [-0.82, 0.04], [-0.84, -0.12], [-0.78, -0.28], [-0.66, -0.44],
  [-0.48, -0.58], [-0.26, -0.68], [-0.02, -0.73], [0.24, -0.71],
  [0.48, -0.62], [0.68, -0.46], [0.80, -0.26], [0.84, -0.04],
  [0.78, 0.16], [0.64, 0.28], [0.68, 0.42], [0.58, 0.56],
  [0.38, 0.60], [0.22, 0.54], [0.16, 0.76], [0.04, 0.88],
  [-0.08, 0.86], [-0.06, 0.58], [-0.14, 0.42], [-0.34, 0.44],
  [-0.50, 0.34], [-0.54, 0.18], [-0.68, 0.18], [-0.78, 0.14]
];

const CORTICAL_FOLDS = [
  [[-0.52, 0.16], [-0.32, 0.08], [-0.08, 0.02], [0.18, -0.06], [0.42, -0.12]],
  [[-0.38, -0.18], [-0.16, -0.28], [0.12, -0.28], [0.36, -0.16], [0.28, 0.08]],
  [[-0.04, -0.68], [-0.08, -0.38], [-0.02, -0.08], [0.06, 0.22]],
  [[-0.62, -0.05], [-0.42, -0.32], [-0.18, -0.48], [0.18, -0.50], [0.52, -0.34], [0.64, -0.06]]
];

function pointInBrain(px, py) {
  let inside = false;
  for (let i = 0, j = BRAIN_OUTLINE.length - 1; i < BRAIN_OUTLINE.length; j = i++) {
    const [xi, yi] = BRAIN_OUTLINE[i], [xj, yj] = BRAIN_OUTLINE[j];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi + 1e-9) + xi)) inside = !inside;
  }
  return inside;
}

// ============================================================================
// 1. STIPPLED DOT-MATRIX BRAIN + ORTHOGONAL CALLOUT PILLS (WELCOME SCREEN)
// ============================================================================
const brainDots = [];
const calloutBoxes = [];
let activeCalloutIdx = -1;

function initWelcomeNeuralScene() {
  brainDots.length = 0;
  const pal = ['#00e5ff', '#d62976', '#fbbf24', '#7b5cff'];

  // 1. Structured Stippled Matrix Grid inside the Brain Silhouette (like the reference image!)
  const stepX = 0.052;
  const stepY = 0.052;
  let idxCounter = 0;

  for (let by = -0.78; by <= 0.90; by += stepY) {
    for (let bx = -0.86; bx <= 0.86; bx += stepX) {
      // Slight organic hex offset on alternate rows
      const ox = bx + ((Math.round(by / stepY) % 2) * stepX * 0.5);
      const oy = by;
      if (pointInBrain(ox, oy)) {
        const distCenter = Math.hypot(ox * 0.85, oy * 0.85);
        // 3D hemispherical dome depth
        const bz = Math.sqrt(Math.max(0.02, 1 - distCenter * distCenter)) * 0.45;
        // Assign nearest hotspot index so hovering a callout lights up its lobe
        let nearestHotspot = 0;
        let minD = 999;
        HOTSPOT_NODES.forEach((h, hIdx) => {
          const d = Math.hypot(ox - h.bx, oy - h.by);
          if (d < minD) { minD = d; nearestHotspot = hIdx; }
        });

        brainDots.push({
          bx: ox,
          by: oy,
          bz,
          x: 0,
          y: 0,
          baseAlpha: Math.max(0.18, Math.min(0.95, (1 - distCenter * 0.65))),
          r: distCenter < 0.35 ? 2.1 : 1.65,
          phase: idxCounter * 0.15,
          heat: 0, // 0 = monochrome white/silver, >0 = glowing colored trail!
          color: HOTSPOT_NODES[nearestHotspot].color,
          lobeIdx: nearestHotspot
        });
        idxCounter++;
      }
    }
  }

  // 2. Dense Contour Ring Dots along Brain Outline & Cortical Folds for sharp anatomical definition
  for (let i = 0; i < BRAIN_OUTLINE.length; i++) {
    const p1 = BRAIN_OUTLINE[i];
    const p2 = BRAIN_OUTLINE[(i + 1) % BRAIN_OUTLINE.length];
    for (let s = 0; s < 4; s++) {
      const t = s / 4;
      const ox = p1[0] + (p2[0] - p1[0]) * t;
      const oy = p1[1] + (p2[1] - p1[1]) * t;
      let nearestHotspot = 0, minD = 999;
      HOTSPOT_NODES.forEach((h, hIdx) => {
        const d = Math.hypot(ox - h.bx, oy - h.by);
        if (d < minD) { minD = d; nearestHotspot = hIdx; }
      });
      brainDots.push({
        bx: ox, by: oy, bz: 0.08,
        x: 0, y: 0,
        baseAlpha: 0.85,
        r: 1.9,
        phase: i + s,
        heat: 0,
        color: pal[(i + s) % pal.length],
        lobeIdx: nearestHotspot
      });
    }
  }
}

function checkNodeHover(mx, my) {
  if (!state.inWelcome || state.isZooming) return;

  let matchedIdx = -1;
  // Check if hovering over any of the 6 Callout Pills or their Brain Anchor points
  for (let i = 0; i < calloutBoxes.length; i++) {
    const cb = calloutBoxes[i];
    const inPill = mx >= cb.x && mx <= cb.x + cb.w && my >= cb.y && my <= cb.y + cb.h;
    const inAnchor = Math.hypot(mx - cb.ax, my - cb.ay) < 26;
    if (inPill || inAnchor) {
      matchedIdx = i;
      break;
    }
  }

  activeCalloutIdx = matchedIdx;
  const popup = document.getElementById('nodePopup');
  const welcomeEl = document.getElementById('welcomeScreen');
  if (welcomeEl) welcomeEl.style.cursor = matchedIdx !== -1 ? 'pointer' : 'default';

  if (matchedIdx !== -1) {
    const hn = HOTSPOT_NODES[matchedIdx];
    const cb = calloutBoxes[matchedIdx];
    document.getElementById('npTag').textContent = hn.tag;
    document.getElementById('npTag').style.color = hn.color;
    document.getElementById('npTitle').textContent = hn.title;
    document.getElementById('npDesc').textContent = hn.desc;
    document.getElementById('npStat').textContent = hn.stat + '  •  Click to Open Section →';
    popup.style.borderLeftColor = hn.color;

    const popX = cb.pillSide === 'left' ? Math.max(20, cb.x - 10) : Math.min(window.innerWidth - 300, cb.x - 150);
    const popY = Math.min(window.innerHeight - 190, Math.max(20, cb.y + cb.h + 10));
    popup.style.left = `${popX}px`;
    popup.style.top = `${popY}px`;
    popup.classList.add('visible');
  } else {
    if (popup) popup.classList.remove('visible');
  }
}

function drawWelcomeNeuralScene() {
  if (!state.inWelcome) return;
  const canvas = document.getElementById('neuralCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const isMobile = w <= 900;
  const cx = w / 2;
  const cy = isMobile ? 265 : h / 2 + 24;
  const rx = isMobile ? Math.min(w * 0.36, 138) : Math.min(w * 0.22, 265);
  const ry = isMobile ? 105 : Math.min(h * 0.29, 235);

  // Subtle 3D tilt following cursor
  const autoYaw = Math.sin(state.tick * 0.01) * 0.12;
  state.tiltY += (state.targetTiltY + autoYaw - state.tiltY) * 0.06;
  state.tiltX += (state.targetTiltX - state.tiltX) * 0.06;

  const cosY = Math.cos(state.tiltY), sinY = Math.sin(state.tiltY);
  const cosX = Math.cos(state.tiltX), sinX = Math.sin(state.tiltX);

  // 1. Soft Monochrome White Inner Core Glow (Just like the Reference Image!)
  const coreGlow = ctx.createRadialGradient(cx, cy - 10, 8, cx, cy - 10, rx * 0.95);
  if (activeCalloutIdx !== -1) {
    const cCol = HOTSPOT_NODES[activeCalloutIdx].color;
    coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    coreGlow.addColorStop(0.45, cCol === '#00e5ff' ? 'rgba(0, 229, 255, 0.12)' : cCol === '#d62976' ? 'rgba(214, 41, 118, 0.12)' : 'rgba(251, 191, 36, 0.12)');
    coreGlow.addColorStop(1, 'transparent');
  } else {
    coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.20)');
    coreGlow.addColorStop(0.45, 'rgba(255, 255, 255, 0.05)');
    coreGlow.addColorStop(1, 'transparent');
  }
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(cx, cy - 10, rx * 0.95, 0, Math.PI * 2);
  ctx.fill();

  // 2. Project Stippled Brain Dots & Update Mouse Trail Heat
  const heatedDots = [];

  for (let i = 0; i < brainDots.length; i++) {
    const d = brainDots[i];
    // 3D rotation
    const x1 = d.bx * cosY - d.bz * sinY;
    const z1 = d.bz * cosY + d.bx * sinY;
    const y2 = d.by * cosX - z1 * sinX;

    if (state.isZooming) {
      d.x += (d.x - cx) * 0.09;
      d.y += (d.y - cy) * 0.09;
    } else {
      d.x = cx + x1 * rx;
      d.y = cy + y2 * ry;
    }

    // Check distance to mouse cursor for Color Trail Ignition!
    const distMouse = Math.hypot(d.x - state.mouseX, d.y - state.mouseY);
    if (distMouse < 95) {
      d.heat = Math.min(1, d.heat + (1 - distMouse / 95) * 0.38);
    } else if (activeCalloutIdx === d.lobeIdx) {
      d.heat = Math.min(1, d.heat + 0.18);
    } else {
      // Smooth trail decay so color lingers behind the mouse and fades back to monochrome white
      d.heat *= 0.945;
    }

    if (d.heat > 0.08) {
      heatedDots.push(d);
    }
  }

  // 3. Connect Heated Dots Near Cursor with Colored Synaptic Sparks
  for (let i = 0; i < heatedDots.length; i++) {
    const a = heatedDots[i];
    for (let j = i + 1; j < heatedDots.length; j++) {
      const b = heatedDots[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 32) {
        ctx.strokeStyle = a.color;
        ctx.globalAlpha = Math.min(a.heat, b.heat) * (1 - dist / 32) * 0.55;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;

  // 4. Draw Stippled Brain Dots (Monochrome White/Silver by default, Colored where heated!)
  for (let i = 0; i < brainDots.length; i++) {
    const d = brainDots[i];
    const pulse = Math.sin(state.tick * 0.04 + d.phase) * 0.12;

    if (d.heat > 0.04) {
      ctx.fillStyle = d.color;
      ctx.globalAlpha = Math.min(1, d.baseAlpha + d.heat * 0.5);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r + d.heat * 1.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.max(0.15, d.baseAlpha + pulse);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // 5. Draw the 6 Orthogonal Callout Pills Around the Brain (On desktop/tablet >= 760px)
  calloutBoxes.length = 0;
  if (w < 760) return;

  const pillW = 132;
  const pillH = 32;

  HOTSPOT_NODES.forEach((hn, idx) => {
    const ax = cx + hn.bx * rx;
    const ay = cy + hn.by * ry;
    const isHov = activeCalloutIdx === idx || Math.hypot(state.mouseX - ax, state.mouseY - ay) < 55;

    const pillX = hn.pillSide === 'left' ? cx - rx - 165 : cx + rx + 35;
    const pillY = cy + hn.pillYOffset - pillH / 2;

    calloutBoxes.push({ x: pillX, y: pillY, w: pillW, h: pillH, ax, ay, pillSide: hn.pillSide });

    // Orthogonal Elbow Connector Wire
    const wireStartX = hn.pillSide === 'left' ? pillX + pillW : pillX;
    const wireStartY = pillY + pillH / 2;
    const elbowX = hn.pillSide === 'left' ? wireStartX + 26 : wireStartX - 26;

    ctx.strokeStyle = isHov ? hn.color : 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = isHov ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(wireStartX, wireStartY);
    ctx.lineTo(elbowX, wireStartY);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // Anchor node on Brain
    ctx.fillStyle = isHov ? hn.color : '#ffffff';
    ctx.beginPath();
    ctx.arc(ax, ay, isHov ? 4.5 : 3, 0, Math.PI * 2);
    ctx.fill();

    // Dark Minimalist Callout Pill Box
    ctx.fillStyle = isHov ? 'rgba(20, 20, 28, 0.95)' : 'rgba(16, 16, 20, 0.88)';
    ctx.strokeStyle = isHov ? hn.color : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = isHov ? 1.4 : 1;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 6);
    ctx.fill();
    ctx.stroke();

    // Label inside Callout Pill
    ctx.fillStyle = isHov ? hn.color : 'rgba(255, 255, 255, 0.72)';
    ctx.font = '600 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(hn.shortLabel, pillX + pillW / 2, pillY + 20);
  });
}

// ============================================================================
// TRANSITIONS & NAVIGATION (ZERO LAG)
// ============================================================================
function zoomIntoDashboard(targetTabId) {
  if (state.isZooming) return;
  state.isZooming = true;
  document.getElementById('nodePopup')?.classList.remove('visible');
  const welcome = document.getElementById('welcomeScreen');
  const dash = document.getElementById('dashboardWrapper');

  if (targetTabId && typeof targetTabId === 'string') {
    openDashTab(targetTabId);
  }

  welcome.classList.add('zooming-in');
  dash.classList.add('active');

  setTimeout(() => dash.classList.add('visible'), 120);
  setTimeout(() => {
    state.inWelcome = false;
    state.isZooming = false;
    welcome.classList.add('hidden');
  }, 680);
}

function zoomBackToWelcome() {
  const welcome = document.getElementById('welcomeScreen');
  const dash = document.getElementById('dashboardWrapper');
  dash.classList.remove('visible');
  welcome.classList.remove('hidden');

  setTimeout(() => {
    welcome.classList.remove('zooming-in');
    state.inWelcome = true;
    dash.classList.remove('active');
  }, 200);
}

function openDashTab(tabId, btnEl) {
  state.activeTab = tabId;
  document.querySelectorAll('.dash-tab-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.dash-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    const tabMap = { 'tab-story': 0, 'tab-epica': 1, 'tab-epicb': 2, 'tab-sim': 3, 'tab-figs': 4 };
    const btns = document.querySelectorAll('.dash-nav-btn');
    if (btns[tabMap[tabId]]) btns[tabMap[tabId]].classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// TAB 01: ICU MONITOR + BRAIN SEIZURE SHOWDOWN (MONOCHROME -> COLOR ON HOVER)
// ============================================================================
let showdown = { active: true, phase: 0 };

function triggerShowdown() {
  showdown.active = true;
  showdown.phase = 0;
  document.getElementById('seizureTriggerBtn')?.classList.add('active');
  document.getElementById('calmBaselineBtn')?.classList.remove('active');
}

function resetShowdown() {
  showdown.active = false;
  showdown.phase = 0;
  document.getElementById('seizureTriggerBtn')?.classList.remove('active');
  document.getElementById('calmBaselineBtn')?.classList.add('active');
  ['cls1', 'cls2', 'cls3', 'cls4'].forEach(id =>
    document.getElementById(id)?.classList.remove('cl-active', 'cl-done')
  );
  const sL = document.getElementById('sdStatusLeft');
  const sR = document.getElementById('sdStatusRight');
  if (sL) { sL.textContent = 'CALM INTERICTAL BASELINE'; sL.style.color = ''; }
  if (sR) { sR.textContent = 'STANDBY MONITORING (0.61 ms)'; sR.style.color = ''; }
}

function drawBrainAnd3ChEEG(canvas, panelType, phaseState, tick, debounceHits, isHovered) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth || 520);
  const h = (canvas.height = 235);
  const isCompact = w < 460;
  ctx.clearRect(0, 0, w, h);

  // Subtle Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  for (let y = 20; y < h; y += 28) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  const isSeizing = phaseState === 'seizure' || phaseState === 'debounce';
  const isStim = phaseState === 'stim';
  const isQuenched = phaseState === 'quenched';

  // Monochrome Silver/White by default; Vibrant Color when hovered or on mobile!
  const coloredTone = isSeizing ? '#d62976' : isStim ? '#fbbf24' : '#00e5ff';
  const monoTone = isSeizing ? '#ffffff' : isStim ? '#e4e4e7' : '#a1a1aa';
  const mainColor = isHovered ? coloredTone : monoTone;

  // 1. Mini Brain Map (Left 34%)
  const bx = w * 0.17;
  const by = h * 0.47;
  const rx = Math.min(w * 0.13, 66);
  const ry = Math.min(h * 0.33, 60);

  ctx.beginPath();
  BRAIN_OUTLINE.forEach((pt, idx) => {
    const px = bx + pt[0] * rx;
    const py = by + pt[1] * ry;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Internal cortical folds
  ctx.strokeStyle = isHovered ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  CORTICAL_FOLDS.forEach(fold => {
    ctx.beginPath();
    fold.forEach((pt, idx) => {
      const px = bx + pt[0] * rx;
      const py = by + pt[1] * ry;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  });

  // Temporal lobe focus rings
  const focusX = bx - rx * 0.18;
  const focusY = by + ry * 0.16;
  if (isSeizing || isStim) {
    for (let r = 0; r < 3; r++) {
      const rad = isStim
        ? 48 - ((tick * 1.6 + r * 16) % 44)
        : ((tick * 1.3 + r * 16) % 48) + 4;
      ctx.strokeStyle = mainColor;
      ctx.globalAlpha = Math.max(0.1, 1 - rad / 52);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(focusX, focusY, Math.max(4, rad), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  ctx.font = `600 ${isCompact ? '7.5px' : '9px'} Montserrat, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = mainColor;
  ctx.fillText(
    isSeizing ? (panelType === 'left' ? (isCompact ? '100% CORTEX' : 'SPREAD: 100% CORTEX') : `HITS: ${debounceHits}/5`) :
    (isStim ? '⚡ PULSE' : 'NORMAL'),
    bx, h - 16
  );

  // Divider
  const divX = w * 0.34;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.moveTo(divX, 14); ctx.lineTo(divX, h - 14); ctx.stroke();

  // 2. 3-Channel Hospital EEG Traces (Right 66%)
  const channels = [
    { name: 'FP1-F7', yCenter: h * 0.25, phaseOff: 0.0 },
    { name: 'F7-T7',  yCenter: h * 0.53, phaseOff: 1.7 },
    { name: 'T7-P7',  yCenter: h * 0.81, phaseOff: 3.3 }
  ];

  const traceX0 = w * (isCompact ? 0.46 : 0.43);
  const traceW = w - traceX0 - 10;

  channels.forEach(ch => {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `600 ${isCompact ? '7.5px' : '9px'} Montserrat, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(ch.name, divX + 5, ch.yCenter + 3);

    ctx.beginPath();
    for (let x = 0; x <= traceW; x += 2) {
      const t = (x + tick * 2.4) * 0.048 + ch.phaseOff;
      let dy = Math.sin(t * 1.4) * 4.5 + Math.cos(t * 2.9) * 2.5;

      if (isSeizing) {
        const spike = Math.pow(Math.abs(Math.sin(t * 3.8)), 5) * 21 * (Math.sin(t * 3.8) > 0 ? 1 : -1);
        dy = spike + Math.sin(t * 9.5) * 7 + Math.cos(t * 15.0) * 4;
      } else if (isStim) {
        if (x < traceW * 0.55) {
          const sq = Math.sin(x * 0.65 - tick * 0.45) > 0 ? 15 : -15;
          dy = sq * (1 - x / (traceW * 0.65));
        } else {
          dy = Math.sin(t * 1.4) * 4.5 + Math.cos(t * 2.9) * 2.5;
        }
      }

      const px = traceX0 + x;
      const py = ch.yCenter + dy;
      if (x === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  if (isStim || (isQuenched && panelType === 'right')) {
    ctx.fillStyle = 'rgba(18, 18, 24, 0.9)';
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1;
    ctx.fillRect(traceX0, 10, traceW, 20);
    ctx.strokeRect(traceX0, 10, traceW, 20);
    ctx.fillStyle = mainColor;
    ctx.font = `700 ${isCompact ? '7.5px' : '8.5px'} Montserrat, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(
      isStim
        ? (isCompact ? '⚡ COUNTER-PULSE ACTIVE' : '⚡ BIPHASIC COUNTER-STIMULATION PULSE ACTIVE')
        : (isCompact ? '✓ SEIZURE SUPPRESSED' : '✓ SEIZURE SUPPRESSED • NORMAL RHYTHM RESTORED'),
      traceX0 + traceW / 2, 23
    );
  }
}

function drawShowdownCanvases() {
  const eegLeft = document.getElementById('eegLeft');
  const eegRight = document.getElementById('eegRight');
  if (!eegLeft) return;

  const isHov = hoveredCanvases.has('showdown') || window.innerWidth <= 900;
  const sL = document.getElementById('sdStatusLeft');
  const sR = document.getElementById('sdStatusRight');
  const steps = ['cls1', 'cls2', 'cls3', 'cls4'].map(id => document.getElementById(id));

  if (!showdown.active) {
    drawBrainAnd3ChEEG(eegLeft, 'left', 'calm', state.tick, 0, isHov);
    drawBrainAnd3ChEEG(eegRight, 'right', 'calm', state.tick, 0, isHov);
    return;
  }

  showdown.phase = (showdown.phase + 1) % 380;
  const p = showdown.phase;

  if (p < 45) {
    drawBrainAnd3ChEEG(eegLeft, 'left', 'calm', state.tick, 0, isHov);
    if (sL) { sL.textContent = 'PRE-ICTAL BASELINE'; sL.style.color = ''; }
  } else {
    drawBrainAnd3ChEEG(eegLeft, 'left', 'seizure', state.tick, 0, isHov);
    if (sL) { sL.textContent = '⚠ UNCONTROLLED ICTAL SEIZURE'; sL.style.color = isHov ? '#d62976' : '#ffffff'; }
  }

  steps.forEach(el => el?.classList.remove('cl-active', 'cl-done'));

  if (p < 45) {
    drawBrainAnd3ChEEG(eegRight, 'right', 'calm', state.tick, 0, isHov);
    if (sR) { sR.textContent = 'MONITORING 22 CHANNELS (0.61 ms)...'; sR.style.color = ''; }
  } else if (p < 140) {
    const hits = Math.min(3, Math.floor((p - 45) / 30) + 1);
    drawBrainAnd3ChEEG(eegRight, 'right', 'debounce', state.tick, hits, isHov);
    if (sR) {
      sR.textContent = `SEIZURE ONSET → DEBOUNCER: ${hits} / 5 HITS`;
      sR.style.color = isHov ? '#d62976' : '#ffffff';
    }
    if (hits === 1) steps[0]?.classList.add('cl-active');
    else { steps[0]?.classList.add('cl-done'); steps[1]?.classList.add('cl-active'); }
  } else if (p < 230) {
    drawBrainAnd3ChEEG(eegRight, 'right', 'stim', state.tick, 3, isHov);
    if (sR) {
      sR.textContent = '⚡ SAFETY VERIFIED → DELIVERING COUNTER-PULSE';
      sR.style.color = isHov ? '#fbbf24' : '#ffffff';
    }
    steps[0]?.classList.add('cl-done');
    steps[1]?.classList.add('cl-done');
    if (p < 175) steps[2]?.classList.add('cl-active');
    else { steps[2]?.classList.add('cl-done'); steps[3]?.classList.add('cl-active'); }
  } else {
    drawBrainAnd3ChEEG(eegRight, 'right', 'quenched', state.tick, 3, isHov);
    if (sR) {
      sR.textContent = '✓ SEIZURE QUENCHED — NORMAL BRAINWAVE RESTORED';
      sR.style.color = isHov ? '#00e5ff' : '#ffffff';
    }
    steps.forEach(el => el?.classList.add('cl-done'));
  }
}

// ============================================================================
// TAB 02: EPIC A FILTER & 2.0s WINDOW VISUALIZER
// ============================================================================
function setEpicAMode(mode) {
  state.epicaMode = mode;
  document.getElementById('epicaRawBtn')?.classList.toggle('active', mode === 'raw');
  document.getElementById('epicaCleanBtn')?.classList.toggle('active', mode === 'clean');
}

function drawEpicAPipelineCanvas() {
  const canvas = document.getElementById('epicaPipelineCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth || 880);
  const isStacked = w < 640;
  const h = (canvas.height = isStacked ? 360 : 220);
  ctx.clearRect(0, 0, w, h);

  const isRaw = state.epicaMode === 'raw';
  const isHov = hoveredCanvases.has('epica') || window.innerWidth <= 900;
  const mainCol = isHov ? (isRaw ? '#d62976' : '#00e5ff') : '#ffffff';
  const accentCol = isHov ? '#fbbf24' : '#a1a1aa';

  const splitX = isStacked ? w : w * 0.62;

  ctx.fillStyle = mainCol;
  ctx.font = `700 ${isStacked ? '8.5px' : '10px'} Montserrat, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(
    isRaw
      ? (isStacked ? '01 / RAW EEG STREAM (WITH 60 Hz HUM)' : '01 / RAW BOSTON EEG STREAM (WITH 60 Hz POWERLINE HUM)')
      : (isStacked ? '01 / CLEAN 0.5–50 Hz STREAM + 2.0s WINDOW' : '01 / CLEAN 0.5–50 Hz STREAM + 2.0s SLIDING WINDOW (50% OVERLAP)'),
    16, 22
  );

  const winW = isStacked ? Math.min(110, w * 0.36) : 125;
  const streamW = Math.max(winW + 10, splitX - 32);
  const winX = 16 + ((state.tick * 1.1) % (streamW - winW));
  const prevWinX = Math.max(16, winX - winW * 0.5);
  const boxH = isStacked ? 124 : 142;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(prevWinX, 36, winW, boxH);
  ctx.setLineDash([]);

  ctx.fillStyle = isHov ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)';
  ctx.strokeStyle = mainCol;
  ctx.lineWidth = 1.4;
  ctx.fillRect(winX, 36, winW, boxH);
  ctx.strokeRect(winX, 36, winW, boxH);

  ctx.fillStyle = mainCol;
  ctx.font = '700 8px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('2.0s WINDOW', winX + winW / 2, 50);
  ctx.fillStyle = accentCol;
  ctx.fillText('154 FEATURES', winX + winW / 2, 36 + boxH - 8);

  const waveMidY = 36 + boxH / 2;
  ctx.beginPath();
  for (let x = 16; x < splitX - 16; x += 2) {
    const t = (x + state.tick * 2.2) * 0.045;
    let dy = Math.sin(t * 1.3) * 15 + Math.cos(t * 2.8) * 8 + Math.sin(t * 5.2) * 4;
    if (isRaw) dy += Math.sin(x * 1.8 + state.tick * 0.9) * 18;
    const py = waveMidY + dy;
    if (x === 16) ctx.moveTo(x, py);
    else ctx.lineTo(x, py);
  }
  ctx.strokeStyle = mainCol;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  if (isStacked) {
    ctx.beginPath(); ctx.moveTo(16, 176); ctx.lineTo(w - 16, 176); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(splitX, 14); ctx.lineTo(splitX, h - 14); ctx.stroke();
  }

  const psdX = isStacked ? 16 : splitX + 22;
  const psdW = w - psdX - (isStacked ? 16 : 22);
  const psdTopY = isStacked ? 210 : 40;
  const psdBaseY = h - 24;

  ctx.fillStyle = accentCol;
  ctx.font = `700 ${isStacked ? '8.5px' : '10px'} Montserrat, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('02 / POWER SPECTRUM (0–75 Hz)', psdX, isStacked ? 196 : 24);

  const cutoff50X = psdX + psdW * (50 / 75);
  const spike60X = psdX + psdW * (60 / 75);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fillRect(psdX, psdTopY, cutoff50X - psdX, psdBaseY - psdTopY);

  ctx.strokeStyle = mainCol;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(cutoff50X, psdTopY); ctx.lineTo(cutoff50X, psdBaseY); ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  for (let x = 0; x <= psdW; x += 2) {
    const freq = (x / psdW) * 75;
    let power = Math.exp(-freq / 24) * 78 + Math.sin(freq * 0.4 + state.tick * 0.08) * 3;
    if (freq > 50 && !isRaw) power *= Math.exp(-(freq - 50) * 0.35);
    if (Math.abs(freq - 60) < 2.5) power += isRaw ? 95 : 3;
    const px = psdX + x;
    const py = psdBaseY - Math.max(2, power);
    if (x === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = mainCol;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = mainCol;
  ctx.font = '700 8px Montserrat, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isRaw ? '⚡ 60 Hz HUM!' : '✓ 60 Hz REMOVED', spike60X - 10, isRaw ? psdTopY + 14 : psdBaseY - 14);
}

// ============================================================================
// TAB 03: 4-STAGE LIF SNN PIPELINE (MONOCHROME -> COLOR ON CURSOR HOVER)
// ============================================================================
let snnMode = 'seizure';
let snnPulses = [];
let lifVoltageHistory = new Array(100).fill(0.15);
let lifCurrentV = 0.15;

function setSnnMode(m) {
  snnMode = m;
  document.getElementById('snnModeCalm')?.classList.toggle('active', m === 'calm');
  document.getElementById('snnModeSeizure')?.classList.toggle('active', m === 'seizure');
}

function drawSnnFlow() {
  const canvas = document.getElementById('snnFlowCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth || 920);
  const isGrid2x2 = w < 700;
  const h = (canvas.height = isGrid2x2 ? 540 : 330);
  ctx.clearRect(0, 0, w, h);

  const isSeizure = snnMode === 'seizure';
  const isHov = hoveredCanvases.has('snn') || window.innerWidth <= 900;

  const cCyan = isHov ? '#00e5ff' : '#ffffff';
  const cGold = isHov ? '#fbbf24' : '#d4d4d8';
  const cViol = isHov ? '#7b5cff' : '#a1a1aa';
  const cMag  = isHov ? '#d62976' : '#ffffff';

  const z1W = isGrid2x2 ? w * 0.5 : w * 0.21;
  const z2W = isGrid2x2 ? w * 0.5 : w * 0.21;
  const z3W = isGrid2x2 ? w * 0.5 : w * 0.34;
  const z4W = isGrid2x2 ? w * 0.5 : w * 0.24;

  const x1 = 0, y1 = 0;
  const x2 = z1W, y2 = 0;
  const x3 = isGrid2x2 ? 0 : z1W + z2W, y3 = isGrid2x2 ? 270 : 0;
  const x4 = isGrid2x2 ? w * 0.5 : z1W + z2W + z3W, y4 = isGrid2x2 ? 270 : 0;

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  if (isGrid2x2) {
    ctx.beginPath(); ctx.moveTo(w * 0.5, 10); ctx.lineTo(w * 0.5, h - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, 268); ctx.lineTo(w - 10, 268); ctx.stroke();
  } else {
    [x2, x3, x4].forEach(divX => {
      ctx.beginPath(); ctx.moveTo(divX, 12); ctx.lineTo(divX, h - 12); ctx.stroke();
    });
  }

  ctx.font = `700 ${isGrid2x2 ? '8px' : '9.5px'} Montserrat, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillStyle = cCyan; ctx.fillText(isGrid2x2 ? '01 / 154 FEATURES' : '01 / 154 EEG FEATURES', x1 + 10, y1 + 22);
  ctx.fillStyle = cGold; ctx.fillText(isGrid2x2 ? '02 / SPIKE ENCODER' : '02 / RATE SPIKE ENCODER (T=25)', x2 + 10, y2 + 22);
  ctx.fillStyle = cViol; ctx.fillText(isGrid2x2 ? '03 / LIF NEURONS V(t)' : '03 / LIF NEURONS & MEMBRANE V(t)', x3 + 10, y3 + 22);
  ctx.fillStyle = cMag;  ctx.fillText(isGrid2x2 ? '04 / DECISION' : '04 / SPIKE-COUNT DECISION', x4 + 10, y4 + 22);

  // Stage 1: 7 Feature Bars
  const featNames = ['Delta', 'Theta', 'Alpha', 'Beta', 'Gamma', 'LineLen', 'Var'];
  const baseVals = isSeizure
    ? [0.75, 0.82, 0.68, 0.92, 0.86, 0.95, 0.90]
    : [0.42, 0.35, 0.55, 0.22, 0.14, 0.18, 0.15];

  const barStartX = x1 + (isGrid2x2 ? 50 : 64), barMaxW = Math.max(30, z1W - (isGrid2x2 ? 62 : 80));
  featNames.forEach((fname, idx) => {
    const fy = y1 + (isGrid2x2 ? 42 + idx * 30 : 52 + idx * 35);
    const val = Math.min(1, Math.max(0.08, baseVals[idx] + Math.sin(state.tick * 0.08 + idx) * 0.05));
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `600 ${isGrid2x2 ? '8px' : '9px'} Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(fname, barStartX - 6, fy + 9);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fillRect(barStartX, fy, barMaxW, 10);
    ctx.fillStyle = isSeizure && idx >= 3 ? cMag : cCyan;
    ctx.fillRect(barStartX, fy, barMaxW * val, 10);
  });

  // Stage 2: Spike Raster
  const rasterX = x2 + 12, rasterW = z2W - 24, rows = 8, cols = isGrid2x2 ? 12 : 16, cellW = rasterW / cols;
  for (let r = 0; r < rows; r++) {
    const ry = y2 + 44 + r * 26;
    for (let c = 0; c < cols; c++) {
      const seed = Math.abs(Math.sin((r + 1) * 19.7 + (c + Math.floor(state.tick * 0.25)) * 7.3));
      if (seed < (isSeizure ? 0.68 : 0.16)) {
        const sx = rasterX + c * cellW + cellW * 0.5;
        ctx.strokeStyle = isSeizure ? (r % 2 === 0 ? cGold : cMag) : cCyan;
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(sx, ry + 13); ctx.lineTo(sx, ry + 1); ctx.stroke();
      }
    }
  }

  // Stage 3: LIF Network + Scope
  const netColumns = [
    { x: x3 + z3W * 0.18, count: 5, color: cCyan },
    { x: x3 + z3W * 0.50, count: 4, color: cViol },
    { x: x3 + z3W * 0.82, count: 3, color: cMag }
  ];
  const netTop = y3 + 36, netBottom = y3 + (isGrid2x2 ? 150 : 180), netH = netBottom - netTop;
  const colNodes = netColumns.map(col => {
    const arr = [];
    for (let i = 0; i < col.count; i++) {
      arr.push({ x: col.x, y: netTop + ((i + 0.5) / col.count) * netH, color: col.color });
    }
    return arr;
  });

  for (let c = 0; c < colNodes.length - 1; c++) {
    colNodes[c].forEach(ln => {
      colNodes[c + 1].forEach(rn => {
        ctx.strokeStyle = 'rgba(255,255,255,0.11)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ln.x, ln.y); ctx.lineTo(rn.x, rn.y); ctx.stroke();
      });
    });
  }

  if (Math.random() < (isSeizure ? 0.65 : 0.2) && snnPulses.length < 36) {
    const cIdx = Math.floor(Math.random() * 2);
    const n1 = colNodes[cIdx][Math.floor(Math.random() * colNodes[cIdx].length)];
    const n2 = colNodes[cIdx + 1][Math.floor(Math.random() * colNodes[cIdx + 1].length)];
    snnPulses.push({ x1: n1.x, y1: n1.y, x2: n2.x, y2: n2.y, t: 0, speed: 0.045 });
  }

  for (let i = snnPulses.length - 1; i >= 0; i--) {
    const p = snnPulses[i];
    p.t += p.speed;
    if (p.t >= 1) { snnPulses.splice(i, 1); continue; }
    ctx.fillStyle = isSeizure ? cGold : cCyan;
    ctx.beginPath();
    ctx.arc(p.x1 + (p.x2 - p.x1) * p.t, p.y1 + (p.y2 - p.y1) * p.t, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  colNodes.forEach(nodes => {
    nodes.forEach(n => {
      ctx.fillStyle = '#060608';
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(n.x, n.y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
  });

  // Scope
  const scopeX = x3 + 10, scopeY = y3 + (isGrid2x2 ? 160 : 196), scopeW = z3W - 20, scopeH = isGrid2x2 ? 92 : 104;
  ctx.fillStyle = '#09090d';
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(scopeX, scopeY, scopeW, scopeH);
  ctx.strokeRect(scopeX, scopeY, scopeW, scopeH);

  const drive = isSeizure ? (Math.random() * 0.26 + 0.05) : (Math.random() * 0.09);
  lifCurrentV = lifCurrentV * 0.90 + drive;
  let fired = false;
  if (lifCurrentV >= 1.0) { lifCurrentV = 1.15; fired = true; }
  lifVoltageHistory.push(lifCurrentV);
  if (lifVoltageHistory.length > 90) lifVoltageHistory.shift();
  if (fired) lifCurrentV = 0.1;

  const thY = scopeY + scopeH - 0.78 * scopeH;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = cMag;
  ctx.beginPath(); ctx.moveTo(scopeX, thY); ctx.lineTo(scopeX + scopeW, thY); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '600 7.5px Montserrat, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LIF V(t) [β=0.9]', scopeX + 6, scopeY + 13);

  ctx.beginPath();
  lifVoltageHistory.forEach((v, idx) => {
    const vx = scopeX + (idx / (lifVoltageHistory.length - 1)) * scopeW;
    const vy = scopeY + scopeH - 8 - Math.min(1.1, v) * (scopeH - 22);
    if (idx === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  });
  ctx.strokeStyle = isSeizure ? cGold : cCyan;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Stage 4: Readout
  const rPadX = x4 + 12, rW = z4W - 24;
  const c0Spikes = isSeizure ? 4 : 21;
  const c1Spikes = isSeizure ? 20 : 2;

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 ${isGrid2x2 ? '8px' : '9.5px'} Montserrat, sans-serif`;
  ctx.textAlign = 'left'; ctx.fillText(isGrid2x2 ? 'NORMAL (0)' : 'CLASS 0 (NORMAL)', rPadX, y4 + 58);
  ctx.textAlign = 'right'; ctx.fillStyle = cCyan; ctx.fillText(`${c0Spikes}/25`, rPadX + rW, y4 + 58);
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(rPadX, y4 + 66, rW, 11);
  ctx.fillStyle = cCyan; ctx.fillRect(rPadX, y4 + 66, rW * (c0Spikes / 25), 11);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.textAlign = 'left'; ctx.fillText(isGrid2x2 ? 'SEIZURE (1)' : 'CLASS 1 (SEIZURE)', rPadX, y4 + 110);
  ctx.textAlign = 'right'; ctx.fillStyle = cMag; ctx.fillText(`${c1Spikes}/25`, rPadX + rW, y4 + 110);
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(rPadX, y4 + 118, rW, 11);
  ctx.fillStyle = cMag; ctx.fillRect(rPadX, y4 + 118, rW * (c1Spikes / 25), 11);

  const cardY = y4 + 154, cardH = isGrid2x2 ? 98 : 128;
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.strokeStyle = isSeizure ? cMag : cCyan;
  ctx.lineWidth = 1.4;
  ctx.fillRect(rPadX, cardY, rW, cardH);
  ctx.strokeRect(rPadX, cardY, rW, cardH);

  ctx.textAlign = 'center';
  ctx.fillStyle = isSeizure ? cMag : cCyan;
  ctx.font = `700 ${isGrid2x2 ? '11px' : '14px'} Montserrat, sans-serif`;
  ctx.fillText(isSeizure ? 'SEIZURE (1)' : 'NORMAL (0)', rPadX + rW / 2, cardY + (isGrid2x2 ? 42 : 52));
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = `500 ${isGrid2x2 ? '8.5px' : '9.5px'} Inter, sans-serif`;
  ctx.fillText(isSeizure ? '+1 Hit → Debouncer' : 'Standby • 0.61 ms', rPadX + rW / 2, cardY + (isGrid2x2 ? 66 : 80));
}

// ============================================================================
// TAB 03: SRAM PRESSURE METER
// ============================================================================
function selectSram(key) {
  ['rf', 'fp32', 'int8'].forEach(k =>
    document.getElementById(`sramBtn${k.toUpperCase()}`)?.classList.toggle('active', k === key)
  );
  const fill = document.getElementById('sramBarFill');
  const chip = document.getElementById('sramChipLabel');
  const verdict = document.getElementById('sramVerdict');
  const glow = document.getElementById('sramOverflowGlow');
  const memV = document.getElementById('sramMemVal'), memD = document.getElementById('sramMemDesc');
  const latV = document.getElementById('sramLatVal'), latD = document.getElementById('sramLatDesc');
  const recV = document.getElementById('sramRecVal'), recD = document.getElementById('sramRecDesc');

  if (key === 'int8') {
    fill.style.width = '5.3%';
    glow.style.display = 'none';
    chip.textContent = 'SNN INT8 — 27.4 KB / 512 KB SRAM (5.3%)';
    verdict.innerHTML = '<strong>✓ DEPLOYABLE</strong> — Leaves 484 KB free for RL controller, safety logic & runtime stack.';
    memV.innerHTML = '27.4 <span>KB</span>'; memD.textContent = '28,032 bytes — 4× compressed from Float32. ΔF1 = −0.000036.';
    latV.innerHTML = '0.61 <span>ms</span>'; latD.textContent = '80× faster than 50 ms hard real-time budget.';
    recV.innerHTML = '100 <span>% (46/46)</span>'; recD.textContent = 'Zero missed seizure events. +0.4% recall gain vs Float32.';
  } else if (key === 'fp32') {
    fill.style.width = '21.4%';
    glow.style.display = 'none';
    chip.textContent = 'SNN Float32 — 109.5 KB / 512 KB SRAM (21.4%)';
    verdict.innerHTML = '<strong>⚠ FITS, BUT WASTEFUL</strong> — Consumes 21.4% SRAM with no clinical accuracy advantage over INT8.';
    memV.innerHTML = '109.5 <span>KB</span>'; memD.textContent = '28,032 parameters × 4 bytes/float = 112,128 bytes.';
    latV.innerHTML = '1.45 <span>ms</span>'; latD.textContent = 'Float32 multiply-accumulate is slower on ARM SIMD.';
    recV.innerHTML = '100 <span>% (46/46)</span>'; recD.textContent = 'Same clinical recall — no benefit over INT8 for 4× the memory.';
  } else {
    fill.style.width = '100%';
    glow.style.display = 'block';
    chip.textContent = '100-Tree Random Forest — ~2,800 KB required — SRAM OVERFLOW';
    verdict.innerHTML = '<strong style="color:#d62976">✗ CANNOT DEPLOY</strong> — Hundreds of decision trees require 2–5 MB. The Cortex-M7 has 512 KB.';
    memV.innerHTML = '~2800 <span>KB</span>'; memD.textContent = '5× over the total Cortex-M7 on-chip SRAM. Cannot fit.';
    latV.innerHTML = 'Non-Det <span>traversal</span>'; latD.textContent = 'Decision tree traversal is non-deterministic.';
    recV.innerHTML = '97.8 <span>% (45/46)</span>'; recD.textContent = 'Misses 1 clinical seizure AND cannot fit on the implant chip.';
  }
}

// ============================================================================
// TAB 04: LIVE LAB — EEG SIM + DEBOUNCER + ELECTRODE MAP
// ============================================================================
function changeSimMode(mode) {
  state.simMode = mode;
  ['simCalmBtn', 'simHumBtn', 'simSeizBtn'].forEach((id, i) =>
    document.getElementById(id)?.classList.toggle('active', i === ['calm', 'hum', 'seizure'].indexOf(mode))
  );
}

function drawLiveSimCanvas() {
  const canvas = document.getElementById('liveSimCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth || 540);
  const h = (canvas.height = 230);
  const isCompact = w < 520;
  ctx.clearRect(0, 0, w, h);

  const isHov = hoveredCanvases.has('sim') || window.innerWidth <= 900;
  const isSeiz = state.simMode === 'seizure';
  const isHum = state.simMode === 'hum';

  const waveCol = isHov ? (isSeiz ? '#d62976' : isHum ? '#fbbf24' : '#00e5ff') : '#ffffff';
  const spikeCol = isHov ? (isSeiz ? '#fbbf24' : '#00e5ff') : '#d4d4d8';

  // Top Header: Analog Brainwave
  ctx.fillStyle = waveCol;
  ctx.font = `700 ${isCompact ? '8px' : '9.5px'} Montserrat, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(isCompact ? '① ANALOG BRAINWAVE (EEG)' : '① CONTINUOUS ANALOG BRAINWAVE (EEG SIGNAL)', 14, 20);

  // Draw Analog EEG Waveform
  ctx.beginPath();
  for (let x = 14; x < w - 14; x += 2) {
    const t = (x + state.tick * 2.5) * 0.042;
    let y = Math.sin(t * 1.4) * 10 + Math.cos(t * 2.6) * 5;
    if (isHum) y += Math.sin(x * 1.65 + state.tick) * 16;
    else if (isSeiz) y = Math.sin(t * 3.8) * 26 + Math.cos(t * 7.5) * 13;
    if (x === 14) ctx.moveTo(x, 66 + y);
    else ctx.lineTo(x, 66 + y);
  }
  ctx.strokeStyle = waveCol;
  ctx.lineWidth = 1.75;
  ctx.stroke();

  // Middle Divider with Rate Encoding Explanation
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(14, 114); ctx.lineTo(w - 14, 114); ctx.stroke();

  const steps = 25;
  const trackW = w - 28;
  const stepW = trackW / steps;
  const rate = isSeiz ? 0.80 : isHum ? 0.44 : 0.16;

  let activeSpikes = 0;

  // Draw 25 Digital Spike Slots (0 or 1)
  for (let s = 0; s < steps; s++) {
    const sx = 14 + s * stepW + stepW / 2;
    const v = Math.abs(Math.sin((s + 1) * 17.3 + Math.floor(state.tick * 0.12) * 5.7));
    const isOne = v < rate;
    if (isOne) activeSpikes++;

    // Slot base tick
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(sx - 2, 194, 4, 2);

    if (isOne) {
      // Faint conversion drop line from wave to spike
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, 85); ctx.lineTo(sx, 145); ctx.stroke();

      // Digital Spike Bar (1)
      ctx.strokeStyle = spikeCol;
      ctx.lineWidth = isCompact ? 2.0 : 2.6;
      ctx.beginPath(); ctx.moveTo(sx, 194); ctx.lineTo(sx, 148); ctx.stroke();

      // Binary '1' label above spike
      ctx.fillStyle = spikeCol;
      ctx.font = `700 ${isCompact ? '7.5px' : '8.5px'} Montserrat, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('1', sx, 143);
    } else {
      // Binary '0' label on baseline
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = `500 ${isCompact ? '7px' : '8px'} Montserrat, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('0', sx, 190);
    }

    // Step index at bottom (1..25)
    if ((s + 1) % 5 === 0 || s === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.font = '500 7.5px Inter, sans-serif';
      ctx.fillText(`T=${s + 1}`, sx, 214);
    }
  }

  // Bottom Track Header + Live Spike Count Badge
  ctx.fillStyle = spikeCol;
  ctx.font = `700 ${isCompact ? '8px' : '9.5px'} Montserrat, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(isCompact ? '② DIGITAL SPIKES (0 & 1)' : '② ENCODED DIGITAL SPIKES (25 STEPS OF 0 & 1)', 14, 130);

  ctx.textAlign = 'right';
  ctx.fillText(isCompact ? `FIRED: ${activeSpikes}/25` : `SPIKES FIRED: ${activeSpikes} / 25`, w - 14, 130);
}

function runDebounceTest(type) {
  ['dbBtnCalm', 'dbBtnFalse', 'dbBtnSeiz'].forEach((id, idx) => {
    const key = ['calm', 'false_alarm', 'seizure'][idx];
    document.getElementById(id)?.classList.toggle('active', key === type);
  });

  if (type === 'calm') state.debounceWindow = [0, 0, 0, 0, 0];
  else if (type === 'false_alarm') state.debounceWindow = [0, 1, 0, 0, 0];
  else state.debounceWindow = [0, 1, 1, 1, 1];
  renderDebounceGrid();
}

function renderDebounceGrid() {
  const grid = document.getElementById('debounceGrid');
  if (!grid) return;
  grid.innerHTML = state.debounceWindow
    .map((v, i) => `
      <div class="db-box ${v ? 'active-hit' : ''}">
        <div class="db-sec">Second ${i + 1}</div>
        <div class="db-state">${v ? '⚠ SEIZURE (1)' : '✓ NORMAL (0)'}</div>
      </div>`)
    .join('');

  const hits = state.debounceWindow.reduce((a, b) => a + b, 0);
  const badge = document.getElementById('debounceCountBadge');
  const bar = document.getElementById('debounceProgressBar');
  const el = document.getElementById('debounceStatusText');

  if (badge) {
    badge.textContent = `${hits} / 3 Required (${hits >= 3 ? 'UNLOCKED ⚡' : 'LOCKED 🔒'})`;
    badge.style.color = hits >= 3 ? '#00e5ff' : hits > 0 ? '#fbbf24' : '#ffffff';
  }
  if (bar) {
    bar.style.width = `${Math.min(100, (hits / 3) * 100)}%`;
    bar.style.background = hits >= 3 ? '#00e5ff' : hits > 0 ? '#d62976' : '#ffffff';
  }
  if (!el) return;
  el.classList.remove('warn', 'critical');

  if (hits >= 3) {
    el.innerHTML = `<strong style="color:#00e5ff">⚡ REAL SEIZURE CONFIRMED (${hits} of 5 Seconds ≥ 3):</strong> Because the SNN detected seizure activity in at least 3 seconds out of 5, the gate unlocks and triggers neurostimulation!`;
  } else if (hits > 0) {
    el.classList.add('warn');
    el.innerHTML = `<strong style="color:#fbbf24">🔒 FALSE ALARM BLOCKED (${hits} of 5 Seconds &lt; 3):</strong> Only 1 second spiked (e.g., an eye blink or muscle twitch). Because ${hits} is less than 3, the debouncer blocks it so the patient is NEVER shocked by mistake!`;
  } else {
    el.innerHTML = `<strong>✓ STANDBY (0 of 5 Seconds):</strong> Brainwaves are completely normal across all 5 seconds. Stimulation gate remains safely locked.`;
  }
}

const SCALP_CH = [
  { name: 'FP1-F7', x: -0.42, y: -0.62, a: true }, { name: 'F7-T7', x: -0.68, y: -0.25, a: true }, { name: 'T7-P7', x: -0.68, y: 0.22, a: true },
  { name: 'P7-O1', x: -0.42, y: 0.62, a: true }, { name: 'FP1-F3', x: -0.22, y: -0.52, a: true }, { name: 'F3-C3', x: -0.32, y: -0.18, a: true },
  { name: 'C3-P3', x: -0.32, y: 0.22, a: true }, { name: 'P3-O1', x: -0.22, y: 0.56, a: true }, { name: 'FZ-CZ', x: 0.00, y: -0.22, a: true },
  { name: 'CZ-PZ', x: 0.00, y: 0.22, a: true }, { name: 'FP2-F4', x: 0.22, y: -0.52, a: true }, { name: 'F4-C4', x: 0.32, y: -0.18, a: true },
  { name: 'C4-P4', x: 0.32, y: 0.22, a: true }, { name: 'P4-O2', x: 0.22, y: 0.56, a: true }, { name: 'FP2-F8', x: 0.42, y: -0.62, a: true },
  { name: 'F8-T8', x: 0.68, y: -0.25, a: true }, { name: 'T8-P8', x: 0.68, y: 0.22, a: true }, { name: 'P8-O2', x: 0.42, y: 0.62, a: true },
  { name: 'P7-T7', x: -0.54, y: 0.00, a: true }, { name: 'T7-FT9', x: -0.78, y: -0.02, a: true },
  { name: 'FT9-FT10', x: 0.00, y: -0.68, a: true }, { name: 'T8-P8B', x: 0.54, y: 0.00, a: true }
];
let awgnEnabled = false;

function initElectrodeMap() {
  const c = document.getElementById('electrodeCanvas');
  if (!c) return;
  c.addEventListener('click', e => {
    const r = c.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (c.width / r.width);
    const my = (e.clientY - r.top) * (c.height / r.height);
    const cx = c.width / 2, cy = c.height / 2 + 10, rH = Math.min(c.width, c.height) * 0.42;
    for (const ch of SCALP_CH) {
      const ex = cx + ch.x * rH, ey = cy + ch.y * rH;
      if (Math.hypot(mx - ex, my - ey) < 16) {
        ch.a = !ch.a;
        updateElecTelemetry();
        break;
      }
    }
  });
  updateElecTelemetry();
}

function setElectrodePreset(p) {
  SCALP_CH.forEach((ch, i) => {
    if (p === 'healthy') ch.a = true;
    else if (p === 'drop2') ch.a = !(i === 1 || i === 5);
    else if (p === 'drop6') ch.a = i >= 6;
  });
  updateElecTelemetry();
}

function toggleAwgnNoise() {
  awgnEnabled = !awgnEnabled;
  const btn = document.getElementById('awgnToggleBtn');
  if (btn) {
    btn.textContent = awgnEnabled ? 'AWGN: ON (0 dB)' : 'AWGN: OFF';
    btn.classList.toggle('active', awgnEnabled);
  }
  updateElecTelemetry();
}

function updateElecTelemetry() {
  const active = SCALP_CH.filter(c => c.a).length, dropped = 22 - active;
  let snn = 100, rf = 97.8;
  if (dropped === 1) { snn = 64; rf = 91; }
  else if (dropped === 2) { snn = 38.5; rf = 84; }
  else if (dropped >= 3 && dropped <= 5) { snn = 14.2; rf = 72; }
  else if (dropped >= 6) { snn = 4.6; rf = 58; }
  if (awgnEnabled) {
    snn = Math.max(3.2, +(snn * 0.42).toFixed(1));
    rf = Math.max(35, +(rf * 0.78).toFixed(1));
  }

  document.getElementById('elecCountLabel').textContent = `${active} / 22`;
  document.getElementById('elecCountBar').style.width = `${(active / 22) * 100}%`;
  document.getElementById('elecRecallLabel').textContent = `${snn.toFixed(1)}%`;
  document.getElementById('elecRecallBar').style.width = `${snn}%`;
  document.getElementById('elecRfLabel').textContent = `${rf.toFixed(1)}%`;
  document.getElementById('elecRfBar').style.width = `${rf}%`;

  const b = document.getElementById('elecFaultBanner');
  b.classList.remove('warn', 'critical');
  if (dropped === 0 && !awgnEnabled) {
    b.innerHTML = `<strong>NOMINAL:</strong> All 22 channels active. 100% event recall (46/46).`;
  } else if (dropped >= 4 || snn < 20) {
    b.classList.add('critical');
    b.innerHTML = `<strong>CRITICAL (${dropped} dropped${awgnEnabled ? ' + AWGN' : ''}):</strong> LIF membrane potential cannot reach firing threshold — recall drops to <strong>${snn.toFixed(1)}%</strong>. Hardware lead-off detection activates Safe Fallback Mode (Epic E).`;
  } else {
    b.classList.add('warn');
    b.innerHTML = `<strong>DEGRADED (${dropped} dropped${awgnEnabled ? ', AWGN' : ''}):</strong> Partial signal loss reduces synaptic drive — SNN recall: <strong>${snn.toFixed(1)}%</strong>.`;
  }
}

function drawElectrodeCanvas() {
  const c = document.getElementById('electrodeCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height, cx = w / 2, cy = h / 2 + 10, rH = Math.min(w, h) * 0.42;
  ctx.clearRect(0, 0, w, h);

  const isHov = hoveredCanvases.has('elec') || window.innerWidth <= 900;

  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(cx - 12, cy - rH + 3); ctx.lineTo(cx, cy - rH - 14); ctx.lineTo(cx + 12, cy - rH + 3); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx - rH - 5, cy, 5, 14, 0, 0, Math.PI * 2); ctx.ellipse(cx + rH + 5, cy, 5, 14, 0, 0, Math.PI * 2); ctx.stroke();

  ctx.strokeStyle = isHov ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(cx, cy, rH, 0, Math.PI * 2); ctx.stroke();

  SCALP_CH.forEach(ch => {
    const jx = awgnEnabled ? (Math.random() - 0.5) * 3.5 : 0;
    const jy = awgnEnabled ? (Math.random() - 0.5) * 3.5 : 0;
    const ex = cx + ch.x * rH + jx, ey = cy + ch.y * rH + jy;
    if (ch.a) {
      ctx.fillStyle = isHov ? (awgnEnabled ? '#fbbf24' : '#00e5ff') : '#ffffff';
      ctx.beginPath(); ctx.arc(ex, ey, 4.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = '#d62976';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(ex, ey, 6.5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = ch.a ? 'rgba(255,255,255,0.68)' : '#d62976';
    ctx.font = '600 8px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ch.name, ex, ey - 10);
  });
}

// ============================================================================
// TAB 05: FIGURES
// ============================================================================
function initFiguresGrid() {
  const g = document.getElementById('figGrid');
  if (!g) return;
  g.innerHTML = REPORT_FIGURES
    .map((f, i) => `<div class="fig-card" onclick="openModal(${i})"><div class="fig-img-box"><img src="${f.src}" alt="${f.title}" loading="lazy"/></div><div class="fig-title">${f.title}</div><div class="fig-desc">${f.desc}</div></div>`)
    .join('');
}

function openModal(idx) {
  const f = REPORT_FIGURES[idx];
  document.getElementById('modalTitle').textContent = f.title;
  document.getElementById('modalImg').src = f.src;
  document.getElementById('modalDesc').textContent = f.desc;
  document.getElementById('figModal').classList.add('open');
}

function closeModal() {
  document.getElementById('figModal').classList.remove('open');
}

// ============================================================================
// INITIALIZATION & LIGHTWEIGHT 60-FPS LOOP
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('neuralCanvas');
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initWelcomeNeuralScene();
  };
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('mousemove', e => {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;
    if (state.inWelcome) {
      state.targetTiltY = ((e.clientX / window.innerWidth) - 0.5) * 0.35;
      state.targetTiltX = ((e.clientY / window.innerHeight) - 0.5) * 0.22;
      checkNodeHover(e.clientX, e.clientY);
    }
  });

  // Support mobile touch tap & swipe across the brain matrix
  const onTouch = e => {
    if (!e.touches || !e.touches[0]) return;
    state.mouseX = e.touches[0].clientX;
    state.mouseY = e.touches[0].clientY;
    if (state.inWelcome) checkNodeHover(state.mouseX, state.mouseY);
  };
  window.addEventListener('touchstart', onTouch, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });

  // Clicking any of the 6 Brain Callout Pills jumps straight to its Dashboard Tab
  document.getElementById('welcomeScreen')?.addEventListener('click', e => {
    if (!state.inWelcome || state.isZooming) return;
    if (activeCalloutIdx !== -1) {
      const targetTabs = ['tab-epica', 'tab-epica', 'tab-epicb', 'tab-epicb', 'tab-epicb', 'tab-sim'];
      zoomIntoDashboard(targetTabs[activeCalloutIdx] || 'tab-story');
    }
  });

  // Register lightweight hover listeners on showcase blocks so canvases ignite in color on hover
  const bindHover = (selector, key) => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.addEventListener('mouseenter', () => hoveredCanvases.add(key));
    el.addEventListener('mouseleave', () => hoveredCanvases.delete(key));
    el.addEventListener('touchstart', () => hoveredCanvases.add(key), { passive: true });
  };
  bindHover('#tab-story .showdown-block', 'showdown');
  bindHover('#tab-epica .showdown-block', 'epica');
  bindHover('#tab-epicb .snn-flow-block', 'snn');
  bindHover('#tab-sim .sim-vertical-stack', 'sim');
  bindHover('#tab-sim .electrode-lab-block', 'elec');

  runDebounceTest('seizure');
  selectSram('int8');
  initElectrodeMap();
  initFiguresGrid();

  // Ultra-fast 60 FPS loop: ONLY draws what is currently visible on screen!
  function animate() {
    state.tick++;
    if (state.inWelcome) {
      drawWelcomeNeuralScene();
    } else {
      if (state.activeTab === 'tab-story') drawShowdownCanvases();
      else if (state.activeTab === 'tab-epica') drawEpicAPipelineCanvas();
      else if (state.activeTab === 'tab-epicb') drawSnnFlow();
      else if (state.activeTab === 'tab-sim') {
        drawLiveSimCanvas();
        drawElectrodeCanvas();
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
});


