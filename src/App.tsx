import React, { useMemo, useState } from "react";
import "./styles.css";

type Risk = "LOW" | "MEDIUM" | "HIGH";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-2 rounded-2xl bg-neutral-900 text-yellow-400 border border-yellow-500/20 shadow-[0_0_30px_rgba(255,235,0,0.25)]">
      <div className="text-xs text-yellow-300/70">{label}</div>
      <div className="text-xl font-black tracking-wide">{value}</div>
    </div>
  );
}

export default function App() {
  const [risk, setRisk] = useState<Risk>("LOW");
  const [amount, setAmount] = useState(250);
  const [months, setMonths] = useState(1);

  const pr = useMemo(() => {
    if (risk === "LOW") return 0.05;
    if (risk === "MEDIUM") return 0.12;
    return 0.28;
  }, [risk]);

  const projected = useMemo(
    () => (amount * (1 + pr * months)).toFixed(2),
    [amount, pr, months]
  );

  return (
    <div className="min-h-screen bg-black text-yellow-300">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-4 border-b border-yellow-500/20">
        <div className="h-9 w-9 rounded-md bg-yellow-400" />
        <div className="font-black text-2xl tracking-widest">
          PAID<span className="bg-yellow-400 text-black px-1 rounded">OFF</span>
        </div>
        <div className="ml-auto text-sm text-yellow-300/80">
          AUTOMATED TRADING (AI)
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-8 items-stretch">
        {/* Left - text */}
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            Авто-трейдинг на ИИ с фиксированным сроком и риском
          </h1>
          <p className="text-yellow-300/80">
            Выбери риск-профиль, сумму и срок. Средства блокируются на период,
            а ИИ-стратегия торгует за тебя.
          </p>

          <div className="flex gap-3">
            {(["LOW", "MEDIUM", "HIGH"] as Risk[]).map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`px-5 py-3 rounded-2xl font-black tracking-wide transition border ${
                  risk === r
                    ? "bg-yellow-400 text-black border-yellow-400 shadow-[0_0_30px_rgba(255,235,0,0.35)]"
                    : "bg-neutral-900 text-yellow-400 border-yellow-500/30 hover:border-yellow-400/60"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-yellow-300/70">Сумма (USDT)</label>
              <input
                type="number"
                min={50}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1 w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-yellow-500/20 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs text-yellow-300/70">Срок (мес.)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="mt-1 w-full px-4 py-3 rounded-2xl bg-neutral-900 border border-yellow-500/20 focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-yellow-500/20">
            <div className="text-yellow-300/80">Прогноз на выплату</div>
            <div className="text-2xl font-black">
              {projected} <span className="text-sm font-semibold">USDT</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="px-6 py-4 rounded-3xl bg-yellow-400 text-black font-black text-lg tracking-wider hover:shadow-[0_0_30px_rgba(255,235,0,0.35)] transition">
              CONNECT WALLET & PAYOFF
            </button>
            <a
              className="px-6 py-4 rounded-3xl bg-neutral-900 text-yellow-400 font-black text-lg tracking-wider border border-yellow-500/30 hover:border-yellow-400/60 transition"
              href="#"
            >
              View Plans
            </a>
          </div>
        </div>

        {/* Right - chart mock */}
        <div className="rounded-3xl bg-neutral-900 border border-yellow-500/20 p-4 shadow-[0_0_30px_rgba(255,235,0,0.15)]">
          <div className="text-yellow-300/80 font-semibold mb-2">
            AI Trading Simulation
          </div>
          <div className="rounded-2xl h-72 bg-gradient-to-b from-neutral-800 to-neutral-950 relative overflow-hidden">
            <svg viewBox="0 0 400 200" className="absolute inset-0">
              {[...Array(30)].map((_, i) => {
                const x = i * 13 + 10;
                const up = i % 3 !== 0;
                const body = Math.random() * 60 + 10;
                const y = 40 + Math.random() * 80;
                const color = up ? "#36D399" : "#F87171";
                return (
                  <g key={i}>
                    <rect x={x} y={y} width="8" height={body} rx="2" fill={color} />
                    <rect x={x + 3} y={y - 20} width="2" height={body + 40} fill={color} />
                  </g>
                );
              })}
              <path
                d="M0,150 C80,20 160,180 240,70 320,100 360,60 400,120"
                stroke="#22D3EE"
                strokeWidth="3"
                fill="none"
              />
              <circle cx="240" cy="70" r="5" fill="#22D3EE" />
            </svg>
            <div className="absolute top-3 left-3">
              <Stat label="Signal" value={risk} />
            </div>
            <div className="absolute bottom-3 right-3">
              <Stat label="PR/mo" value={(pr * 100).toFixed(0) + "%"} />
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-xs text-yellow-300/60">
        © PaidOFF {new Date().getFullYear()}. All rights reserved.
      </footer>
    </div>
  );
}
