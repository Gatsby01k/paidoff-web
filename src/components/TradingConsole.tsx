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

    // поджигаем новую «сделку»
    setTrigger((t) => t + 1);

    const reply = makeReply(q, risk);
    setTimeout(() => {
      setLog((l) => [...l, { from: "bot", text: reply }]);
    }, 350);
  }

  return (
    <div className="glow p-3">
      <div className="card relative overflow-hidden">
        {/* ВЕСЬ БЛОК — РОБОТ */}
        <div className="h-[360px] md:h-[420px]">
          <RobotAssistantCanvas risk={risk} trigger={trigger} onAsk={() => setOpen(true)} />
        </div>

        {/* Кнопка чата */}
        <div className="absolute left-4 bottom-4">
          <button
            className="btn-primary px-4 py-2"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Свернуть чат" : "Спросить робота"}
          </button>
        </div>

        {/* Слайдер чата */}
        <div
          className={
            "absolute left-0 right-0 bottom-0 transition-transform duration-300 " +
            (open ? "translate-y-0" : "translate-y-[88%]")
          }
        >
          <div className="mx-3 mb-3 rounded-2xl bg-black/70 backdrop-blur border border-white/10">
            <div className="max-h-44 overflow-y-auto p-3 space-y-2 text-sm">
              {log.length === 0 && (
                <div className="opacity-60">
                  Я — помощник. Спроси про риск, доходность и сроки.
                </div>
              )}
              {log.map((m, i) => (
                <div key={i} className={m.from === "user" ? "text-yellow-200" : "text-neutral-200"}>
                  <span className="opacity-50">
                    {m.from === "user" ? "Вы:" : "Бот:"}
                  </span>{" "}
                  {m.text}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 border-t border-white/10">
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
    return `Для профиля ${risk} модельный APR ≈ ${apr}%/мес. Реальная доходность зависит от рынка.`;
  if (/срок|месяц|period|term/i.test(q))
    return `Для ${risk} рекомендуем держать от ${
      risk === "HIGH" ? 3 : 1
    } до ${risk === "HIGH" ? 6 : 3} месяцев.`;
  if (/риск|безопас/i.test(q))
    return `Профиль ${risk}: ${
      risk === "HIGH"
        ? "больше волатильность, но и потенциальная доходность выше"
        : "умеренный риск и более предсказуемая доходность"
    }.`;
  return "Могу рассказать про APR, риск-профили и рекомендуемые сроки. Спроси 🙂";
}
