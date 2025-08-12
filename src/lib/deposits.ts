// src/lib/deposits.ts
export type Risk = "LOW" | "MEDIUM" | "HIGH";

export interface Deposit {
  id: string;
  owner?: string;           // адрес кошелька, если есть
  createdAt: number;        // ms
  unlockAt: number;         // ms
  months: number;
  risk: Risk;
  amount: number;           // USDT числом
  apr: number;              // 0.05 / 0.12 / 0.25 ...
  expectedPayout: number;   // расчёт на момент создания
  status: "locked" | "unlocked" | "claimed";
}

const LS_KEY = "paidoff.deposits.v1";

function readAll(): Deposit[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Deposit[]) : [];
  } catch {
    return [];
  }
}
function writeAll(list: Deposit[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function riskToApr(risk: Risk): number {
  if (risk === "HIGH") return 0.25;
  if (risk === "MEDIUM") return 0.12;
  return 0.05;
}

export function calcPayout(amount: number, months: number, apr: number) {
  let total = amount;
  for (let i = 0; i < months; i++) total *= 1 + apr;
  return total;
}

export function createDeposit(params: {
  amount: number;
  months: number;
  risk: Risk;
  owner?: string;
}): Deposit {
  const apr = riskToApr(params.risk);
  const expectedPayout = calcPayout(params.amount, params.months, apr);
  const id = crypto.randomUUID();
  const now = Date.now();
  const unlockAt = now + params.months * 30 * 24 * 3600 * 1000; // грубо

  const dep: Deposit = {
    id,
    owner: params.owner,
    createdAt: now,
    unlockAt,
    months: params.months,
    risk: params.risk,
    amount: params.amount,
    apr,
    expectedPayout,
    status: "locked",
  };
  const list = readAll();
  list.unshift(dep);
  writeAll(list);
  return dep;
}

export function listDeposits(owner?: string): Deposit[] {
  const list = readAll();
  tickUnlock(); // автообновим статусы
  return owner ? list.filter((d) => d.owner === owner) : list;
}

export function tickUnlock() {
  const list = readAll();
  const now = Date.now();
  let changed = false;
  for (const d of list) {
    if (d.status === "locked" && now >= d.unlockAt) {
      d.status = "unlocked";
      changed = true;
    }
  }
  if (changed) writeAll(list);
}

export function claimDeposit(id: string, owner?: string): boolean {
  const list = readAll();
  const idx = list.findIndex((d) => d.id === id);
  if (idx < 0) return false;
  const d = list[idx];
  if (owner && d.owner && owner.toLowerCase() !== d.owner.toLowerCase())
    return false;
  if (d.status !== "unlocked") return false;
  d.status = "claimed";
  writeAll(list);
  return true;
}

export function formatUSDT(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtTimeLeft(ms: number) {
  if (ms <= 0) return "готов к выводу";
  const days = Math.floor(ms / (24 * 3600 * 1000));
  const hrs = Math.floor((ms % (24 * 3600 * 1000)) / (3600 * 1000));
  return days > 0 ? `${days}д ${hrs}ч` : `${hrs}ч`;
}
