// src/components/TradingConsole.tsx
import React, { useState } from "react";
import RobotAssistantCanvas from "./RobotAssistantCanvas";
import type { Risk } from "../lib/deposits";

type Msg = { from: "user" | "bot"; text: string };

export default function TradingConsole({ risk }: { risk: Risk }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [log, setLog] = useState<Msg[]>([]);
  const [trigger, setTrigger] = useState(0);

  function send() {
    const q = msg.trim();
    if (!q) return;
    setMsg("");
    setLog((l) => [...l, { from: "user", text: q }]);

    // "сделка": вспышка + искры + резкий доворот руки
    setTrigger((t) => t + 1);

    const reply = makeReply(q, risk);
    setTimeout(() => {
      setLog((l) => [...l, { from: "bot", text: reply }]);
    }, 280);
  }

  return (
    <div className="glow p-3">
      <div className="card overflow-hidden">
        {/* Хедер панели */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="text-sm tracking-wide opacity-70">AI Trading Console</div>
          <button className="btn-primary px-4 py-2" onClick={() => setOpen((o) => !o)}>
            {open ? "Свернуть чат" : "Спросить робота"}
          </button>
        </div>

        {/* Turbo-сцена */}
        <div className="h-[360px] md:h-[420px]">
          <RobotAssistantCanvas risk={risk} trigger={trigger} />
        </div>

        {/* Чат: под сценой, коллапс с анимацией */}
        <div
          className={`transition-all duration-300 ${
            open ? "max-h-56 opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden`}
        >
          <div className="px-4 pb-3 pt-2 border-t border-white/10 bg-black/40 backdrop-blur">
            <div className="max-h-40 overflow-y-auto space-y-2 text-sm py-2">
              {log.length === 0 && (
                <div className="opacity-60">Спроси про APR, риск и сроки — я подскажу.</div>
              )}
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
              <button onClick={send} className="btn-primary px-4 py-2">
                Отправить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// простая демо-логика ответов
function makeReply(q: string, risk: Risk) {
  const apr = risk === "HIGH" ? 25 : risk === "MEDIUM" ? 12 : 5;
  if (/apr|доход|прибыл/i.test(q))
    return `Профиль ${risk}: модельный APR ≈ ${apr}%/мес. Реальный результат зависит от рынка.`;
  if (/срок|месяц|period|term/i.test(q))
    return `Для ${risk} разумный горизонт — ${
      risk === "HIGH" ? "3–6" : "1–3"
    } месяцев.`;
  if (/риск|безопас/i.test(q))
    return `Профиль ${risk}: ${
      risk === "HIGH"
        ? "макс. потенциал и волатильность"
        : "умеренный риск и более стабильная кривая"
    }.`;
  return "Могу подсказать по рискам, APR и срокам. Спроси 🙂";
}
