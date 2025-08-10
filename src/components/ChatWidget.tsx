import React, { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; text: string };

const canned = (q: string): string => {
  const s = q.toLowerCase();
  if (s.includes("риск") || s.includes("risk")) return "Режимы: LOW ~5%/мес, MEDIUM ~12%/мес, HIGH ~до 28%/мес. Выбирай баланс доходности и срока блокировки.";
  if (s.includes("депозит") || s.includes("миним") || s.includes("min"))
    return "Минимальный старт — 50 USDT. Для HIGH советуем ≥ 250 USDT.";
  if (s.includes("срок") || s.includes("lock") || s.includes("период"))
    return "Lock выбирается пользователем: от 1 до 12 месяцев. Средства разблокируются автоматически по завершении.";
  if (s.includes("кик") || s.includes("kyc"))
    return "Нет KYC на лендинге. Подключение кошелька — достаточное условие для начала.";
  return "Я AI-бот PaidOFF. Спроси про риск, депозит, срок или как начать — помогу ✨";
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Привет! Я бот PaidOFF. Спроси меня о рисках, сроках и доходности 🤖" },
  ]);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing, open]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: "bot", text: canned(q) }]);
    }, 600);
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-5 py-4 rounded-full bg-[#ffe500] text-black font-black shadow-[0_10px_30px_rgba(255,229,0,.35)]"
          aria-label="Chat with AI bot"
        >
          🤖 Chat
        </button>
      )}

      {/* Панель */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[360px] max-w-[92vw] rounded-2xl bg-[#0e0f11] border border-yellow-500/20 shadow-[0_20px_50px_rgba(0,0,0,.45)] overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-yellow-500/15">
            <span className="text-lg">🤖</span>
            <div className="font-black">PaidOFF Bot</div>
            <div className="ml-auto text-xs text-yellow-300/70">Online</div>
            <button className="ml-3 text-yellow-300/70 hover:text-yellow-100" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="h-72 overflow-y-auto p-3 space-y-2">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] px-3 py-2 rounded-2xl ${m.role === "user" ? "ml-auto bg-yellow-400 text-black" : "bg-[#121316] border border-yellow-500/15 text-yellow-200"}`}>
                {m.text}
              </div>
            ))}
            {typing && <div className="px-3 py-2 rounded-2xl bg-[#121316] border border-yellow-500/15 text-yellow-200 w-24">печатает…</div>}
            <div ref={endRef} />
          </div>
          <div className="p-3 flex gap-2">
            <input
              className="flex-1 input"
              placeholder="Спроси бота…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="btn btn-primary" onClick={send}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
