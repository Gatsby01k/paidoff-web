import React, { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, LineStyle } from "lightweight-charts";

type Props = { risk: "LOW" | "MEDIUM" | "HIGH" };

export default function LiveChartFast({ risk }: Props) {
  const el = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!el.current) return;

    // init
    const chart = createChart(el.current, {
      width: el.current.clientWidth,
      height: el.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#e5e7eb"
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" }
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        secondsVisible: false,
        timeVisible: true
      },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } }
    });

    chartRef.current = chart;
    const green = chart.addAreaSeries({
      topColor: "rgba(34, 197, 94, .32)",
      bottomColor: "rgba(34, 197, 94, 0)",
      lineColor: "#22c55e",
      lineWidth: 2
    });

    // seed
    let t = Date.now() / 1000;
    let v = 100;
    const data: { time: number; value: number }[] = [];
    for (let i = 0; i < 200; i++) {
      t += 60;
      v += (Math.random() - 0.5) * 2;
      data.push({ time: t, value: v });
    }
    green.setData(data);
    chart.timeScale().fitContent();

    // speed depends on risk
    const speed =
      risk === "HIGH" ? 40 : risk === "MEDIUM" ? 20 : 10; // points/min
    const vol =
      risk === "HIGH" ? 2.4 : risk === "MEDIUM" ? 1.4 : 0.8; // amplitude

    let raf = 0;
    function loop() {
      const last = data[data.length - 1];
      const step = 60 / speed; // seconds per tick

      const nextT = last.time + step;
      const nextV =
        last.value +
        (Math.random() - 0.5) * vol +
        Math.sin(nextT / 30) * 0.1;

      data.push({ time: nextT, value: nextV });
      if (data.length > 400) data.shift();
      green.update({ time: nextT, value: nextV });
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      if (!el.current) return;
      chart.applyOptions({
        width: el.current.clientWidth,
        height: el.current.clientHeight
      });
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, [risk]);

  return <div ref={el} className="w-full h-full" />;
}
