// src/lib/share.ts
import type { Risk } from "./deposits";

export function encodePlan(p: { risk: Risk; amount: number; months: number }) {
  const u = new URL(window.location.href);
  u.searchParams.set("risk", p.risk);
  u.searchParams.set("amount", String(Math.max(0, Math.round(p.amount))));
  u.searchParams.set("months", String(Math.max(1, Math.round(p.months))));
  return u.toString();
}

export function decodePlan(qs: string): {
  risk?: Risk;
  amount?: number;
  months?: number;
} {
  const s = new URLSearchParams(qs);
  const r = s.get("risk");
  const a = s.get("amount");
  const m = s.get("months");

  const out: { risk?: Risk; amount?: number; months?: number } = {};
  if (r === "LOW" || r === "MEDIUM" || r === "HIGH") out.risk = r;
  if (a && !Number.isNaN(Number(a))) out.amount = Number(a);
  if (m && !Number.isNaN(Number(m))) out.months = Number(m);
  return out;
}
