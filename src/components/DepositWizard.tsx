// src/components/DepositWizard.tsx
import React, { useState } from "react";
import {
  Risk,
  createDeposit,
  formatUSDT,
  calcPayout,
  riskToApr,
} from "../lib/deposits";
import { useAccount } from "wagmi";

export default function DepositWizard({
  open,
  onClose,
  amount,
  months,
  risk,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  amount: number;
  months: number;
  risk: Risk;
  onDone?: () => void;
}) {
  const { address } = useAccount();
  const [busy, setBusy] = useState(false);
  const apr = riskToApr(risk);
  const payout = calcPayout(amount, months, apr);

  if (!open) return null;

  async function confirm() {
    setBusy(true);
    try {
      // имитация/пауза как будто «транзакция»
      await new Promise((r) => setTimeout(r, 700));
      createDeposit({ amount, months, risk, owner: address || undefined });
      onClose();
      onDone?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => !busy && onClose()} />
      <div className="card w-full md:max-w-lg mx-4 md:mx-0 shadow-2xl border border-yellow-400/10">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="font-bold">Подтверждение депозита</div>
          <button disabled={busy} onClick={onClose} className="opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
        <div className="p-4 space-y-3">
          <Row label="Риск">{risk}</Row>
          <Row label="Сумма">{formatUSDT(amount)} USDT</Row>
          <Row label="Срок">{months} мес</Row>
          <Row label="APR">{(apr * 100).toFixed(0)}% / мес</Row>
          <Row label="Прогноз на выплату" strong>
            {formatUSDT(payout)} USDT
          </Row>
          {!address && (
            <div className="text-xs opacity-60 pt-1">
              Кошелёк не подключён — депозит будет сохранён локально. Подключите кошелёк, чтобы
              привязать депозиты к адресу.
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/5 flex gap-2 justify-end">
          <button disabled={busy} onClick={onClose} className="bg-white/5 rounded-2xl px-4 py-3">
            Отмена
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="btn-primary px-5 py-3 disabled:opacity-60"
          >
            {busy ? "Создание…" : "Заблокировать средства"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  strong,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="opacity-60 text-sm">{label}</div>
      <div className={strong ? "font-extrabold" : ""}>{children}</div>
    </div>
  );
}
