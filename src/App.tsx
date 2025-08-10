import React, { useMemo, useState } from "react";
import "./styles.css";

import RobotChart3D from "./components/RobotChart3D";
import ChatWidget from "./components/ChatWidget";

type Risk = "LOW" | "MEDIUM" | "HIGH";

const RiskButton = ({
  r,
  active,
  onClick,
}: {
  r: Risk;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center min-w-28 px-6 py-3 rounded-3xl font-extrabold tracking-wide transition ${
      active
        ? "text-black bg-[#ffe500] hover:shadow-[0_0_0_2px_rgba(255,229,0,.15),0_0_40px_rgba(255,229,0,.12)]"
        : "text-yellow-400 bg-[#0f0f11] border border-yellow-500/25 hover:border-yellow-400/60"
    }`}
  >
    {r}
  </button>
);

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-2 rounded-2xl bg-[#0e0f11] text-yellow-400 border border-yellow-500/20 shadow-[0_0_30px_rgba(255,229,0,.15)]">
      <div className="text-xs text-yellow-300/70">{label}</div>
      <div className="text-xl font-black tracking-wide">{value}</div>
    </div>
  );
}

export default function App() {
  const [risk, setRisk] = useState<Risk>("LOW");
  const [amount, setAmount] = useState(500);
  const [months, setMonths] = useState(1);

  const pr = useMemo(
    () => (risk === "LOW" ? 0.05 : risk === "MEDIUM" ? 0.12 : 0.28),
    [risk]
  );
  const projected = useMemo(
    () => (amount * (1 + pr * months)).toFixed(2),
    [amount, pr, months]
  );

  return (
    <div>
      {/* NAV */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-4 border-b border-yellow-500/15">
        <div className="h-9 w-9 rounded-md bg-[#ffe500]" />
        <div className="text-2xl font-black tracking-widest">
          PAID<span className="bg-[#ffe500] text-black px-1 rounded">OFF</span>
        </div>
        <div className="ml-auto hidden md:flex gap-6 text-yellow-300/80">
          <a href="#" className="hover:text-yellow-200">
            Whitepaper
          </a>
          <a href="#" className="hover:text-yellow-200">
            Docs
          </a>
          <a href="#" className="hover:text-yellow-200">
            Security
          </a>
        </div>
        <button className="ml-4 inline-flex items-center justify-center px-6 py-3 rounded-3xl font-extrabold tracking-wide transition text-black bg-[#ffe500] hover:shadow-[0_0_0_2px_rgba(255,229,0,.15),0_0_40px_rgba(255,229,0,.12)]">
          CONNECT WALLET
        </button>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10 items-start">
        {/* LEFT: текст + форма */}
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-black leading-tight text-yellow-50 drop-shadow-[0_8px_40px_rgba(255,229,0,0.12)]">
            Авто-трейдинг на ИИ с фиксированным сроком и риском
          </h1>
          <p className="text-yellow-300/80 max-w-[48ch]">
            Выбери риск-профиль, сумму и срок. Средства блокируются на период, а
            ИИ-стратегия торгует за тебя.
          </p>

          <div className="flex gap-3">
            {(["LOW", "MEDIUM", "HIGH"] as Risk[]).map((r) => (
              <RiskButton
                key={r}
                r={r}
                active={risk === r}
                onClick={() => setRisk(r)}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-yellow-300/70">Сумма (USDT)</label>
              <input
                className="mt-1 w-full px-4 py-3 rounded-2xl bg-[#0f0f11] border border-yellow-500/15 focus:outline-none focus:border-yellow-400"
                type="number"
                min={50}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-yellow-300/70">Срок (мес.)</label>
              <input
                className="mt-1 w-full px-4 py-3 rounded-2xl bg-[#0f0f11] border border-yellow-500/15 focus:outline-none focus:border-yellow-400"
                type="number"
                min={1}
                max={12}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0e0f11] border border-yellow-500/20">
            <div className="text-yellow-300/80">Прогноз на выплату</div>
            <div className="text-2xl font-black">
              {(amount * (1 + pr * months)).toFixed(2)}{" "}
              <span className="text-sm">USDT</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="inline-flex items-center justify-center px-6 py-4 rounded-3xl font-extrabold tracking-wide text-lg transition text-black bg-[#ffe500] hover:shadow-[0_0_0_2px_rgba(255,229,0,.15),0_0_40px_rgba(255,229,0,.12)]">
              START AUTO-TRADING
            </button>
            <button className="inline-flex items-center justify-center px-6 py-4 rounded-3xl font-extrabold tracking-wide text-lg transition text-yellow-400 bg-[#0f0f11] border border-yellow-500/25 hover:border-yellow-400/60">
              View Plans
            </button>
          </div>

          <div className="flex gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-[#0f0f11] border border-yellow-500/25">
              Non-custodial
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-[#0f0f11] border border-yellow-500/25">
              AI-Signals
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-[#0f0f11] border border-yellow-500/25">
              Lock: 1–12м
            </span>
          </div>

          {/* мини-статики под формой */}
          <div className="flex gap-3">
            <Stat label="Risk" value={risk} />
            <Stat label="APR (mo)" value={(pr * 100).toFixed(0) + "%"} />
          </div>
        </div>

        {/* RIGHT: 3D сцена — робот + график */}
        <RobotChart3D />
      </section>

      {/* PLANS */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-black mb-6">Планы</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "LOW",
              apr: "~5%/мес",
              lock: "1–12 мес",
              desc: "Стабильность для аккуратного прироста.",
            },
            {
              name: "MEDIUM",
              apr: "~12%/мес",
              lock: "1–6 мес",
              desc: "Баланс риска и доходности.",
            },
            {
              name: "HIGH",
              apr: "~28%/мес",
              lock: "1–3 мес",
              desc: "Агрессивная стратегия для максимума.",
            },
          ].map((p) => (
            <div
              key={p.name}
              className="bg-[#111214] border border-yellow-500/15 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,.35)] p-6 flex flex-col gap-3"
            >
              <div className="text-lg font-black">{p.name}</div>
              <div className="text-3xl font-black">{p.apr}</div>
              <div className="text-yellow-300/80">Lock: {p.lock}</div>
              <p className="text-yellow-300/70">{p.desc}</p>
              <button className="inline-flex items-center justify-center px-6 py-3 rounded-3xl font-extrabold tracking-wide transition text-black bg-[#ffe500] hover:shadow-[0_0_0_2px_rgba(255,229,0,.15),0_0_40px_rgba(255,229,0,.12)] mt-2">
                Выбрать
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-xs text-yellow-300/60 border-t border-yellow-500/15">
        © {new Date().getFullYear()} PaidOFF. All rights reserved.
      </footer>

      {/* Чат-виджет */}
      <ChatWidget />
    </div>
  );
}
