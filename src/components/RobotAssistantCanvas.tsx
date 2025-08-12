// src/components/RobotAssistantCanvas.tsx
import React, { useEffect, useRef } from "react";
import type { Risk } from "../lib/deposits";

type Trade = { side: "LONG" | "SHORT"; change: number };

type Props = {
  trigger?: number;      // инкремент при вопросе → вспышка/лазер/бейдж сделки
  risk?: Risk;           // LOW/MEDIUM/HIGH → цвет/скорость
  trade?: Trade | null;  // чтобы отрисовать бейдж возле точки входа
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number };

export default function RobotAssistantCanvas({ trigger = 0, risk = "LOW", trade = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const ACCENT =
      risk === "HIGH" ? "#ff5c7a" : risk === "MEDIUM" ? "#f59e0b" : "#22c55e";

    // скорость/волатильность графика по риску
    const SPEED_MS = risk === "HIGH" ? 34 : risk === "MEDIUM" ? 42 : 54;
    const NOISE = risk === "HIGH" ? 0.055 : risk === "MEDIUM" ? 0.045 : 0.03;

    function resize() {
      const w = c.clientWidth,
        h = c.clientHeight;
      c.width = Math.floor(w * DPR);
      c.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      bgRef.current = buildBackground(w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    const W = () => c.clientWidth,
      H = () => c.clientHeight;

    // поток «цены»
    const MAX = 260;
    const series: number[] = Array.from({ length: MAX }, (_, i) => 0.55 + 0.15 * Math.sin(i / 7));

    // робот: плечо
    const shoulder = { x: () => W() * 0.56, y: () => H() * 0.64 };
    const L1 = () => Math.min(W(), H()) * 0.20;
    const L2 = () => Math.min(W(), H()) * 0.15;
    let a1 = -0.2,
      a2 = 0.9;

    // эффекты
    const sparks: Particle[] = [];
    let beamT = 0; // 0..1
    // трейл бегущей точки
    const trail: { x: number; y: number; life: number }[] = [];

    // бейдж сделки (показывается 1.6s)
    let badgeT = 0; // 0..1600 ms
    let lastTrig = trigger;

    // цикл
    let tPrev = performance.now();
    let acc = 0;
    let raf = 0;

    function step(t: number) {
      const dt = t - tPrev;
      tPrev = t;
      acc += dt;

      // обновление потока
      while (acc > SPEED_MS) {
        acc -= SPEED_MS;
        const last = series[series.length - 1];
        const drift = Math.sin(t / 1100) * 0.003;
        let next = last + (Math.random() - 0.5) * NOISE + drift;
        next = clamp(next, 0.06, 0.94);
        series.push(next);
        if (series.length > MAX) series.shift();
      }

      const ex = W() * 0.93;
      const ey = H() * (0.08 + (1 - series[series.length - 1]) * 0.84);

      // IK
      const sx = shoulder.x(),
        sy = shoulder.y();
      const dx = ex - sx,
        dy = ey - sy;
      const dist = Math.hypot(dx, dy);
      const l1 = L1(),
        l2 = L2();
      const d = clamp(dist, 0.0001, l1 + l2 - 0.0001);
      const base = Math.atan2(dy, dx);
      const cos1 = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
      const cos2 = clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1);
      const ta1 = base - Math.acos(cos1);
      const ta2 = Math.PI - Math.acos(cos2);
      const ALPHA = 0.3;
      a1 += (ta1 - a1) * ALPHA;
      a2 += (ta2 - a2) * ALPHA;

      // искры
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life += dt;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.012;
        if (p.life > p.max) sparks.splice(i, 1);
      }

      // затухание луча
      beamT = Math.max(0, beamT - dt / 300);

      // трейл
      trail.push({ x: ex, y: ey, life: 600 });
      while (trail.length > 40) trail.shift();
      for (const t of trail) t.life -= dt;

      // триггер сделки: вспышка + искры + бейдж
      if (trigger !== lastTrig) {
        lastTrig = trigger;
        beamT = 1;
        spawnSparks(sparks, ex, ey, ACCENT);
        badgeT = 1600;
      }
      if (badgeT > 0) badgeT -= dt;

      // рисуем
      draw(
        ctx,
        bgRef.current,
        W(),
        H(),
        series,
        ACCENT,
        sx,
        sy,
        a1,
        a2,
        l1,
        l2,
        ex,
        ey,
        sparks,
        beamT,
        trail,
        trade && badgeT > 0 ? trade : null,
        badgeT > 0 ? badgeT / 1600 : 0
      );

      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [trigger, risk, trade]);

  return (
    <div className="card p-2 h-full">
      <canvas ref={canvasRef} className="w-full h-full rounded-2xl block" />
    </div>
  );
}

/* ---------------- helpers ---------------- */

function buildBackground(w: number, h: number) {
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
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, h);
    g.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y);
    g.stroke();
  }
  // «звезды»
  for (let i = 0; i < 70; i++) {
    const x = ((i * 137) % w) * (i % 3 ? 1 : 0.8);
    const y = ((i * 263) % h) * (i % 2 ? 1 : 0.9);
    const r = (i % 3) * 0.6 + 0.4;
    g.fillStyle = "rgba(255,255,255,0.13)";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return off;
}

function draw(
  ctx: CanvasRenderingContext2D,
  bg: HTMLCanvasElement | null,
  w: number,
  h: number,
  series: number[],
  ACCENT: string,
  sx: number,
  sy: number,
  a1: number,
  a2: number,
  L1: number,
  L2: number,
  ex: number,
  ey: number,
  sparks: Particle[],
  beamT: number,
  trail: { x: number; y: number; life: number }[],
  trade: { side: "LONG" | "SHORT"; change: number } | null,
  badgeK: number
) {
  ctx.clearRect(0, 0, w, h);
  if (bg) ctx.drawImage(bg, 0, 0, w, h);

  const ox = w * 0.05,
    rx = w * 0.93;
  const yOf = (v: number) => h * (0.08 + (1 - v) * 0.84);

  // area
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, hex(ACCENT, 0.18));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(ox, h * 0.92);
  for (let i = 0; i < series.length; i++) {
    const x = ox + (i / (series.length - 1)) * (rx - ox);
    const y = yOf(series[i]);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(rx, h * 0.92);
  ctx.closePath();
  ctx.fill();

  // линия
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineWidth = 3;
  ctx.strokeStyle = ACCENT;
  ctx.shadowBlur = 14;
  ctx.shadowColor = ACCENT;
  ctx.beginPath();
  for (let i = 0; i < series.length; i++) {
    const x = ox + (i / (series.length - 1)) * (rx - ox);
    const y = yOf(series[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  // шлейф
  for (const t of trail) {
    if (t.life <= 0) continue;
    const k = t.life / 600;
    const r = 6 + 26 * k;
    ctx.beginPath();
    ctx.fillStyle = hex(ACCENT, 0.25 * k);
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // бегущая точка
  ctx.beginPath();
  ctx.fillStyle = ACCENT;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.arc(ex, ey, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // луч
  if (beamT > 0.01) {
    const ex1 = sx + Math.cos(a1) * L1;
    const ey1 = sy + Math.sin(a1) * L1;
    const k = beamT;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = hex(ACCENT, 0.6 * k);
    ctx.lineWidth = 6 * k;
    ctx.shadowBlur = 24;
    ctx.shadowColor = ACCENT;
    ctx.beginPath();
    ctx.moveTo(ex1, ey1);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.strokeStyle = hex(ACCENT, 0.18 * k);
    ctx.lineWidth = 16 * k;
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.moveTo(ex1, ey1);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();
  }

  // рука
  const ex1 = sx + Math.cos(a1) * L1;
  const ey1 = sy + Math.sin(a1) * L1;
  const hx = ex1 + Math.cos(a1 + a2) * L2;
  const hy = ey1 + Math.sin(a1 + a2) * L2;

  for (const wv of [10, 6]) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = wv === 10 ? hex(ACCENT, 0.25) : hex(ACCENT, 0.6);
    ctx.lineWidth = wv;
    ctx.shadowBlur = wv === 10 ? 18 : 12;
    ctx.shadowColor = ACCENT;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex1, ey1);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.restore();
  }

  glowCircle(ctx, hx, hy, 10, ACCENT);

  // корпус/голова
  rounded(ctx, sx - 74, sy - 48, 148, 124, 22, "#1f2937", "rgba(255,255,255,0.1)");
  rounded(ctx, sx - 34, sy - 116, 68, 56, 14, "#111827", "rgba(255,255,255,0.14)");
  const scan = 0.5 + 0.5 * Math.sin(performance.now() / 340);
  ctx.fillStyle = hex(ACCENT, 0.6);
  ctx.fillRect(sx - 22, sy - 90, 44 * scan, 6);

  // искры
  for (const p of sparks) {
    const k = 1 - p.life / p.max;
    const r = 2 + 2 * k;
    glowCircle(ctx, p.x, p.y, r, hex("#ffffff", 0.35 * k));
    glowCircle(ctx, p.x, p.y, r * 0.9, hex(ACCENT, 0.6 * k));
  }

  // бейдж сделки
  if (trade) {
    const txt = `${trade.side} ${trade.change > 0 ? "+" : ""}${trade.change}%`;
    drawBadge(ctx, ex + 10, ey - 10, txt, trade.side === "LONG" ? ACCENT : "#f87171", badgeK);
  }

  // рамка
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  roundedStroke(ctx, 1.5, 1.5, w - 3, h - 3, 22);
}

function spawnSparks(arr: Particle[], x: number, y: number, col: string) {
  for (let i = 0; i < 42; i++) {
    const a = (Math.PI * 2 * i) / 42 + (Math.random() - 0.5) * 0.25;
    const s = 1.2 + Math.random() * 2.4;
    arr.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 520 + Math.random() * 380 });
  }
}

function drawBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, k: number) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, k * 1.2)); // плавный фейд
  ctx.font = "bold 12px system-ui, -apple-system, Segoe UI, Roboto";
  const padX = 8,
    padY = 6;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
  const h = 24;
  rounded(ctx, x, y - h, w, h, 8, "rgba(0,0,0,0.65)", "rgba(255,255,255,0.08)");
  ctx.fillStyle = color;
  ctx.fillText(text, x + padX, y - 8);
  ctx.restore();
}

function glowCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke: string
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
  ctx.strokeStyle = stroke;
  ctx.stroke();
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

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function hex(hex: string, a: number) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16),
    g = parseInt(n.slice(2, 4), 16),
    b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
