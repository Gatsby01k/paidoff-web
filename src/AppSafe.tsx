import React from "react";

export default function AppSafe() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 text-sm opacity-70">PaidOFF / SAFE MODE</div>
        <h1 className="text-3xl font-extrabold text-yellow-300 mb-3">
          Приложение запущено в безопасном режиме
        </h1>
        <p className="text-neutral-300 leading-relaxed">
          Здесь нет подключения кошелька, графика и чата. Выключи переменную{" "}
          <code className="bg-neutral-800 px-2 py-1 rounded">VITE_SAFE_MODE</code>{" "}
          в Vercel, и загрузится основной интерфейс. Если снова будет белый экран — скажи,
          на какой строке в стек-трейсе падает (сорсмапы включены).
        </p>
      </div>
    </main>
  );
}
