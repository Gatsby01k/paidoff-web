// src/components/DepositsTable.tsx
import React, { useEffect, useState } from "react";
import {
  Deposit,
  claimDeposit,
  fmtTimeLeft,
  formatUSDT,
  listDeposits,
  tickUnlock,
} from "../lib/deposits";
import { useAccount } from "wagmi";

export default function DepositsTable() {
  const { address } = useAccount();
  const [list, setList] = useState<Deposit[]>([]);

  useEffect(() => {
    const load = () => setList(listDeposits(address || undefined));
    load();
    const id = setInterval(() => {
      tickUnlock();
      load();
    }, 5000);
    return () => clearInterval(id);
  }, [address]);

  const has = list.length > 0;

  function refresh() {
    setList(listDeposits(address || undefined));
  }

  function exportCSV() {
    if (!list.length) return;
    const header = [
      "id",
      "owner",
      "risk",
      "amount",
      "months",
      "apr",
      "expectedPayout",
      "createdAt",
      "unlockAt",
      "status",
    ];
    const rows = list.map((d) => [
      d.id,
      d.owner || "",
      d.risk,
      d.amount,
      d.months,
      d.apr,
      d.expectedPayout,
      new Date(d.createdAt).toISOString(),
      new Date(d.unlockAt).toISOString(),
      d.status,
    ]);
    const csv =
      [header, ...rows]
        .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
        .join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paidoff_deposits.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    localStorage.removeItem("paidoff.deposits.v1");
    refresh();
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold">Мои депозиты</h2>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="bg-white/5 hover:bg-white/7 rounded-2xl px-4 py-2 text-sm"
          >
            Экспорт CSV
          </button>
          <button
            onClick={clearAll}
            className="bg-white/5 hover:bg-white/7 rounded-2xl px-4 py-2 text-sm"
          >
            Очистить
          </button>
        </div>
      </div>

      {!has ? (
        <div className="card p-6 text-sm opacity-70">
          Депозитов пока нет. Заблокируй средства через форму выше.
        </div>
      ) : (
        <div className="overflow-auto card">
          <table className="min-w-[720px] w-full">
            <thead>
              <tr className="text-left text-xs opacity-60">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Риск</th>
                <th className="px-4 py-3">Сумма</th>
                <th className="px-4 py-3">Срок</th>
                <th className="px-4 py-3">APR</th>
                <th className="px-4 py-3">Ожидаемо</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <Row key={d.id} d={d} onChanged={refresh} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Row({ d, onChanged }: { d: Deposit; onChanged: () => void }) {
  const canClaim = d.status === "unlocked";
  const timeLeft = d.unlockAt - Date.now();

  function claim() {
    if (claimDeposit(d.id, d.owner)) onChanged();
  }

  return (
    <tr className="border-t border-white/5">
      <td className="px-4 py-3 text-xs opacity-60">{short(d.id)}</td>
      <td className="px-4 py-3">{d.risk}</td>
      <td className="px-4 py-3">{formatUSDT(d.amount)} USDT</td>
      <td className="px-4 py-3">{d.months} мес</td>
      <td className="px-4 py-3">{(d.apr * 100).toFixed(0)}%/мес</td>
      <td className="px-4 py-3">{formatUSDT(d.expectedPayout)} USDT</td>
      <td className="px-4 py-3">
        {d.status === "locked" ? (
          <span className="opacity-70">Заблокирован • {fmtTimeLeft(timeLeft)}</span>
        ) : d.status === "unlocked" ? (
          <span className="text-yellow-300 font-bold">Готов к выводу</span>
        ) : (
          <span className="opacity-60">Выплачен</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {canClaim ? (
          <button onClick={claim} className="btn-primary px-4 py-2">
            Вывести
          </button>
        ) : (
          <span className="opacity-40 text-sm">—</span>
        )}
      </td>
    </tr>
  );
}

function short(id: string) {
  return id.slice(0, 6) + "…" + id.slice(-4);
}
