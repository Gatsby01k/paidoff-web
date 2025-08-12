// src/components/RobotAssistantCanvas.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Risk } from "../lib/deposits";

type Vec = { x: number; y: number };

type Props = {
  /** инкрементируй из родителя, чтобы запустить новую "сделку"/пульс */
  trigger?: number;
  risk?: Risk;
};

const W = 1000;
const H = 600;
const GRID = 40;
const NPTS = 120;

export default function RobotAssistantCanvas({ trigger = 0, risk = "LOW" }: Props) {
  const [series, setSeries] = useState<number[]>(() =>
    new Array(NPTS).fill(0).map((_, i) => 0.5 + 0.15 * Math.sin(i / 6))
  );
  const [pulse, setPulse] = useState(0); // 0..1 — для "сделки"
  const [hover, setHover] = useState(false);

  // плечо — базовая точка
  const shoulder = useMemo<Vec>(() => ({ x: 0.58, y: 0.60 }), []);
  // цвет акцента по риску
  const accent = risk === "HIGH" ? "#FB7185" : risk === "MEDIUM" ? "#F59E0B" : "#22C55E";

  // 1) Живой поток "цены"
  useEffect(() => {
    const id = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1];
        // лёгкое направление «вверх/вниз» + шум
        const drift = Math.sin(Date.now() / 1800) * 0.002;
        let next = last + (Math.random() - 0.5) * 0.025 + drift;
        next = Math.max(0.05, Math.min(0.95, next));
        const arr = prev.slice(1);
        arr.push(next);
        return arr;
      });
    }, 120);
    return () => clearInterval(id);
  }, []);

  // 2) Пульс при триггере
  useEffect(() => {
    if (trigger === 0) return;
    setPulse(0.001);
    let raf = 0;
    const t0 = performance.now();
    const run = (t: number) => {
      const dt = (t - t0) / 900;
      setPulse(Math.min(1, dt));
      if (dt < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  // 3) геометрия: последняя точка как цель
  const lastY = series[series.length - 1]; // 0..1
  const target: Vec = { x: 0.95, y: 0.08 + (1 - lastY) * 0.84 };

  // 4) "пружинное" приближение руки к цели
  const [hand, setHand] = useState<Vec>({ x: shoulder.x, y: shoulder.y });
  useEffect(() => {
    let raf = 0;
    const follow = () => {
      setHand((h) => {
        const k = 0.14; // скорость
        const nx = h.x + (target.x - h.x) * k;
        const ny = h.y + (target.y - h.y) * k;
        return { x: nx, y: ny };
      });
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [target.x, target.y]);

  // 5) путь для серии
  const path = useMemo(() => {
    const xs = series.map((_, i) => (i / (NPTS - 1)) * (W * 0.9));
    const ys = series.map((v) => 0.08 * H + (1 - v) * 0.84 * H);
    const ox = W * 0.05;
    let d = "";
    for (let i = 0; i < NPTS; i++) {
      const x = ox + xs[i];
      const y = ys[i];
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
  }, [series]);

  return (
    <div className="relative w-full h-full">
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${W} ${H}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* ---------- Фон / сетка ---------- */}
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B0B0B" />
            <stop offset="100%" stopColor="#0A0A0A" />
          </linearGradient>
          <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path d={`M${GRID} 0H0V${GRID}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          </pattern>
          <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#bgGrad)" />
        <rect x="0" y="0" width={W} height={H} fill="url(#grid)" />

        {/* ---------- "График" ---------- */}
        {/* area под линией */}
        <path
          d={`${path} L ${W * 0.95} ${H * 0.92} L ${W * 0.05} ${H * 0.92} Z`}
          fill="url(#area)"
          opacity="0.6"
        />
        {/* линия */}
        <path d={path} stroke={accent} strokeWidth={3} fill="none" opacity="0.9" />
        {/* бегущая точка (последняя) */}
        <circle cx={W * 0.95} cy={target.y * H} r={6} fill={accent} stroke="#fff" strokeOpacity="0.5" />

        {/* пульс при "сделке" */}
        <circle cx={W * 0.95} cy={target.y * H} r={20 + 120 * pulse} fill="url(#pulse)" />

        {/* ---------- Робот ---------- */}
        {/* тень */}
        <ellipse cx={shoulder.x * W} cy={H * 0.76} rx={90} ry={18} fill="rgba(0,0,0,0.55)" />
        {/* тело */}
        <rect
          x={shoulder.x * W - 70}
          y={shoulder.y * H - 40}
          width={140}
          height={110}
          rx={20}
          fill="#1F2937"
          stroke="rgba(255,255,255,0.12)"
        />
        {/* голова */}
        <g transform={`translate(${shoulder.x * W - 30}, ${shoulder.y * H - 100})`}>
          <rect width="60" height="50" rx="12" fill="#111827" stroke="rgba(255,255,255,0.15)" />
          <circle cx="18" cy="24" r="4" fill={hover ? accent : "#CBD5E1"} />
          <circle cx="42" cy="24" r="4" fill={hover ? accent : "#CBD5E1"} />
        </g>
        {/* рука */}
        <line
          x1={shoulder.x * W}
          y1={shoulder.y * H}
          x2={hand.x * W}
          y2={hand.y * H}
          stroke={accent}
          strokeWidth={8}
          strokeLinecap="round"
          opacity="0.95"
        />
        <circle cx={hand.x * W} cy={hand.y * H} r={10} fill={accent} />

        {/* рамка */}
        <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx={26} stroke="rgba(255,255,255,0.08)" fill="none" />
      </svg>
    </div>
  );
}
