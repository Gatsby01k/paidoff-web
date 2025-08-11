import React, { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; text: string };

function fakeAnswer(q: string) {
  const s = q.toLowerCase();
  if (s.includes("apr") || s.includes("доход") || s.includes("процент")) {
    return "APR зависит от выбранного риска: LOW ~5%/мес, MEDIUM ~12%/мес, HIGH ~26%/мес. Чем выше риск — тем волатильнее кривая и выше потенциальная прибыль.";
  }
  if (s.includes("риск") || s.includes("safe")) {
    return "LOW — самый консервативный режим. Средства блокируются на выбранный период, стратегия снижает просадки.";
  }
  if (s.includes("как начать") || s.includes("start")) {
    return "Нажми CONNECT WALLET, выбери сумму и срок, затем START AUTO-TRADING. Бот зафиксирует параметры и начнет стратегию.";
  }
  return "Я могу подсказать по рискам, APR, стратегии и процессу старта. Спроси, например: 'Какой APR в MEDIUM?'";
}

export default function RobotQA() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: "Привет! Я PaidOFF Bot. Задай вопрос — помогу выбрать риск и понять прогноз.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");

    // имитация "печатает..."
    const answer = fakeAnswer(text);
    const typing: Msg = { role: "bot", text: "" };
    setMessages((m) => [...m, typing]);

    let i = 0;
    const timer = setInterval(() => {
      i++;
      typing.text = answer.slice(0, i);
      setMessages((m) => [...m.slice(0, -1), { ...typing }]);
      if (i >= answer.length) clearInterval(timer);
    }, 15);
  };

  return (
    <div
      className="w-full rounded-2xl border border-yellow-500/20 overflow-hidden"
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,215,0,.06) inset, 0 20px 60px rgba(0,0,0,.45), 0 0 60px rgba(255,215,0,.06)",
        background:
          "radial-gradient(1000px 500px at 20% -20%, rgba(255,231,91,.06), transparent 60%), #050607",
      }}
    >
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-yellow-500/10">
        <div className="relative w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-300/40 flex items-center justify-center">
          {/* мини-«робот» */}
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-yellow-300">
            <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
            <rect x="7" y="9" width="10" height="6" rx="3" fill="currentColor" />
            <circle cx="9.5" cy="12" r="1.2" fill="#000" />
            <circle cx="14.5" cy="12" r="1.2" fill="#000" />
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
        </div>
        <div className="text-sm font-semibold text-yellow-200">PaidOFF Bot</div>
        <div className="ml-auto text-xs text-yellow-300/60">online</div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="px-4 py-3 h-[240px] overflow-auto space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[80%] px-3 py-2 rounded-xl bg-yellow-300 text-black text-sm"
                : "mr-auto max-w-[80%] px-3 py-2 rounded-xl bg-yellow-400/10 text-yellow-100 border border-yellow-300/20 text-sm"
            }
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* input */}
      <div className="p-3 border-t border-yellow-500/10 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Спроси про APR, риск, как начать…"
          className="flex-1 bg-black/30 outline-none px-3 py-2 rounded-xl text-yellow-100 placeholder:text-yellow-300/40 border border-yellow-500/20 focus:border-yellow-400/50"
        />
        <button
          onClick={send}
          className="px-3 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:brightness-95"
        >
          Send
        </button>
      </div>
    </div>
  );
}
