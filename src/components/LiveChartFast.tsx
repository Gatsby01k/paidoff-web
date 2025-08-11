import React, { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  ISeriesApi,
  AreaSeriesPartialOptions,
  Time,
} from "lightweight-charts";

type Risk = "LOW" | "MEDIUM" | "HIGH";

type Props = {
  risk: Risk;
};

function aprFor(risk: Risk) {
  if (risk === "HIGH") return 0.26;
  if (risk === "MEDIUM") return 0.12;
  return 0.05;
}

export default function LiveChartFast({ risk }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const stopRef = useRef<() => void>();

  useEffect(() => {
    if (!ref.current) return;

    const chart = createChart(ref.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.82)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.07)" },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.15 },
      },
      timeScale: {
        borderVisible: false,
        rightOffset: 5,
        barSpacing: 6,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      crosshair: {
        mode: 0,
      },
    });

    const areaOpts: AreaSeriesPartialOptions = {
      topColor: "rgba(255, 225, 0, 0.35)",
      bottomColor: "rgba(255, 225, 0, 0.02)",
      lineColor: "#FFE500",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    };

    const series = chart.addAreaSeries(areaOpts);
    seriesRef.current = series;

    // начальные точки
    const now = Math.floor(Date.now() / 1000) as Time;
    const data = Array.from({ length: 120 }).map((_, i) => {
      const t = (now - (120 - i)) as Time;
      const v = 1 + Math.sin(i / 11) * 0.15 + Math.random() * 0.05;
      return { time: t, value: v };
    });
    series.setData(data);

    // поток обновлений
    const speed = 120; // мс — быстрый флов
    let timer = setInterval(() => {
      const last = (seriesRef.current!.dataByIndex(
        seriesRef.current!.data().length - 1
      ) as any) ?? data[data.length - 1];

      // добавляем немного "волатильности" от риска
      const vol = aprFor(risk) * 0.6 + 0.02; // чем выше риск, тем шустрее
      const nextValue = Math.max(
        0.3,
        Math.min(2.5, (last.value ?? last?.value ?? 1) + (Math.random() - 0.5) * vol)
      );
      const nextTime = (Math.floor(Date.now() / 1000) as Time);

      series.update({ time: nextTime, value: nextValue });

      // плавный автоскролл
      chart.timeScale().scrollToRealTime();
    }, speed);

    stopRef.current = () => {
      clearInterval(timer);
      chart.remove();
    };
    return () => stopRef.current?.();
  }, [risk]);

  return (
    <div
      className="relative w-full h-[380px] rounded-2xl border border-yellow-500/20 overflow-hidden"
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,215,0,.06) inset, 0 20px 60px rgba(0,0,0,.45), 0 0 60px rgba(255,215,0,.06)",
        background:
          "radial-gradient(1200px 600px at 20% -20%, rgba(255,231,91,.06), transparent 60%), #050607",
      }}
    >
      <div className="absolute z-10 left-3 top-3 text-xs font-semibold px-2 py-1 rounded-md bg-yellow-400/10 text-yellow-300 border border-yellow-300/30">
        Signal: {risk}
      </div>
      <div ref={ref} className="absolute inset-0" />
    </div>
  );
}
