import React from "react";
import "./styles.css";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-yellow-300 font-sans">
      {/* Хедер */}
      <header className="flex items-center justify-between p-4 border-b border-yellow-500/50">
        <h1 className="text-3xl font-extrabold tracking-wider">PAID$OFF</h1>
        <div className="ml-auto text-sm text-yellow-300/80">
          AUTOMATED TRADING (AI) — TEST PREVIEW
        </div>
      </header>

      {/* Тестовый баннер */}
      <div className="bg-yellow-400 text-black text-center py-2 font-bold">
        ✅ TEST PREVIEW BUILD — Если ты видишь этот баннер, Vercel Preview работает
      </div>

      {/* Контент */}
      <main className="p-8 text-lg">
        <p>
          Здесь будет наш будущий интерфейс AI Trading Platform. Сейчас идёт тест сборки.
        </p>
      </main>
    </div>
  );
}
