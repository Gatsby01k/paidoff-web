import React, { useEffect, useMemo, useState } from "react";

export type Position = {
  id: string;
  address: `0x${string}`;
  chainId: number;
  amount: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  months: number;
  apr: number;          // в долях: 0.05 / 0.12 / 0.26
  start: number;        // ms
  end: number;          // ms
};

const KEY = "paidoff_positions_v1";

function load(): Position[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(data: Position[]) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Positions() {
  const [items, setItems] = useState<Position[]>(load());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => save(items), [items]);

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-yellow-500/20 p-4 text-yellow-200/80 bg-black/30">
        Нет активных позиций. Начни автоторговлю, и они появятся здесь.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((p) => {
        const now = Date.now();
        const left = Math.max(0, p.end - now);
        const sec = Math.floor(left / 1000);
        const dd = Math.floor(sec / 86400);
        const hh = Math.floor((sec % 86400) / 3600);
        const mm = Math.floor((sec % 3600) / 60);
        const ss = sec % 60;

        let out = p.amount;
        for (let i = 0; i < p.months; i++) out *= 1 + p.apr;

        const done = left <= 0;

        return (
          <div key={p.id} className="rounded-xl border border-yellow-500/20 p-4 bg-black/30">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded-md border border-yellow-400/30 text-yellow-200/90">
                {p.risk}
              </span>
              <span className="opacity-70">|</span>
              <span className="opacity-70">months: {p.months}</span>
              <span className="opacity-70">|</span>
              <span className="opacity-70">APR: {Math.round(p.apr * 100)}%</span>
              <span className="ml-auto text-xs opacity-60">
                {p.address.slice(0, 6)}…{p.address.slice(-4)} · chain {p.chainId}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-yellow-200">
              <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/10">
                <div className="text-xs opacity-70 mb-1">Депонировано</div>
                <div className="text-xl font-bold">{fmt(p.amount)} <span className="text-xs opacity-60">USDT</span></div>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-yellow-500/10">
                <div className="text-xs opacity-70 mb-1">{done ? "Ожидаемая выплата" : "Прогноз на выплату"}</div>
                <div className="text-xl font-bold">{fmt(out)} <span className="text-xs opacity-60">USDT</span></div>
              </div>
            </div>
            <div className="mt-3 text-sm">
              {done ? (
                <span className="px-2 py-1 rounded-md bg-yellow-400 text-black font-semibold">Готово к выводу (мок)</span>
              ) : (
                <span className="opacity-80">
                  До разблокировки: <b>{dd}d {hh}h {mm}m {ss}s</b>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* helper для добавления позиции извне */
export function addMockPosition(p: Position) {
  const data = load();
  data.unshift(p);
  save(data);
}
