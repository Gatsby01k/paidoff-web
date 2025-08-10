import React, { useMemo, useState } from "react";
import "./styles.css";
import RobotGLTFChart from "./components/RobotGLTFChart";

type Risk = "LOW" | "MEDIUM" | "HIGH";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-2 rounded-2xl bg-neutral-900 text-yellow-400 shadow-[0_0_30px_rgba(255,215,0,.08)]">
      <div className="text-xs text-yellow-300/70">{label}</div>
      <div className="text-xl font-black tracking-wide">{value}</div>
    </div>
  );
}

export default function App() {
  const [risk, setRisk] = useState<Risk>("LOW");
  const [amount, setAmount] = useState(500);
  const [months, setMonths] = useState(1);

  const apr = useMemo(() => (risk === "LOW" ? 0.05 : risk === "MEDIUM" ? 0.12 : 0.22), [risk]);
  const payout = useMemo(() => (amount * (1 + apr) ** months).toFixed(2), [amount, months, apr]);

  return (
    <div className="min-h-screen bg-black text-yellow-300 font-sans">
      <header className="flex items-center justify-between p-4 border-b border-yellow-500/30">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-sm bg-yellow-400" />
          <h1 className="font-extrabold tracking-wider text-yellow-300">PAIDOFF</h1>
        </div>
        <nav className="hidden sm:flex gap-8 text-sm text-yellow-200/80">
          <a>Whitepaper</a>
          <a>Docs</a>
          <a>Security</a>
        </nav>
        <button className="px-4 py-2 bg-yellow-400 text-black rounded-full font-bold">CONNECT WALLET</button>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-5xl sm:text-6xl font-extrabold leading-tight text-yellow-300">
            Авто-трейдинг на ИИ <br /> с фиксированным <br /> сроком и риском
          </h2>

          <p className="mt-5 text-yellow-200/80">
            Выбери риск-профиль, сумму и срок. Средства блокируются на период, а ИИ-стратегия торгует за тебя.
          </p>

          <div className="mt-6 flex gap-3">
            {(["LOW", "MEDIUM", "HIGH"] as Risk[]).map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`px-6 py-3 rounded-full font-bold ${
                  risk === r ? "bg-yellow-400 text-black" : "bg-neutral-900 text-yellow-300"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-xs mb-1 text-yellow-200/70">Сумма (USDT)</label>
              <input
                type="number"
                className="bg-neutral-900 border border-yellow-400/30 rounded-xl px-3 py-3 outline-none"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value || 0))}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs mb-1 text-yellow-200/70">Срок (мес.)</label>
              <input
                type="number"
                className="bg-neutral-900 border border-yellow-400/30 rounded-xl px-3 py-3 outline-none"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value || 0))}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="APR (mo)" value={`${Math.round(apr * 100)}%`} />
            <Stat label="Прогноз на выплату" value={`${payout} USDT`} />
            <Stat label="Профиль риска" value={risk} />
          </div>

          <div className="mt-6 flex gap-3">
            <button className="px-6 py-3 bg-yellow-400 text-black font-black rounded-full">START AUTO-TRADING</button>
            <button className="px-6 py-3 bg-neutral-900 text-yellow-300 font-bold rounded-full">View Plans</button>
          </div>
        </section>

        <section className="rounded-3xl border border-yellow-500/20 bg-neutral-950 shadow-[0_0_50px_rgba(255,215,0,.07)]">
          <RobotGLTFChart />
        </section>
      </main>
    </div>
  );
}
