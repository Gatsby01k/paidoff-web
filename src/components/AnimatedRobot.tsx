import React from "react";

export default function AnimatedRobot() {
  return (
    <div className="relative w-full max-w-[380px] mx-auto select-none">
      <svg viewBox="0 0 300 260" className="w-full drop-shadow-[0_0_30px_rgba(255,229,0,.15)]">
        {/* Тело */}
        <rect x="40" y="70" rx="18" ry="18" width="220" height="120" fill="#0e0f11" stroke="#FFE500" strokeOpacity="0.25" />
        {/* Голова */}
        <rect x="80" y="20" rx="14" ry="14" width="140" height="70" fill="#111214" stroke="#FFE500" strokeOpacity="0.35" />
        {/* Антенна */}
        <g className="animate-antenna origin-[150px_10px]">
          <rect x="148" y="6" width="4" height="16" fill="#FFE500" />
          <circle cx="150" cy="6" r="5" fill="#FFE500" />
        </g>
        {/* Глаза */}
        <g>
          <circle cx="120" cy="50" r="12" fill="#0a0a0a" stroke="#FFE500" strokeOpacity="0.35" />
          <circle cx="180" cy="50" r="12" fill="#0a0a0a" stroke="#FFE500" strokeOpacity="0.35" />
          <circle className="animate-eye" cx="120" cy="50" r="6" fill="#FFE500" />
          <circle className="animate-eye" cx="180" cy="50" r="6" fill="#FFE500" />
        </g>
        {/* Рот */}
        <rect x="120" y="96" width="60" height="10" rx="4" fill="#FFE500" opacity="0.2" />
        {/* Руки */}
        <rect x="20" y="95" width="20" height="70" rx="10" fill="#111214" stroke="#FFE500" strokeOpacity="0.2" />
        <rect x="260" y="95" width="20" height="70" rx="10" fill="#111214" stroke="#FFE500" strokeOpacity="0.2" />
        {/* Ноги */}
        <rect x="100" y="190" width="30" height="40" rx="8" fill="#111214" stroke="#FFE500" strokeOpacity="0.2" />
        <rect x="170" y="190" width="30" height="40" rx="8" fill="#111214" stroke="#FFE500" strokeOpacity="0.2" />
      </svg>
      <div className="absolute -bottom-2 left-0 right-0 h-3 rounded-full bg-yellow-500/0 shadow-[0_0_50px_8px_rgba(255,229,0,.2)]" />
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs rounded-xl bg-[#0e0f11] border border-yellow-500/20 text-yellow-300">
        AI Bot online
      </div>
    </div>
  );
}
