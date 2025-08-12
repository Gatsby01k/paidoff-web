// src/components/RobotAssistantCanvas.tsx
import React, { useEffect, useRef } from "react";
import type { Risk } from "../lib/deposits";

type Props = {
  trigger?: number; // инкрементируй из родителя, чтобы запустить "вспышку сделки"
  risk?: Risk;      // влияет на цвет акцента
};

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; max: number;
};

export default function RobotAssistantCanvas({ trigger = 0, risk = "LOW" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<any>(null);
  const gridRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    // размеры
    function resize() {
      const w = c.clientWidth;
      const h = c.clientHeight;
      c.width = Math.floor(w * DPR);
      c.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // пересоберём грид
      gridRef.current = buildGrid(w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    // цвет по риску
    const ACCENT = risk === "HIGH" ? "#ff5c7a" : risk === "MEDIUM" ? "#F59E0B" : "#22c55e";

    // начальное состояние
    const W = () => c.clientWidth;
    const H = () => c.clientHeight;

    const series: number[] = [];
    const MAX = 220; // количество точек
    for (let i = 0; i < MAX; i++) series.push(0.55 + 0.15 * Math.sin(i / 8));

    const particles: Particle[] = [];

    // плечо (позиция робота)
    const shoulder = { x: () => W() * 0.56, y: () => H() * 0.62 };
    // длины сегментов руки (в px)
    const L1 = () => Math.min(W(), H()) * 0.18;
    const L2 = () => Math.min(W(), H()) * 0.14;

    // углы для IK (гладко апдейтим)
    let a1 = 0, a2 = 0;

    // смещения шума
    let t0 = performance.now();
    let lastPointTime = 0;

    // цель руки = последняя точка "цены"
    function target() {
      const y = series[series.length - 1]; // 0..1
      return {
        x: W() * 0.92,
        y: H() * (0.08 + (1 - y) * 0.84),
      };
    }

    function spawnBurst(x: number, y: number, color: string) {
      for (let i = 0; i < 36; i++) {
        const ang = (Math.PI * 2 * i) / 36 + Math.random() * 0.2;
        const spd = 1.2 + Math.random() * 2.2;
        particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          max: 450 + Math.random() * 350,
        });
      }
    }

    function step(now: number) {
      const dt = now - t0;
      t0 = now;

      // --- обновляем серию (быстрый поток)
      lastPointTime += dt;
      const ADD_MS = 45; // чем меньше — тем быстрее кривая
      while (lastPointTime > ADD_MS) {
        lastPointTime -= ADD_MS;
        const last = series[series.length - 1];
        const drift = Math.sin(now / 1200) * 0.004;
        let next = last + (Math.random() - 0.5) * 0.04 + drift;
        next = Math.max(0.06, Math.min(0.94, next));
        series.push(next);
        if (series.length > MAX) series.shift();
      }

      // --- IK до цели
      const tgt = target();
      const sx = shoulder.x(), sy = shoulder.y();
      const dx = tgt.x - sx, dy = tgt.y - sy;
      const dist = Math.hypot(dx, dy);
      const l1 = L1(), l2 = L2();
      const clamped = Math.min(Math.max(dist, 0.0001), l1 + l2 - 0.0001);

      // косинусная теорема
      const base = Math.atan2(dy, dx);
      const cos1 = (l1 * l1 + clamped * clamped - l2 * l2) / (2 * l1 * clamped);
      const cos2 = (l1 * l1 + l2 * l2 - clamped * clamped) / (2 * l1 * l2);
      const ta1 = base - Math.acos(Math.max(-1, Math.min(1, cos1)));
      const ta2 = Math.PI - Math.acos(Math.max(-1, Math.min(1, cos2)));

      // сгладим углы (быстро, но без рывков)
      const ALPHA = 0.25;
      a1 = a1 + (ta1 - a1) * ALPHA;
      a2 = a2 + (ta2 - a2) * ALPHA;

      // --- частицы
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.01; // лёгкая "гравитация"
        if (p.life > p.max) particles.splice(i, 1);
      }

      // --- рисуем
      draw(ctx, W(), H(), series, ACCENT, sx, sy, a1, a2, l1, l2, particles, gridRef.current);

      raf = requestAnimationFrame(step);
    }

    // слушаем триггеры "сделки"
    let lastTrigger = trigger;
    let raf = requestAnimationFrame(step);

    const id = setInterval(() => {
      if (trigger !== lastTrigger) {
        lastTrigger = trigger;
        const t = target();
        spawnBurst(t.x, t.y, ACCENT);
      }
    }, 60);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, risk]);

  return (
    <div className="card p-2 h-full">
      <canvas ref={canvasRef} className="w-full h-full rounded-2xl block" />
    </div>
  );
}

/* ---------------- helpers ---------------- */

function buildGrid(w: number, h: number) {
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const g = off.getContext("2d")!;
  // фон
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#0b0b0b");
  grad.addColorStop(1, "#090909");
  g.fillStyle = grad;
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

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  series: number[],
  accent: string,
  sx: number, sy: number,
  a1: number, a2: number,
  L1: number, L2: number,
  particles: Particle[],
  grid: HTMLCanvasElement | null
) {
  // очистка + фон/грид
  ctx.clearRect(0, 0, w, h);
  if (grid) ctx.drawImage(grid, 0, 0, w, h);

  // неоновая тень
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // путь кривой
  const ox = w * 0.05;
  const ex = w * 0.92;
  const baseY = (val: number) => h * (0.08 + (1 - val) * 0.84);

  ctx.lineWidth = 3;
  ctx.strokeStyle = accent;
  ctx.beginPath();
  for (let i = 0; i < series.length; i++) {
    const x = ox + (i / (series.length - 1)) * (ex - ox);
    const y = baseY(series[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.shadowBlur = 12;
  ctx.shadowColor = accent;
  ctx.stroke();

  // area под кривой
  const lastY = baseY(series[series.length - 1]);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, hexToRgba(accent, 0.18));
  grad.addColorStop(1, hexToRgba(accent, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(ox, h * 0.92);
  for (let i = 0; i < series.length; i++) {
    const x = ox + (i / (series.length - 1)) * (ex - ox);
    const y = baseY(series[i]);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(ex, h * 0.92);
  ctx.closePath();
  ctx.fill();

  // бегущая точка + пульс
  ctx.shadowBlur = 20;
  ctx.fillStyle = accent;
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.arc(ex, lastY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // частицы-искры
  for (const p of particles) {
    const k = 1 - p.life / p.max;
    const r = 2 + 2 * k;
    ctx.shadowBlur = 10;
    ctx.fillStyle = hexToRgba("#ffffff", 0.35 * k);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 18;
    ctx.fillStyle = hexToRgba(accent, 0.6 * k);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // робот: тело
  roundedRect(ctx, sx - 70, sy - 44, 140, 120, 20, "#1f2937", "rgba(255,255,255,0.1)");

  // голова (сканирующие глаза)
  roundedRect(ctx, sx - 30, sy - 108, 60, 52, 12, "#111827", "rgba(255,255,255,0.15)");
  const blink = 0.5 + 0.5 * Math.sin(performance.now() / 300);
  circle(ctx, sx - 12, sy - 82, 4, hexToRgba(accent, 0.7 + 0.3 * blink));
  circle(ctx, sx + 12, sy - 82, 4, hexToRgba(accent, 0.7 + 0.3 * (1 - blink)));

  // рука (2 сегмента IK)
  const ex1 = sx + Math.cos(a1) * L1;
  const ey1 = sy + Math.sin(a1) * L1;
  const hx = ex1 + Math.cos(a1 + a2) * L2;
  const hy = ey1 + Math.sin(a1 + a2) * L2;

  // плечо → локоть
  ctx.lineWidth = 10;
  ctx.strokeStyle = hexToRgba(accent, 0.95);
  ctx.shadowBlur = 12;
  ctx.shadowColor = accent;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex1, ey1);
  ctx.stroke();

  // локоть → кисть
  ctx.beginPath();
  ctx.moveTo(ex1, ey1);
  ctx.lineTo(hx, hy);
  ctx.stroke();

  // кисть
  ctx.shadowBlur = 16;
  circle(ctx, hx, hy, 10, accent);

  // рамка карточки
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  roundedRectStroke(ctx, 1.5, 1.5, w - 3, h - 3, 22);
}

function hexToRgba(hex: string, a: number) {
  const n = hex.replace("#", "");
  const r = parseInt(n.substring(0, 2), 16);
  const g = parseInt(n.substring(2, 4), 16);
  const b = parseInt(n.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill = "#111", stroke = "transparent"
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke !== "transparent") {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function roundedRectStroke(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.stroke();
}
