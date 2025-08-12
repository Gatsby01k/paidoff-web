// src/components/RobotAssistantCanvas.tsx
import React, { useEffect, useRef } from "react";
import type { Risk } from "../lib/deposits";

type Trade = { side: "LONG" | "SHORT"; change: number };

type Props = {
  trigger?: number;        // инкремент из родителя → анимация: лучи, искры, взмах рукой
  risk?: Risk;             // LOW/MEDIUM/HIGH → акцент цвета
  trade?: Trade | null;    // для бейджа сделки у «хватателя»
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number };

export default function RobotAssistantCanvas({ trigger = 0, risk = "LOW", trade = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const ACCENT = risk === "HIGH" ? "#ff5c7a" : risk === "MEDIUM" ? "#f59e0b" : "#22c55e";

    function resize() {
      const w = c.clientWidth, h = c.clientHeight;
      c.width = Math.floor(w * DPR);
      c.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      bgRef.current = buildBackground(w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    const W = () => c.clientWidth, H = () => c.clientHeight;

    // --- состояние бота ---
    let t0 = performance.now();
    let raf = 0;

    // «живость»: лёгкий кач корпуса и головы, гусеницы «переезжают» на месте
    let trackShift = 0;
    let headBlink = 0;        // 0..1 для моргания
    let headBlinkTimer = 0;   // таймер до следующего мигания
    let headTilt = 0;         // наклон головы (-1..1)
    let armWave = 0;          // взмах левой рукой при триггере (0..1)
    let beamT = 0;            // интенсивность фар/лучей 0..1

    const sparks: Particle[] = []; // искры у хватателя
    const mouse = { x: 0, y: 0, has: false };

    // начальный таймер мигания
    headBlinkTimer = 800 + Math.random() * 1400;

    c.addEventListener("mousemove", (e) => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.has = true;
    });
    c.addEventListener("mouseleave", () => (mouse.has = false));

    // основной цикл
    function step(now: number) {
      const dt = now - t0;
      t0 = now;

      // кач корпуса/головы
      const wobble = Math.sin(now / 900) * 0.6;
      headTilt = 0.25 * Math.sin(now / 800) + (mouse.has ? (mouse.x / W() - 0.5) * 0.3 : 0);

      // гусеницы «едут» потихоньку
      trackShift = (trackShift + dt * 0.05) % 12;

      // моргание
      headBlinkTimer -= dt;
      if (headBlinkTimer <= 0) {
        headBlink = 1; // закрыть
        headBlinkTimer = 1200 + Math.random() * 1600;
      }
      headBlink = Math.max(0, headBlink - dt / 90); // быстро закрыть/открыть

      // затухание лучей и взмаха
      beamT = Math.max(0, beamT - dt / 400);
      armWave = Math.max(0, armWave - dt / 500);

      // искры
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life += dt;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.01;
        if (p.life > p.max) sparks.splice(i, 1);
      }

      // рисуем
      drawScene(ctx, bgRef.current, W(), H(), {
        wobble,
        headTilt,
        headBlink,
        trackShift,
        beamT,
        armWave,
        sparks,
        accent: ACCENT,
        trade,
        mouse: mouse.has ? mouse : null,
      });

      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);

    // триггер вопроса → лучи фар + взмах рукой + искры у «хватателя»
    let lastTrig = trigger;
    const int = setInterval(() => {
      if (trigger !== lastTrig) {
        lastTrig = trigger;
        beamT = 1;
        armWave = 1;

        // искры у хватателя (правой руки)
        const pos = rightHandPos(W(), H());
        spawnSparks(sparks, pos.x, pos.y, ACCENT);
      }
    }, 50);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(int);
      window.removeEventListener("resize", resize);
    };
  }, [trigger, risk, trade]);

  return (
    <div className="card p-2 h-full">
      <canvas ref={canvasRef} className="w-full h-full rounded-2xl block" />
    </div>
  );
}

/* -------------- рисование сцены -------------- */

function drawScene(
  ctx: CanvasRenderingContext2D,
  bg: HTMLCanvasElement | null,
  w: number,
  h: number,
  s: {
    wobble: number;
    headTilt: number;
    headBlink: number; // 0..1 (1 — закрыт)
    trackShift: number;
    beamT: number;
    armWave: number;   // 0..1
    sparks: Particle[];
    accent: string;
    trade: { side: "LONG" | "SHORT"; change: number } | null;
    mouse: { x: number; y: number } | null;
  }
) {
  ctx.clearRect(0, 0, w, h);
  if (bg) ctx.drawImage(bg, 0, 0, w, h);

  // базовые координаты бота
  const cx = w * 0.4;              // центр корпуса по X
  const baseY = h * 0.64 + s.wobble; // опорная линия

  // --- ГУСЕНИЦЫ ---
  const trackW = 110, trackH = 34, trackGap = 20;
  drawTrack(ctx, cx - trackW - trackGap / 2, baseY + 40, trackW, trackH, s.trackShift);
  drawTrack(ctx, cx + trackGap / 2, baseY + 40, trackW, trackH, s.trackShift);

  // --- КОРПУС (желтовато-рыжий, состаренный) ---
  const bodyW = 220, bodyH = 150, bodyX = cx - bodyW / 2, bodyY = baseY - bodyH / 2;
  rounded(ctx, bodyX, bodyY, bodyW, bodyH, 18, "#C8A64B", "rgba(0,0,0,0.35)");
  // панель/люк
  rounded(ctx, bodyX + 16, bodyY + 24, bodyW - 32, bodyH - 56, 12, "#D7B45A", "rgba(0,0,0,0.25)");
  // «потёртости»
  grunge(ctx, bodyX + 14, bodyY + 30, bodyW - 28, bodyH - 80);

  // --- ШЕЯ/СТОЙКА ---
  rounded(ctx, cx - 10, bodyY - 38, 20, 42, 8, "#675B3A", "rgba(255,255,255,0.08)");

  // --- ГОЛОВА (бинокль) ---
  ctx.save();
  ctx.translate(cx, bodyY - 40);
  ctx.rotate(s.headTilt);
  rounded(ctx, -90, -40, 180, 80, 18, "#2b2b2b", "rgba(255,255,255,0.12)");
  // мостик глаз
  rounded(ctx, -64, -20, 128, 40, 14, "#1a1a1a", "rgba(255,255,255,0.08)");

  // глаза (зрачки «следят» за мышью), моргание
  const eyeY = 0;
  const eyeDist = 36;
  const pupilMax = 9;
  let px = 0, py = 0;
  if (s.mouse) {
    // нормализуем взгляд к области головы
    const tx = (s.mouse.x - cx) / 50;
    const ty = (s.mouse.y - (bodyY - 40)) / 50;
    const len = Math.hypot(tx, ty) || 1;
    px = Math.max(-1, Math.min(1, tx / len)) * 6;
    py = Math.max(-1, Math.min(1, ty / len)) * 4;
  }
  const blinkH = 1 - s.headBlink; // 1 — открыт, 0 — закрыт

  drawEye(ctx, -eyeDist, eyeY, pupilMax, px, py, blinkH, s.accent, s.beamT);
  drawEye(ctx, +eyeDist, eyeY, pupilMax, px, py, blinkH, s.accent, s.beamT);
  ctx.restore();

  // --- РУКИ ---
  // правая (с хватателем) — статично выдвинута вперёд
  const right = { x: cx + bodyW / 2 - 10, y: bodyY + 40 };
  arm(ctx, right.x, right.y, 56, 22, 0.1, s.accent);
  claw(ctx, right.x + 56, right.y + 10, s.accent);

  // левая — машет при триггере
  const leftBase = { x: cx - bodyW / 2 + 10, y: bodyY + 38 };
  const wave = Math.sin((1 - s.armWave) * Math.PI) * 0.8; // 0→1→0
  arm(ctx, leftBase.x, leftBase.y, 50, 22, -0.8 + wave, s.accent);
  claw(ctx, leftBase.x + 50 * Math.cos(-0.8 + wave), leftBase.y + 50 * Math.sin(-0.8 + wave), s.accent);

  // искры у хватателя
  for (const p of s.sparks) {
    const k = 1 - p.life / p.max;
    const r = 2 + 2 * k;
    glowCircle(ctx, p.x, p.y, r, hex(s.accent, 0.6 * k));
    glowCircle(ctx, p.x, p.y, r * 0.8, hex("#ffffff", 0.35 * k));
  }

  // бейдж сделки рядом с правым хватателем
  if (s.trade) {
    const txt = `${s.trade.side} ${s.trade.change > 0 ? "+" : ""}${s.trade.change}%`;
    drawBadge(ctx, right.x + 72, right.y - 8, txt, s.trade.side === "LONG" ? s.accent : "#f87171");
  }

  // рамка карточки
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  roundedStroke(ctx, 1.5, 1.5, w - 3, h - 3, 22);
}

/* -------------- элементы бота -------------- */

function drawTrack(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, shift: number) {
  rounded(ctx, x, y, w, h, 12, "#1c1c1c", "rgba(255,255,255,0.06)");
  // «башмаки» гусеницы
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 6, y + 6, w - 12, h - 12);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = -w; i < w * 2; i += 12) {
    ctx.fillRect(x + ((i + shift) % (w)), y + 6, 6, h - 12);
  }
  ctx.restore();
  // тень на полу
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + 12, w * 0.45, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEye(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pr: number,
  px: number,
  py: number,
  openK: number,
  accent: string,
  beamT: number
) {
  // «корпус» глаза
  rounded(ctx, cx - 18, cy - 16, 36, 32, 10, "#0f0f0f", "rgba(255,255,255,0.08)");

  // зрачок с бликом
  const pupilX = cx + px;
  const pupilY = cy + py;
  glowCircle(ctx, pupilX, pupilY, pr * openK, "#222");
  glowCircle(ctx, pupilX - 2, pupilY - 2, pr * 0.35 * openK, "#fff");

  // «веко» — просто уменьшаем высоту (openK 0..1)
  // подсветка/луч — при beamT
  if (beamT > 0.02 && openK > 0.2) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = hex(accent, 0.55 * beamT);
    ctx.lineWidth = 6 * beamT;
    ctx.shadowBlur = 18;
    ctx.shadowColor = accent;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 220, cy - 40);
    ctx.stroke();

    ctx.strokeStyle = hex(accent, 0.18 * beamT);
    ctx.lineWidth = 14 * beamT;
    ctx.shadowBlur = 36;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 220, cy - 40);
    ctx.stroke();
    ctx.restore();
  }
}

function arm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  th: number,
  angle: number,
  accent: string
) {
  const x2 = x + Math.cos(angle) * len;
  const y2 = y + Math.sin(angle) * len;

  for (const wv of [th, th * 0.6]) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = wv === th ? hex(accent, 0.25) : hex(accent, 0.6);
    ctx.lineWidth = wv;
    ctx.lineCap = "round";
    ctx.shadowBlur = wv === th ? 14 : 10;
    ctx.shadowColor = accent;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
}

function claw(ctx: CanvasRenderingContext2D, x: number, y: number, accent: string) {
  // «хвататель» — две створки
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.15);
  rounded(ctx, -8, -4, 16, 8, 3, "#0f0f0f", "rgba(255,255,255,0.1)");
  ctx.rotate(0.3);
  rounded(ctx, -8, -4, 16, 8, 3, "#0f0f0f", "rgba(255,255,255,0.1)");
  ctx.restore();

  // легкая подсветка
  glowCircle(ctx, x, y, 3, hex(accent, 0.5));
}

/* -------------- эффекты/утилы -------------- */

function buildBackground(w: number, h: number) {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const g = off.getContext("2d")!;
  // фон-градиент
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#0b0b0b");
  grad.addColorStop(1, "#090909");
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // мягкая «аура»
  const rad = g.createRadialGradient(w * 0.25, h * 0.2, 80, w * 0.5, h * 0.5, Math.max(w, h));
  rad.addColorStop(0, "rgba(254, 228, 64, 0.06)");
  rad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rad;
  g.fillRect(0, 0, w, h);

  // сетка
  g.strokeStyle = "rgba(255,255,255,0.06)";
  g.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
  }

  return off;
}

function grunge(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // простые «потёртости»: полупрозрачные микро-прямоугольники
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "#000";
  for (let i = 0; i < 30; i++) {
    const rx = x + Math.random() * w;
    const ry = y + Math.random() * h;
    const rw = 4 + Math.random() * 12;
    const rh = 1 + Math.random() * 4;
    ctx.fillRect(rx, ry, rw, rh);
  }
  ctx.restore();
}

function drawBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
  ctx.save();
  ctx.font = "bold 12px system-ui, -apple-system, Segoe UI, Roboto";
  const padX = 8, padY = 6;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
  const h = 24;
  rounded(ctx, x, y - h, w, h, 8, "rgba(0,0,0,0.65)", "rgba(255,255,255,0.08)");
  ctx.fillStyle = color;
  ctx.fillText(text, x + padX, y - 8);
  ctx.restore();
}

function spawnSparks(arr: Particle[], x: number, y: number, col: string) {
  for (let i = 0; i < 42; i++) {
    const a = (Math.PI * 2 * i) / 42 + (Math.random() - 0.5) * 0.25;
    const s = 1.2 + Math.random() * 2.4;
    arr.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 520 + Math.random() * 380 });
  }
}

function glowCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function rounded(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill: string, stroke: string
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.stroke();
}

function roundedStroke(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.stroke();
}

function hex(hex: string, a: number) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function rightHandPos(w: number, h: number) {
  const cx = w * 0.4;
  const baseY = h * 0.64;
  const bodyW = 220, bodyH = 150, bodyY = baseY - bodyH / 2;
  const right = { x: cx + bodyW / 2 - 10, y: bodyY + 40 };
  return { x: right.x + 56, y: right.y + 10 };
}
