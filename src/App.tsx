import React, { useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import LiveChartFast from "./components/LiveChartFast";
import RobotQA from "./components/RobotQA";
import RobotAssistantCanvas from "./components/RobotAssistantCanvas";

type Risk = "LOW" | "MEDIUM" | "HIGH";

export default function App() {
  const [risk, setRisk] = useState<Risk>("LOW");
  const [amount, setAmount] = useState<number>(500);
  const [months, setMonths] = useState<number>(1);

  const apr = useMemo(() => {
    if (risk === "HIGH") return 0.25;
    if (risk === "MEDIUM") return 0.12;
    return 0.05;
  }, [risk]);

  const payout = useMemo(() => {
    let total = amount;
    for (let i = 0; i < months; i++) total *= 1 + apr;
    return total;
  }, [amount, months, apr]);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-yellow-300 shadow-[0_0_20px_#FDE047]"></div>
          <div className="font-extrabold text-xl tracking-wide">
            PAID<span className="text-yellow-300">OFF</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm opacity-80">
          <a href="#" className="hover:opacity-100 transition">Whitepaper</a>
          <a href="#" className="hover:opacity-100 transition">Docs</a>
          <a href="#" className="hover:opacity-100 transition">Security</a>
        </nav>
        <ConnectButton chainStatus="icon" showBalance={false} />
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-2 gap-8 items-stretch">
        {/* Left: controls */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Авто-трейдинг на <span className="text-yellow-300">ИИ</span> <br />
            с фиксированным сроком и риском
          </h1>

          <p className="text-neutral-300 max-w-xl">
            Выбери риск-профиль, сумму и срок. Средства блокируются на период,
            а ИИ-стратегия торгует за тебя (модельная доходность).
          </p>

          {/* risk */}
          <div className="flex gap-3">
            {(["LOW", "MEDIUM", "HIGH"] as Risk[]).map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={
                  "px-5 py-3 rounded-2xl font-extrabold " +
                  (risk === r
                    ? "btn-primary"
                    : "bg-white/5 hover:bg-white/7 transition")
                }
              >
                {r}
              </button>
            ))}
          </div>

          {/* inputs */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="text-xs opacity-60 mb-1">Сумма (USDT)</div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 outline-none"
              />
            </div>

            <div className="card p-4">
              <div className="text-xs opacity-60 mb-1">Срок (мес.)</div>
              <input
                type="number"
                value={months}
                onChange={(e) => setMonths(Math.max(1, Number(e.target.value)))}
                className="w-full bg-black/40 rounded-xl px-3 py-2 outline-none"
              />
            </div>

            <div className="card p-4">
              <div className="text-xs opacity-60 mb-1">APR (модельно)</div>
              <div className="text-2xl font-extrabold text-yellow-300">
                {(apr * 100).toFixed(0)}%
              </div>
            </div>

            <div className="card p-4">
              <div className="text-xs opacity-60 mb-1">Прогноз на выплату</div>
              <div className="text-2xl font-extrabold">
                {payout.toFixed(2)} <span className="opacity-60">USDT</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-primary px-6 py-4">START AUTO-TRADING</button>
            <button className="bg-white/5 hover:bg-white/7 rounded-2xl px-6 py-4 font-bold">
              View Plans
            </button>
          </div>
        </div>

        {/* Right: chart + робот */}
        <div className="space-y-4">
          <div className="glow p-2">
            <div className="card p-2 h-[360px] md:h-[420px]">
              <div className="w-full h-full rounded-2xl overflow-hidden">
                <LiveChartFast risk={risk} />
              </div>
            </div>
          </div>

          {/* робот-ассистент */}
          <RobotAssistantCanvas
            onAsk={() => window.dispatchEvent(new CustomEvent("po-open-chat"))}
          />
        </div>
      </section>

      <RobotQA />
    </main>
  );
}
