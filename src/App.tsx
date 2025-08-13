import React, { useMemo, useState } from "react";
import "./styles.css";
import RobotChart from "./components/RobotChart";
import AskBot from "./components/AskBot";

type Risk = "LOW" | "MEDIUM" | "HIGH";

export default function App() {
  const [risk, setRisk] = useState<Risk>("LOW");
  const [amount, setAmount] = useState(500);
  const [months, setMonths] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);

  const apr = useMemo(() => (risk === "LOW" ? 5 : risk === "MEDIUM" ? 12 : 24), [risk]);
  const payout = useMemo(() => {
    const m = Math.max(1, months);
    const r = apr / 100;
    const total = amount * Math.pow(1 + r, m);
    return Math.round(total * 100) / 100;
  }, [amount, months, apr]);

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[var(--paid-yellow)] shadow-[0_0_18px_rgba(255,214,10,.5)]" />
          <div className="font-extrabold tracking-wide">PAID<span className="text-[var(--paid-yellow)]">OFF</span></div>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/70">
          <a href="#" className="hover:text-white">Whitepaper</a>
          <a href="#" className="hover:text-white">Docs</a>
          <a href="#" className="hover:text-white">Security</a>
          <button className="btn-glow px-4 py-2 text-sm font-semibold">Подключить кошелёк</button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 grid gap-8 lg:grid-cols-2">
        {/* LEFT — hero & controls */}
        <div className="space-y-6">
          <h1 className="hero-title text-4xl sm:text-5xl font-extrabold leading-[1.05]">
            Авто-трейдинг на <span className="text-[var(--paid-yellow)]">ИИ</span>
            <br />с фиксированным сроком и риском
          </h1>
          <p className="text-white/70 max-w-[52ch]">
            Выбери риск-профиль, сумму и срок. Средства блокируются на период, а ИИ-стратегия торгует за тебя.
          </p>

          {/* risk pills */}
          <div className="flex gap-3">
            {(["LOW", "MEDIUM", "HIGH"] as Risk[]).map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`badge-pill ${risk === r ? "active" : ""}`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* controls */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50">Сумма (USDT)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(50, Number(e.target.value)))}
                className="w-full mt-1 bg-[#0f1116] border border-[#1b1e24] rounded-lg px-3 py-2 outline-none focus:border-yellow-400/50"
              />
            </div>
            <div>
              <label className="text-xs text-white/50">Срок (мес.)</label>
              <input
                type="number"
                value={months}
                onChange={(e) => setMonths(Math.max(1, Number(e.target.value)))}
                className="w-full mt-1 bg-[#0f1116] border border-[#1b1e24] rounded-lg px-3 py-2 outline-none focus:border-yellow-400/50"
              />
            </div>
            <div>
              <label className="text-xs text-white/50">APR (модельно)</label>
              <div className="mt-1 badge-pill">{apr}%</div>
            </div>
            <div>
              <label className="text-xs text-white/50">Прогноз на выплату</label>
              <div className="mt-1 badge-pill">{payout.toFixed(2)} USDT</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-glow px-5 py-3 font-semibold">START AUTO-TRADING</button>
            <button className="badge-pill">View Plans</button>
            <button className="badge-pill">Share plan</button>
          </div>
        </div>

        {/* RIGHT — robot + chart + chat */}
        <div className="space-y-4">
          <RobotChart
            title="AI Trading Console"
            onAsk={() => setChatOpen((v) => !v)}
            chatOpen={chatOpen}
          />

          <div className={`chat-wrap ${chatOpen ? "open" : ""}`}>
            <div className="chat-panel">
              {chatOpen && <AskBot />}
            </div>
          </div>
        </div>
      </div>

      {/* deposits stub */}
      <div className="mx-auto max-w-7xl px-4 mt-12">
        <div className="font-semibold mb-2">Мои депозиты</div>
        <div className="badge-pill text-white/60">Депозитов пока нет. Заблокируй средства через форму выше.</div>
      </div>

      <div className="h-16" />
    </div>
  );
}
