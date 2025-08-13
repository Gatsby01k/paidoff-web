import React, { useEffect, useRef, useState } from "react";

type Msg = { id: string; role: "user" | "bot"; text: string };

export default function AskBot() {
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem("paidoff_chat");
      return raw ? (JSON.parse(raw) as Msg[]) : [];
    } catch {
      return [];
    }
  });
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("paidoff_chat", JSON.stringify(msgs));
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  function replyTo(q: string): string {
    // простые заглушки; тут позже подключишь реальный бэкенд/AI
    q = q.toLowerCase();
    if (q.includes("доход") || q.includes("apr") || q.includes("прибыль"))
      return "APR моделируется как 5%/мес дляLOW, 12%/мес дляMEDIUM и 24%/мес дляHIGH. Помни, это симуляция.";
    if (q.includes("риск"))
      return "LOW — низкая волатильность и консервативная тактика; HIGH — агрессивные входы и выше волатильность.";
    return "Я слежу за рынком: рука показывает точку входа по текущей свече. Спроси про риск/срок/прибыль.";
  }

  const send = () => {
    const t = value.trim();
    if (!t) return;
    const id = crypto.randomUUID();
    setMsgs((m) => [...m, { id, role: "user", text: t }]);
    setValue("");
    setTimeout(() => {
      setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "bot", text: replyTo(t) }]);
    }, 450);
  };

  return (
    <div className="border border-[#1b1e24] rounded-xl overflow-hidden">
      <div ref={scrollRef} className="chat-panel max-h-[240px] overflow-auto p-3 space-y-2 bg-[#0d0f13]">
        {msgs.length === 0 && (
          <div className="text-sm text-white/50">Напиши вопрос роботу. Например: «какой профиль риска выбрать?»</div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.role === "bot" ? "bot" : ""}`}>
            <div className="text-xs opacity-60 mb-1">{m.role === "bot" ? "Робот" : "Вы"}</div>
            <div className="text-[15px] leading-5">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-3 bg-[#0b0d10] border-t border-[#1b1e24]">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Задай вопрос..."
          className="flex-1 bg-[#0f1116] border border-[#1b1e24] rounded-lg px-3 py-2 outline-none focus:border-yellow-400/50"
        />
        <button onClick={send} className="btn-glow px-4 py-2 text-sm font-semibold">
          Отправить
        </button>
      </div>
    </div>
  );
}
