// src/components/PlanModal.tsx
import React from "react";

export default function PlanModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  const plans = [
    { title: "LOW", apr: "≈ 5% / мес", desc: "Минимальная волатильность, стабильный рост." },
    { title: "MEDIUM", apr: "≈ 12% / мес", desc: "Сбалансированная стратегия риска/доходности." },
    { title: "HIGH", apr: "≈ 25% / мес", desc: "Агрессивная стратегия, максимальная доходность." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="card w-full md:max-w-2xl mx-4 md:mx-0 shadow-2xl border border-yellow-400/10">
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <div className="font-bold text-lg">Планы и тарифы</div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
        <div className="p-4 grid md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.title} className="bg-white/5 rounded-2xl p-4 flex flex-col gap-2">
              <div className="text-yellow-300 font-extrabold text-xl">{p.title}</div>
              <div className="opacity-80 text-sm">{p.apr}</div>
              <div className="opacity-60 text-sm">{p.desc}</div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/5 flex justify-end">
          <button onClick={onClose} className="btn-primary px-5 py-3">Понятно</button>
        </div>
      </div>
    </div>
  );
}
