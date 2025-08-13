import React, { useEffect, useMemo, useRef, useState } from "react";

/** Простая генерация потока цен (псевдо-рынок) */
function usePriceFeed(points = 240) {
  const [data, setData] = useState<number[]>(() => {
    const arr: number[] = [];
    let v = 76 + Math.random();
    for (let i = 0; i < points; i++) {
      v += (Math.random() - 0.5) * 0.35 + Math.sin(i * 0.035) * 0.05;
      arr.push(v);
    }
    return arr;
  });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      if (t - last > 42) {
        last = t;
        setData((prev) => {
          const next = prev.slice(1);
          const lastV = prev[prev.length - 1];
          const v = lastV + (Math.random() - 0.5) * 0.35 + Math.sin(t * 0.0018) * 0.06;
          next.push(v);
          return next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const last = data[data.length - 1] ?? 0;
  return { data, min, max, last };
}

type RobotChartProps = {
  title?: string;
  onAsk?: () => void;
  chatOpen?: boolean;
};

export default function RobotChart({ title = "AI Trading Console", onAsk, chatOpen }: RobotChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  // поток цен
  const { data, min, max, last } = usePriceFeed(220);

  // положение «руки» робота в координатах панели
  const [arm, setArm] = useState({ x: 0, y: 0 });

  /** Рисуем график каждые 1–2 кадра */
  useEffect(() => {
    const cvs = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cvs || !wrap) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    cvs.width = Math.floor(w * dpr);
    cvs.height = Math.floor(h * dpr);
    cvs.style.width = `${w}px`;
    cvs.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const pad = 16;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;

    // grid
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(pad, pad);
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "rgba(255,214,10,0.08)";
    for (let gx = 0; gx <= innerW; gx += 32) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, innerH);
      ctx.stroke();
    }
    for (let gy = 0; gy <= innerH; gy += 32) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(innerW, gy);
      ctx.stroke();
    }
    ctx.restore();

    // map price -> y
    const mapY = (v: number) => {
      const t = (v - min) / (max - min || 1);
      return pad + innerH - t * innerH;
    };

    // line
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#60ffd0";
    ctx.beginPath();
    const stepX = innerW / (data.length - 1);
    data.forEach((v, i) => {
      const x = pad + i * stepX;
      const y = mapY(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // last point marker glow
    const lx = pad + (data.length - 1) * stepX;
    const ly = mapY(last);
    ctx.fillStyle = "rgba(255,214,10,0.9)";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255,214,10,0.75)";
    ctx.beginPath();
    ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // отдадим руке координаты цели
    setArm({ x: lx, y: ly });

    // курсор-светляк (мягко тянется)
    const cd = cursorRef.current;
    if (cd) {
      const r = cd.getBoundingClientRect();
      const dx = lx + pad;
      const dy = ly + pad;
      cd.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  }, [data, min, max, last]);

  return (
    <div className="robot-panel p-4">
      <div className="robot-panel-header flex items-center justify-between rounded-xl px-2 py-2">
        <div className="text-sm font-medium text-yellow-200/80">{title}</div>
        <button onClick={onAsk} className="btn-glow px-4 py-2 text-sm font-semibold">
          {chatOpen ? "Скрыть чат" : "Спросить робота"}
        </button>
      </div>

      <div ref={wrapRef} className="relative mt-3 grid-overlay h-[420px] rounded-xl overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* курсор-светляк у последней свечи */}
        <div ref={cursorRef} className="cursor-dot" />

        {/* ROBOT overlay */}
        <WalleBotOverlay arm={arm} />
      </div>
    </div>
  );
}

/** Робот в стиле WALL·E (SVG), следит головой за точкой arm, моргает.
 *  Лёгкий и «живой»: градиенты, тени, параллакс.
 */
function WalleBotOverlay({ arm }: { arm: { x: number; y: number } }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const rightArmRef = useRef<SVGGElement>(null);

  // слежение головы/глаз за последней точкой
  useEffect(() => {
    const svg = svgRef.current;
    const head = headRef.current;
    const eyes = eyesRef.current;
    const rarm = rightArmRef.current;
    if (!svg || !head || !eyes || !rarm) return;

    const box = svg.getBoundingClientRect();
    const cx = arm.x; // внутренняя координата уже из canvas-расчёта
    const cy = arm.y;

    // расчёт углов
    const hx = 350, hy = 190; // центр вращения головы (визуально оттюнен)
    const angleHead = (Math.atan2(cy - hy, cx - hx) * 180) / Math.PI - 90;
    head.style.transform = `rotate(${angleHead * 0.35}deg)`; // смягчаем

    // сдвиг глаз в сторону цели
    const ex = Math.max(-6, Math.min(6, (cx - hx) * 0.02));
    const ey = Math.max(-4, Math.min(4, (cy - hy) * 0.02));
    (eyes.querySelector("#pupilL") as SVGCircleElement).setAttribute("cx", String(310 + ex));
    (eyes.querySelector("#pupilL") as SVGCircleElement).setAttribute("cy", String(205 + ey));
    (eyes.querySelector("#pupilR") as SVGCircleElement).setAttribute("cx", String(370 + ex));
    (eyes.querySelector("#pupilR") as SVGCircleElement).setAttribute("cy", String(210 + ey));

    // рука тянется к последней свече
    const baseX = 455, baseY = 310;
    const ang = (Math.atan2(cy - baseY, cx - baseX) * 180) / Math.PI;
    rarm.style.transform = `rotate(${ang}deg)`;
  }, [arm.x, arm.y]);

  return (
    <svg
      ref={svgRef}
      className="robot-svg absolute inset-0 pointer-events-none"
      viewBox="0 0 720 480"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Тени от корпуса */}
      <ellipse cx="270" cy="420" rx="90" ry="14" fill="rgba(0,0,0,.55)" />
      <ellipse cx="430" cy="430" rx="76" ry="12" fill="rgba(0,0,0,.45)" />

      {/* Корпус */}
      <g className="robot-body">
        <rect x="180" y="260" width="220" height="150" rx="18" />
        <rect className="robot-paneling" x="205" y="286" width="170" height="100" rx="12" />
        {/* «царапки» */}
        <g opacity=".22" fill="#000">
          <rect x="220" y="310" width="68" height="6" rx="3" />
          <rect x="310" y="318" width="56" height="6" rx="3" />
          <rect x="240" y="336" width="54" height="6" rx="3" />
          <rect x="304" y="350" width="64" height="6" rx="3" />
          <rect x="230" y="366" width="80" height="6" rx="3" />
        </g>
      </g>

      {/* Левая рука — мягко плавает */}
      <g className="robot-arm-left" transform="translate(200,320)">
        <rect x="-12" y="-8" width="120" height="16" rx="8" fill="url(#armGrad)" />
        <circle cx="-8" cy="0" r="8" fill="url(#armGlow)" />
      </g>

      {/* Правая рука — направляется на цель графика */}
      <g ref={rightArmRef} className="robot-arm-right" transform="translate(455,310)">
        <rect x="0" y="-6.5" width="120" height="13" rx="6.5" fill="url(#armGrad)" />
        <circle cx="120" cy="0" r="7" fill="url(#armGlow)" />
      </g>

      {/* Голова */}
      <g ref={headRef} className="robot-head">
        <rect x="260" y="170" width="220" height="110" rx="18" fill="#22252c" stroke="#0c0d11" strokeWidth="2" />
        {/* Очки/обрамление */}
        <rect x="285" y="192" width="168" height="68" rx="14" fill="#0f1116" stroke="#1b1f27" strokeWidth="2" />

        {/* Глаза */}
        <g ref={eyesRef} className="robot-eyes">
          <circle id="eyeL" className="robot-eye" cx="310" cy="210" r="22" />
          <circle id="pupilL" className="robot-eye-pupil" cx="310" cy="205" r="8" />
          <circle className="eye-glint" cx="306" cy="201" r="2.2" opacity=".9" />

          <circle id="eyeR" className="robot-eye" cx="370" cy="216" r="22" />
          <circle id="pupilR" className="robot-eye-pupil" cx="370" cy="210" r="8" />
          <circle className="eye-glint" cx="366" cy="206" r="2.2" opacity=".9" />
        </g>
      </g>

      {/* Градиенты рук/свечения */}
      <defs>
        <radialGradient id="armGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe36d" />
          <stop offset="100%" stopColor="#ffd60a" />
        </radialGradient>
        <linearGradient id="armGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffd60a" />
          <stop offset="60%" stopColor="#f1c40f" />
          <stop offset="100%" stopColor="#b58900" />
        </linearGradient>
      </defs>
    </svg>
  );
}
