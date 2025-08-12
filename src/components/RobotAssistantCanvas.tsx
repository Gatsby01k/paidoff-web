import React, { useEffect, useRef } from "react";

/**
 * Лёгкая 2D-анимация робота на Canvas:
 * - голова + «антенна» с мигающим датчиком
 * - туловище
 * - рука из 2-х сегментов, которая совершает «клики»
 * - мягкое свечения/сетки на фоне
 *
 * Никаких зависимостей. Масштабируется под DPR.
 */
export default function RobotAssistantCanvas({
  onAsk,
}: {
  onAsk?: () => void;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const clickPulseRef = useRef<number>(0);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let mounted = true;

    function resize() {
      const pr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = c.clientWidth;
      const h = c.clientHeight;
      c.width = Math.floor(w * pr);
      c.height = Math.floor(h * pr);
      ctx.setTransform(pr, 0, 0, pr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    function draw() {
      const w = c.clientWidth;
      const h = c.clientHeight;

      // bg
      ctx.clearRect(0, 0, w, h);
      const grd = ctx.createRadialGradient(w * 0.6, h * 0.4, 20, w * 0.6, h * 0.4, Math.max(w,h));
      grd.addColorStop(0, "rgba(254, 228, 64, 0.08)");
      grd.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      const cell = 28;
      for (let x = ((t*0.6)%cell); x < w; x += cell) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = (-(t*0.6)%cell); y < h; y += cell) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // robot base position
      const cx = Math.floor(w * 0.38);
      const cy = Math.floor(h * 0.58);

      // body
      ctx.fillStyle = "#121212";
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      roundRect(ctx, cx - 55, cy - 50, 110, 110, 20);
      ctx.fill(); ctx.stroke();

      // head
      const headY = cy - 75 + Math.sin(t/16)*2;
      ctx.beginPath();
      ctx.fillStyle = "#1b1b1b";
      ctx.arc(cx, headY, 28, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.stroke();

      // eyes
      ctx.fillStyle = "#FDE047";
      const eyeOp = 0.7 + 0.3*Math.sin(t/8);
      ctx.globalAlpha = eyeOp;
      ctx.fillRect(cx - 12, headY - 6, 8, 4);
      ctx.fillRect(cx + 4, headY - 6, 8, 4);
      ctx.globalAlpha = 1;

      // antenna
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, headY - 28);
      ctx.lineTo(cx, headY - 40);
      ctx.stroke();
      const blink = 0.5 + 0.5*Math.sin(t/4);
      ctx.beginPath();
      ctx.fillStyle = `rgba(253, 228, 71, ${0.6 + 0.4*blink})`;
      ctx.arc(cx, headY - 44, 4 + 2*blink, 0, Math.PI*2);
      ctx.fill();

      // arm (2 segments) – «клик» по воображаемому графику
      const shoulder = { x: cx + 44, y: cy - 12 };
      const seg1 = 54, seg2 = 42;
      const targetX = w*0.78 + Math.sin(t/9)*40;
      const targetY = h*0.3 + Math.sin(t/5)*24;

      // угол на цель (простейшая кинематика для вида)
      const a1 = Math.atan2(targetY - shoulder.y, targetX - shoulder.x) - 0.2*Math.sin(t/10);
      const elbow = {
        x: shoulder.x + seg1*Math.cos(a1),
        y: shoulder.y + seg1*Math.sin(a1),
      };
      const a2 = a1 + 0.4 + 0.25*Math.sin(t/7);
      const hand = {
        x: elbow.x + seg2*Math.cos(a2),
        y: elbow.y + seg2*Math.sin(a2),
      };

      // links
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 6;
      line(ctx, shoulder, elbow);
      line(ctx, elbow, hand);

      // «курсор» на конце руки
      ctx.fillStyle = "#FDE047";
      ctx.beginPath();
      ctx.arc(hand.x, hand.y, 5, 0, Math.PI*2);
      ctx.fill();

      // «клик-пульс»
      if (Math.floor(t)%46 === 0) clickPulseRef.current = 1;
      if (clickPulseRef.current > 0) {
        clickPulseRef.current *= 0.92;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(253, 228, 71, ${clickPulseRef.current})`;
        ctx.lineWidth = 2;
        ctx.arc(hand.x, hand.y, 12 + (1-clickPulseRef.current)*20, 0, Math.PI*2);
        ctx.stroke();
      }

      // подпись/кнопка
      const badgeX = cx - 64, badgeY = cy + 70;
      ctx.fillStyle = "#FDE047";
      ctx.globalAlpha = 0.12;
      roundRect(ctx, badgeX, badgeY, 128, 32, 12);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#E5E7EB";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.textAlign = "center";
      ctx.fillText("Спросить робота", cx, badgeY + 20);

      t += 1;
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    function click(e: MouseEvent) {
      if (!onAsk) return;
      const rect = c.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // зона кнопки
      const cx = Math.floor(c.clientWidth * 0.38);
      const cy = Math.floor(c.clientHeight * 0.58);
      const bx = cx - 64, by = cy + 70;
      if (x >= bx && x <= bx + 128 && y >= by && y <= by + 32) {
        onAsk();
      }
    }

    c.addEventListener("click", click);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      c.removeEventListener("click", click);
    };
  }, [onAsk]);

  return (
    <div className="card p-2 h-[360px] md:h-[420px]">
      <canvas ref={ref} className="w-full h-full rounded-2xl block" />
    </div>
  );
}

function line(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number }
) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
