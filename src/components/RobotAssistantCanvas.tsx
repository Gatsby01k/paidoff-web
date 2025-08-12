// src/components/RobotAssistantCanvas.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Risk } from "../lib/deposits";

type Props = {
  onAsk?: () => void;
  /** увеличить на 1, чтобы запустить новую «сделку» анимацией */
  trigger?: number;
  risk?: Risk; // для цвета свечения и подсказок
};

type Vec = { x: number; y: number };

export default function RobotAssistantCanvas({ onAsk, trigger = 0, risk = "LOW" }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [target, setTarget] = useState<Vec>({ x: 0.75, y: 0.28 }); // нормализованные координаты 0..1
  const [progress, setProgress] = useState(0); // 0..1 — анимация руки
  const [pulse, setPulse] = useState(0); // 0..1 — радиус пульса точки входа
  const [hover, setHover] = useState(false);

  // плечо (шарнир) — базовая точка в долях
  const shoulder = useMemo<Vec>(() => ({ x: 0.58, y: 0.60 }), []);

  // Цвет акцента по риску
  const accent = risk === "HIGH" ? "#FB7185" : risk === "MEDIUM" ? "#F59E0B" : "#22C55E";

  // ease
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);

  // анимация движения к цели
  useEffect(() => {
    let raf = 0;
    let start = performance.now();

    function tick(now: number) {
      const dt = (now - start) / 700; // 0.7s на полёт
      const t = Math.min(1, dt);
      setProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setPulse(0.001);
        // дожимаем пульс
        const start2 = performance.now();
        const loop2 = (n: number) => {
          const tt = (n - start2) / 700;
          setPulse(Math.min(1, tt));
          if (tt < 1) requestAnimationFrame(loop2);
        };
        requestAnimationFrame(loop2);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  // при триггере выбираем новую цель (верхняя правая зона)
  useEffect(() => {
    const tx = 0.62 + Math.random() * 0.30;
    const ty = 0.15 + Math.random() * 0.25;
    setTarget({ x: tx, y: ty });
    setProgress(0);
    setPulse(0);
  }, [trigger]);

  // вычисление текущей точки кисти
  const hand = useMemo<Vec>(() => {
    const t = ease(progress);
    const x = shoulder.x + (target.x - shoulder.x) * t;
    const y = shoulder.y + (target.y - shoulder.y) * t;
    return { x, y };
  }, [progress, shoulder, target]);

  // geo helper
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 1000 600"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Фон */}
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B0B0B" />
            <stop offset="100%" stopColor="#0A0A0A" />
          </linearGradient>

          {/* сетка */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          </pattern>

          {/* свечение для цели */}
          <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="1000" height="600" fill="url(#bgGrad)" />
        <rect x="0" y="0" width="1000" height="600" fill="url(#grid)" />

        {/* Немного «звёзд» */}
        {Array.from({ length: 70 }).map((_, i) => {
          const x = (i * 137) % 1000;
          const y = ((i * 263) % 600) * (i % 2 ? 0.8 : 1);
          const r = (i % 3) * 0.6 + 0.4;
          return <circle key={i} cx={x} cy={y} r={r} fill="rgba(255,255,255,0.15)" />;
        })}

        {/* Цель */}
        <g>
          <circle
            cx={target.x * 1000}
            cy={target.y * 600}
            r={20 + 80 * pulse}
            fill="url(#pulse)"
          />
          <circle
            cx={target.x * 1000}
            cy={target.y * 600}
            r={6}
            fill={accent}
            stroke="white"
            strokeOpacity={0.35}
          />
        </g>

        {/* Робот */}
        <g>
          {/* Тень робота */}
          <ellipse
            cx={shoulder.x * 1000}
            cy={lerp(shoulder.y * 600, 600, 0.25)}
            rx={90}
            ry={18}
            fill="rgba(0,0,0,0.5)"
          />

          {/* Тело */}
          <rect
            x={shoulder.x * 1000 - 70}
            y={shoulder.y * 600 - 40}
            width={140}
            height={110}
            rx={20}
            fill="#1F2937"
            stroke="rgba(255,255,255,0.12)"
          />

          {/* Голова */}
          <g transform={`translate(${shoulder.x * 1000 - 30}, ${shoulder.y * 600 - 100})`}>
            <rect width="60" height="50" rx="12" fill="#111827" stroke="rgba(255,255,255,0.15)" />
            {/* глаза */}
            <circle cx="18" cy="24" r="4" fill={hover ? accent : "#CBD5E1"} />
            <circle cx="42" cy="24" r="4" fill={hover ? accent : "#CBD5E1"} />
          </g>

          {/* Плечо/кисть (анимация) */}
          <g>
            {/* плечо – линия */}
            <line
              x1={shoulder.x * 1000}
              y1={shoulder.y * 600}
              x2={hand.x * 1000}
              y2={hand.y * 600}
              stroke={accent}
              strokeWidth={8}
              strokeLinecap="round"
              opacity={0.9}
            />
            {/* кисть */}
            <circle cx={hand.x * 1000} cy={hand.y * 600} r={10} fill={accent} />
          </g>
        </g>

        {/* рамка */}
        <rect
          x="1.5"
          y="1.5"
          width="997"
          height="597"
          rx="26"
          stroke="rgba(255,255,255,0.08)"
          fill="none"
        />
      </svg>

      {/* кнопка внизу справа поверх, если нужно «подтолкнуть» к вопросу */}
      <div className="absolute right-4 bottom-4">
        <button className="btn-primary px-4 py-2" onClick={onAsk}>
          Спросить робота
        </button>
      </div>
    </div>
  );
}
