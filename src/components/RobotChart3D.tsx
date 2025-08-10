// src/components/RobotChart3D.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Stars } from "@react-three/drei";
import * as THREE from "three";

type Trade = { x: number; y: number; type: "buy" | "sell" };

function useTradingFeed(points = 42) {
  const [curvePts, setCurvePts] = useState<THREE.Vector3[]>([]);
  const [trade, setTrade] = useState<Trade | null>(null);

  useEffect(() => {
    const init: THREE.Vector3[] = [];
    let val = 0.9;
    for (let i = 0; i < points; i++) {
      val = THREE.MathUtils.clamp(val + (Math.random() - 0.5) * 0.12, 0.3, 1.9);
      init.push(new THREE.Vector3(i * 0.16, val, 0));
    }
    setCurvePts(init);
  }, [points]);

  useEffect(() => {
    const t = setInterval(() => {
      setCurvePts((prev) => {
        const last = prev[prev.length - 1];
        const val = THREE.MathUtils.clamp(last.y + (Math.random() - 0.5) * 0.18, 0.25, 2.0);
        const next = new THREE.Vector3(last.x + 0.16, val, 0);
        const arr = [...prev.slice(1), next];

        const delta = next.y - prev[prev.length - 2].y;
        if (Math.abs(delta) > 0.12) {
          setTrade({ x: next.x, y: next.y, type: delta > 0 ? "buy" : "sell" });
        } else {
          setTrade(null);
        }
        return arr;
      });
    }, 900);
    return () => clearInterval(t);
  }, []);

  return { curvePts, trade };
}

function RobotArm({
  target,
  base = new THREE.Vector3(0, 0.5, 0),
}: {
  target: THREE.Vector3 | null;
  base?: THREE.Vector3;
}) {
  const shoulder = useRef<THREE.Group>(null);
  const forearm = useRef<THREE.Group>(null);
  const hand = useRef<T
