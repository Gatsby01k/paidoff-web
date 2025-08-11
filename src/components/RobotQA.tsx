import React, { useState } from "react";

export default function RobotQA() {
  const [open, setOpen] = useState(false);
  const [inp, setInp] = useState("");
  const [msgs, setMsgs] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Привет! Я бот PaidOFF. Спроси про риски, сроки и доходность." }
  ]);

  function handleSend() {
    const text = inp.trim();
    if (!text) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInp("");

    // простая имитация ответа
    const lower = text.toLowerCase();
    let reply =
      "Я анализирую рынок и распределяю риск. Выбери профиль и срок — Я покажу прогноз.";
    if (lower.includes("risk") || lower.includes("риск"))
      reply = "LOW ≈5%/мес, MEDIUM ≈12%/мес, HIGH ≈25%/мес (модельная доходность).";
    if (lower.includes("profit") || lower.includes("прибыл") || lower.includes("доход"))
      reply =
        "Прибыль зависит от суммы и срока. Я показываю модельный прогноз, гарантий нет.";
    if (lower.includes("kyc"))
      reply = "Лендинг без KYC. Подключи кошелёк, пополни депозит и выбери план.";

    setTimeout(() => {
      setMsgs((m) => [...m, { role: "bot", text: reply }]);
    }, 400);
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed right-5 bottom-5 btn-primary px-4 py-3 z-40"
      >
        {open ? "Закрыть чат" : "Чат"}
      </button>

      {open && (
        <div className="fixed right-5 bottom-20 w-[360px] max-w-[90vw] card z-40">
          <div className="p-4 border-b border-white/5">
            <div className="font-bold text-yellow-300">PaidOFF Bot</div>
            <div className="text-xs opacity-60">Спроси про риски, сроки, доходность</div>
          </div>

          <div className="p-3 space-y-2 max-h-[50vh] overflow-auto">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "bg-white/5 rounded-2xl px-3 py-2 ml-10 text-sm"
                    : "bg-yellow-400/10 border border-yellow-400/20 text-yellow-200 rounded-2xl px-3 py-2 mr-10 text-sm"
                }
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="p-3 flex gap-2 border-t border-white/5">
            <input
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Напиши вопрос…"
              className="flex-1 bg-black/40 rounded-xl px-3 py-2 outline-none"
            />
            <button onClick={handleSend} className="btn-primary px-4 py-2">
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
