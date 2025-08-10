import React, { useEffect, useMemo, useRef, useState } from "react";

type Candle = { open: number; close: number; high: number; low: number };

function genNext(prev: Candle): Candle {
  const drift = (Math.random() - 0.5) * 6; // волатильность
  const open = prev.close;
  const close = Math.max(20, Math.min(180, open + drift));
  const high = Math.max(open, close) + Math.random() * 8;
  const low = Math.min(open, close) - Math.random() * 8;
  return { open, close, high, low };
}

export default function LiveChart({ speed = 900 }: { speed?: number }) {
  const [data, setData] = useState<Candle[]>(() => {
    let d: Candle[] = [{ open: 80, close: 84, high: 90, low: 74 }];
    for (let i = 0; i < 26; i++) d.push(genNext(d[d.length - 1]));
    return d;
  });
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setData((arr) => {
        const next = genNext(arr[arr.length - 1]);
        return [...arr.slice(1), next];
      });
    }, speed);
    return () => clearInterval(t);
  }, [speed]);

  const line = useMemo(() => {
    const pts = data.map((c, i) => {
      const x = 12 + i * 12;
      const y = 190 - c.close; // 0..200
      return `${x},${y}`;
    });
    return `M${pts[0]} L${pts.slice(1).join(" ")}`;
  }, [data]);

  return (
    <div className="rounded-3xl bg-gradient-to-b from-neutral-800 to-neutral-950 relative overflow-hidden">
      <svg viewBox="0 0 360 200" className="w-full h-72">
        {/* свечи */}
        {data.map((c, i) => {
          const x = 12 + i * 12;
          const up = c.close >= c.open;
          const bodyH = Math.max(2, Math.abs(c.close - c.open));
          const bodyY = 190 - Math.max(c.close, c.open);
          const highY = 190 - c.high;
          const lowY = 190 - c.low;
          const color = up ? "#36D399" : "#F87171";
          return (
            <g key={i} className="transition-all duration-500 ease-out">
              <rect x={x + 4} y={highY} width="2" height={lowY - highY} fill={color} />
              <rect x={x} y={bodyY} width="10" height={bodyH} rx="2" fill={color} />
            </g>
          );
        })}
        {/* линия */}
        <path ref={pathRef} d={line} stroke="#22D3EE" strokeWidth="3" fill="none" />
      </svg>

      {/* бейджи */}
      <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-[#0e0f11] border border-yellow-500/25 text-yellow-300 text-xs font-bold">
        Realtime (demo)
      </div>
      <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-[#0e0f11] border border-yellow-500/25 text-yellow-300 text-xs font-bold">
        APR (mo) ~ 5–28%
      </div>
    </div>
  );
}
