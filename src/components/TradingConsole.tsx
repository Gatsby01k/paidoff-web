// src/components/TradingConsole.tsx
import React, { useMemo, useState } from "react";
import RobotAssistantCanvas from "./RobotAssistantCanvas";
import type { Risk } from "../lib/deposits";

type Msg = { from: "user" | "bot"; text: string };
type Trade = { side: "LONG" | "SHORT"; change: number };

export default function TradingConsole({ risk }: { risk: Risk }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [log, setLog] = useState<Msg[]>([]);
  const [trigger, setTrigger] = useState(0);
  const [lastTrade, setLastTrade] = useState<Trade | null>(null);
  const [tape, setTape] = useState<(Trade & { id: string; level: number })[]>([]);

  const accent = useMemo(
    () => (risk === "HIGH" ? "#ff5c7a" : risk === "MEDIUM" ? "#f59e0b" : "#22c55e"),
    [risk]
  );

  function send() {
    const q = msg.trim();
    if (!q) return;
    setMsg("");
    setLog((l) => [...l, { from: "user", text: q }]);

    // псевдо-сделка
    const side: Trade["side"] = Math.random() > 0.5 ? "LONG" : "SHORT";
    const change = +( (Math.random() * 2.4 - 1.2).toFixed(2) ); // -1.2…+1.2%
    const level = +( (100 + Math.random() * 10).toFixed(2) );

    setLastTrade({ side, change });
    setTrigger((t) => t + 1); // запустить вспышку/бейдж

    setTape((arr) => [{ id: crypto.randomUUID().slice(0, 6), side, change, level }, ...arr].slice(0, 5));

    const reply = makeReply(q, risk, side, change);
    setTimeout(() => setLog((l) => [...l, { from: "bot", text: reply }]), 240);
  }

  return (
    <div className="glow p-3">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="text-sm tracking-wide opacity-70">AI Trading Console</div>
          <button className="btn-primary px-4 py-2" onClick={() => setOpen((o) => !o)}>
            {open ? "Свернуть чат" : "Спросить робота"}
          </button>
        </div>

        {/* Scene */}
        <div className="h-[360px] md:h-[420px] relative">
          <RobotAssistantCanvas risk={risk} trigger={trigger} trade={lastTrade} />

          {/* Last trades ticker */}
          <div className="absolute right-3 bottom-3 pointer-events-none">
            {tape.map((t) => (
              <div
                key={t.id}
                className="mb-1 text-xs px-2 py-1 rounded-md"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e5e7eb",
                }}
              >
                <span style={{ color: t.side === "LONG" ? accent : "#f87171", fontWeight: 800 }}>
                  {t.side}
                </span>{" "}
                {t.change > 0 ? `+${t.change}%` : `${t.change}%`} · {t.level}
              </div>
            ))}
          </div>
        </div>

        {/* Chat (collapsible) */}
        <div className={`transition-all duration-300 ${open ? "max-h-56 opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}>
          <div className="px-4 pb-3 pt-2 border-t border-white/10 bg-black/40 backdrop-blur">
            <div className="max-h-40 overflow-y-auto space-y-2 text-sm py-2">
              {log.length === 0 && <div className="opacity-60">Спроси про APR, риск и сроки — я подскажу.</div>}
              {log.map((m, i) => (
                <div key={i} className={m.from === "user" ? "text-yellow-200" : "text-neutral-200"}>
                  <span className="opacity-50">{m.from === "user" ? "Вы:" : "Бот:"}</span> {m.text}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Напиши вопрос…"
                className="flex-1 bg-white/5 rounded-xl px-3 py-2 outline-none"
              />
              <button onClick={send} className="btn-primary px-4 py-2">Отправить</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function makeReply(q: string, risk: Risk, side: "LONG" | "SHORT", change: number) {
  const apr = risk === "HIGH" ? 25 : risk === "MEDIUM" ? 12 : 5;
  const base =
    /apr|доход|прибыл/i.test(q)
      ? `Профиль ${risk}: модельный APR ≈ ${apr}%/мес.`
      : /срок|месяц|period|term/i.test(q)
      ? `Для ${risk} разумный горизонт — ${risk === "HIGH" ? "3–6" : "1–3"} месяцев.`
      : /риск|безопас/i.test(q)
      ? `Профиль ${risk}: ${risk === "HIGH" ? "больше потенциал и волатильность" : "умеренный риск и более ровная кривая"}.`
      : "Спроши про APR, риски и сроки — подскажу.";
  const spice = ` Последний сигнал: ${side} ${change > 0 ? "+" : ""}${change}%.`;
  return base + spice;
}
