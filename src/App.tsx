import React, { useMemo, useState } from "react";
import LiveChartFast from "./components/LiveChartFast";
import RobotQA from "./components/RobotQA";
import "./styles.css";

type Risk = "LOW" | "MEDIUM" | "HIGH";

function aprFor(risk: Risk) {
  if (risk === "HIGH") return 0.26;
  if (risk === "MEDIUM") return 0.12;
  return 0.05;
}

export default function App() {
  const [risk, setRisk] = useState<Risk>("LOW");
  const [amount, setAmount] = useState<number>(500);
  const [months, setMonths] = useState<number>(1);

  const apr = aprFor(risk);
  const payout = useMemo(() => {
    // простая капитализация
    let v = amount;
    for (let i = 0; i < months; i++) v *= 1 + apr;
    return v;
  }, [amount, months, apr]);

  return (
    <div className="min-h-screen bg-black text-yellow-300 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/10 bg-black/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-md" />
          <div className="text-2xl font-extrabold tracking-wide">PAID<span className="text-black bg-yellow-400 px-1 rounded">OFF</span></div>
        </div>
        <nav className="hidden md:flex gap-6 text-sm text-yellow-200/80">
          <a className="hover:text-yellow-200" href="#">Whitepaper</a>
          <a className="hover:text-yellow-200" href="#">Docs</a>
          <a className="hover:text-yellow-200" href="#">Security</a>
        </nav>
        <button className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:brightness-95">
          CONNECT WALLET
        </button>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-10 lg:px-16 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* left */}
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-yellow-200">
              Авто-трейдинг на ИИ<br />с фиксированным<br />сроком и риском
            </h1>
            <p className="mt-5 text-yellow-200/80 max-w-xl">
              Выбери риск-профиль, сумму и срок. Средства блокируются на период, а ИИ-стратегия торгует за тебя.
            </p>

            {/* risk buttons */}
            <div className="mt-6 flex gap-3">
              {(["LOW", "MEDIUM", "HIGH"] as Risk[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  className={`px-5 py-3 rounded-2xl border ${
                    risk === r
                      ? "bg-yellow-400 text-black border-yellow-300"
                      : "bg-black/30 text-yellow-200 border-yellow-500/20 hover:border-yellow-400/40"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* inputs */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
              <div className="p-3 rounded-xl bg-black/30 border border-yellow-500/20">
                <div className="text-xs text-yellow-400/70 mb-1">Сумма (USDT)</div>
                <input
                  className="w-full bg-transparent outline-none text-yellow-100"
                  type="number"
                  min={100}
                  step={50}
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value || "0"))}
                />
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-yellow-500/20">
                <div className="text-xs text-yellow-400/70 mb-1">Срок (мес.)</div>
                <input
                  className="w-full bg-transparent outline-none text-yellow-100"
                  type="number"
                  min={1}
                  max={12}
                  step={1}
                  value={months}
                  onChange={(e) => setMonths(parseInt(e.target.value || "1"))}
                />
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-yellow-500/20">
                <div className="text-xs text-yellow-400/70 mb-1">APR (мес.)</div>
                <div className="text-2xl font-extrabold text-yellow-200">{Math.round(apr * 100)}%</div>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-yellow-500/20">
                <div className="text-xs text-yellow-400/70 mb-1">Прогноз на выплату</div>
                <div className="text-2xl font-extrabold text-yellow-200">
                  {payout.toFixed(2)} <span className="text-xs opacity-60">USDT</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="px-5 py-3 rounded-xl bg-yellow-400 text-black font-semibold hover:brightness-95">
                START AUTO-TRADING
              </button>
              <button className="px-5 py-3 rounded-xl border border-yellow-500/30 bg-black/30 hover:border-yellow-400/50">
                View Plans
              </button>
            </div>
          </div>

          {/* right: две карточки — график и бот */}
          <div className="grid grid-cols-1 gap-6">
            <LiveChartFast risk={risk} />
            <RobotQA />
          </div>
        </div>
      </section>
    </div>
  );
}
