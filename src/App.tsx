import React, { useMemo, useState } from "react";
import "./styles.css";

type Risk = "LOW" | "MEDIUM" | "HIGH";

const RiskButton = ({r, active, onClick}:{r:Risk, active:boolean, onClick:()=>void}) => (
  <button onClick={onClick}
    className={`btn ${active ? 'btn-primary' : 'btn-ghost'} min-w-28`}>{r}</button>
);

function Stat({ label, value }:{label:string, value:string}) {
  return (
    <div className="px-4 py-2 rounded-2xl bg-[#0e0f11] text-yellow-400 border border-yellow-500/20 shadow-glow">
      <div className="text-xs text-yellow-300/70">{label}</div>
      <div className="text-xl font-black tracking-wide">{value}</div>
    </div>
  );
}

export default function App() {
  const [risk, setRisk] = useState<Risk>("LOW");
  const [amount, setAmount] = useState(500);
  const [months, setMonths] = useState(1);

  const pr = useMemo(()=> risk==='LOW'?0.05 : risk==='MEDIUM'?0.12 : 0.28, [risk]);
  const projected = useMemo(()=> (amount*(1+pr*months)).toFixed(2), [amount, pr, months]);

  return (
    <div>
      {/* NAV */}
      <nav className="container py-5 flex items-center gap-4 border-b border-yellow-500/15">
        <div className="h-9 w-9 rounded-md bg-[var(--brand)]" />
        <div className="text-2xl font-black tracking-widest">
          PAID<span className="bg-[var(--brand)] text-black px-1 rounded">OFF</span>
        </div>
        <div className="ml-auto hidden md:flex gap-6 text-yellow-300/80">
          <a href="#" className="hover:text-yellow-200">Whitepaper</a>
          <a href="#" className="hover:text-yellow-200">Docs</a>
          <a href="#" className="hover:text-yellow-200">Security</a>
        </div>
        <button className="btn btn-primary ml-4">CONNECT WALLET</button>
      </nav>

      {/* HERO */}
      <section className="container py-12 grid md:grid-cols-2 gap-10 items-stretch">
        {/* left */}
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-black leading-tight text-yellow-50 drop-shadow-[0_8px_40px_rgba(255,229,0,0.12)]">
            Авто-трейдинг на ИИ с фиксированным сроком и риском
          </h1>
          <p className="text-yellow-300/80 max-w-[48ch]">
            Выбери риск-профиль, сумму и срок. Средства блокируются на период,
            а ИИ-стратегия торгует за тебя.
          </p>

          <div className="flex gap-3">
            {(["LOW","MEDIUM","HIGH"] as Risk[]).map(r=>(
              <RiskButton key={r} r={r} active={risk===r} onClick={()=>setRisk(r)} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-yellow-300/70">Сумма (USDT)</label>
              <input className="input mt-1" type="number" min={50} value={amount}
                onChange={(e)=>setAmount(Number(e.target.value))}/>
            </div>
            <div>
              <label className="text-xs text-yellow-300/70">Срок (мес.)</label>
              <input className="input mt-1" type="number" min={1} max={12} value={months}
                onChange={(e)=>setMonths(Number(e.target.value))}/>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0e0f11] border border-yellow-500/20">
            <div className="text-yellow-300/80">Прогноз на выплату</div>
            <div className="text-2xl font-black">{projected} <span className="text-sm">USDT</span></div>
          </div>

          <div className="flex gap-3">
            <button className="btn btn-primary text-lg">START AUTO-TRADING</button>
            <button className="btn btn-ghost text-lg">View Plans</button>
          </div>

          <div className="flex gap-3">
            <span className="badge">Non-custodial</span>
            <span className="badge">AI-Signals</span>
            <span className="badge">Lock: 1–12м</span>
          </div>
        </div>

        {/* right — chart mock */}
        <div className="glass p-5 relative">
          <div className="text-yellow-300/80 font-semibold mb-3">AI Trading Simulation</div>
          <div className="rounded-2xl h-72 bg-gradient-to-b from-neutral-800 to-neutral-950 relative overflow-hidden">
            <svg viewBox="0 0 400 200" className="absolute inset-0">
              {[...Array(30)].map((_,i)=>{
                const x=i*13+10; const up=i%3!==0;
                const body=Math.random()*60+10; const y=40+Math.random()*80;
                const color=up?'#36D399':'#F87171';
                return (
                  <g key={i}>
                    <rect x={x} y={y} width="8" height={body} rx="2" fill={color}/>
                    <rect x={x+3} y={y-20} width="2" height={body+40} fill={color}/>
                  </g>
                )
              })}
              <path d="M0,150 C80,20 160,180 240,70 320,100 360,60 400,120" stroke="#22D3EE" strokeWidth="3" fill="none"/>
              <circle cx="240" cy="70" r="5" fill="#22D3EE"/>
            </svg>
            <div className="absolute top-3 left-3"><Stat label="Signal" value={risk}/></div>
            <div className="absolute bottom-3 right-3"><Stat label="APR (mo)" value={(pr*100).toFixed(0)+'%'}/></div>
          </div>
          <div className="absolute inset-0 pointer-events-none rounded-3xl shadow-glow" />
        </div>
      </section>

      {/* PLANS */}
      <section className="container pb-16">
        <h2 className="text-2xl font-black mb-6">Планы</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {name:'LOW', apr:'~5%/мес', lock:'1–12 мес', desc:'Стабильность для аккуратного прироста.'},
            {name:'MEDIUM', apr:'~12%/мес', lock:'1–6 мес', desc:'Баланс риска и доходности.'},
            {name:'HIGH', apr:'~28%/мес', lock:'1–3 мес', desc:'Агрессивная стратегия для максимума.'},
          ].map(p=>(
            <div key={p.name} className="glass p-6 flex flex-col gap-3">
              <div className="text-lg font-black">{p.name}</div>
              <div className="text-3xl font-black">{p.apr}</div>
              <div className="text-yellow-300/80">Lock: {p.lock}</div>
              <p className="text-yellow-300/70">{p.desc}</p>
              <button className="btn btn-primary mt-2">Выбрать</button>
            </div>
          ))}
        </div>
      </section>

      <footer className="container py-10 text-xs text-yellow-300/60 border-t border-yellow-500/15">
        © {new Date().getFullYear()} PaidOFF. All rights reserved.
      </footer>
    </div>
  );
}
