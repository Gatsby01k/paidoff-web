import React, { useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import LiveChartFast from "./components/LiveChartFast";
import RobotQA from "./components/RobotQA";
import Positions, { addMockPosition } from "./components/Positions";
import "./styles.css";

type Risk = "LOW" | "MEDIUM" | "HIGH";
const aprFor = (risk: Risk) => (risk === "HIGH" ? 0.26 : risk === "MEDIUM" ? 0.12 : 0.05);

export default function App() {
  const [risk, setRisk] = useState<Risk>("LOW");
  const [amount, setAmount] = useState<number>(500);
  const [months, setMonths] = useState<number>(1);
  const apr = aprFor(risk);

  const { address } = useAccount();
  const chainId = useChainId();

  const payout = useMemo(() => {
    let v = amount;
    for (let i = 0; i < months; i++) v *= 1 + apr;
    return v;
  }, [amount, months, apr]);

  const startAuto = () => {
    if (!address) {
      alert("Подключи кошелёк (кнопка справа вверху).");
      return;
    }
    if (!amount || amount < 100) {
      alert("Минимальная сумма 100 USDT (мок).");
      return;
    }

    const ms = Date.now();
    const end = ms + months * 30 * 24 * 3600 * 1000; // грубо: N месяцев

    addMockPosition({
      id: crypto.randomUUID(),
      address,
      chainId,
      amount,
      risk,
      months,
      apr,
      start: ms,
      end
    });

    alert("Позиция создана (мок). Ниже в списке — таймер блокировки и прогноз выплаты.");
  };

  return (
    <div className="min-h-screen bg-black text-yellow-300 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/10 bg-black/60 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-md" />
          <div className="text-2xl font-extrabold tracking-wide">
            PAID<span className="text-black bg-yellow-400 px-1 rounded">OFF</span>
          </div>
        </div>
        <nav className="hidden md:flex gap-6 text-sm text-yellow-200/80">
          <a className="hover:text-yellow-200" href="#">Whitepaper</a>
          <a className="hover:text-yellow-200" href="#">Docs</a>
          <a className="hover:text-yellow-200" href="#">Security</a>
        </nav>
        <ConnectButton chainStatus="icon" showBalance={false} />
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
              <button
                onClick={startAuto}
                className="px-5 py-3 rounded-xl bg-yellow-400 text-black font-semibold hover:brightness-95"
              >
                START AUTO-TRADING
              </button>
              <button className="px-5 py-3 rounded-xl border border-yellow-500/30 bg-black/30 hover:border-yellow-400/50">
                View Plans
              </button>
            </div>
          </div>

          {/* right: быстрый график + бот */}
          <div className="grid grid-cols-1 gap-6">
            <LiveChartFast risk={risk} />
            <RobotQA />
          </div>
        </div>

        {/* positions */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-3 text-yellow-200">Твои позиции</h2>
          <Positions />
        </div>
      </section>
    </div>
  );
}
