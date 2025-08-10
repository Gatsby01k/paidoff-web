import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Effects, Stars } from "@react-three/drei";
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

        // триггерим "сделку" по простому правилу — сильный ап/даун-тик
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
  // простая 2D-ИК (2-сегментный манипулятор) в плоскости X/Y
  const shoulder = useRef<THREE.Group>(null);
  const forearm = useRef<THREE.Group>(null);
  const hand = useRef<THREE.Mesh>(null);

  const L1 = 0.7;
  const L2 = 0.6;

  useFrame((_, dt) => {
    if (!shoulder.current || !forearm.current) return;
    const tgt = target ?? new THREE.Vector3(base.x + 0.8, base.y + 0.6, base.z);

    // локальный таргет от базы
    const tx = tgt.x - base.x;
    const ty = tgt.y - base.y;
    const d = Math.min(Math.sqrt(tx * tx + ty * ty), L1 + L2 - 0.0001);

    // косинусное правило
    const a = Math.acos(THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const b = Math.atan2(ty, tx);
    const shoulderAng = b - a;
    const elbowAng = Math.PI - Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));

    // плавно
    shoulder.current.rotation.z = THREE.MathUtils.lerp(shoulder.current.rotation.z, shoulderAng, 0.15);
    forearm.current.rotation.z = THREE.MathUtils.lerp(forearm.current.rotation.z, elbowAng, 0.2);

    // небольшие "оживляющие" покачивания
    shoulder.current.rotation.y = THREE.MathUtils.lerp(shoulder.current.rotation.y, Math.sin(performance.now() / 1200) * 0.1, 0.05);

    // лёгкий импульс кисти при попадании в цель
    if (hand.current && target) {
      const dist = hand.current.getWorldPosition(new THREE.Vector3()).distanceTo(target);
      if (dist < 0.09) {
        hand.current.scale.setScalar(1.12);
      } else {
        hand.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group position={base.toArray()}>
      {/* стойка */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 16]} />
        <meshStandardMaterial color={"#202226"} />
      </mesh>

      {/* плечо */}
      <group ref={shoulder}>
        <mesh position={[L1 / 2, 0, 0]}>
          <boxGeometry args={[L1, 0.1, 0.1]} />
          <meshStandardMaterial color={"#FFE500"} metalness={0.3} roughness={0.4} />
        </mesh>

        {/* предплечье */}
        <group ref={forearm} position={[L1, 0, 0]}>
          <mesh position={[L2 / 2, 0, 0]}>
            <boxGeometry args={[L2, 0.09, 0.09]} />
            <meshStandardMaterial color={"#F3D200"} metalness={0.35} roughness={0.35} />
          </mesh>

          {/* кисть/указатель */}
          <mesh ref={hand} position={[L2 + 0.05, 0, 0]}>
            <boxGeometry args={[0.12, 0.06, 0.06]} />
            <meshStandardMaterial color={"#fff"} emissive={"#FFE500"} emissiveIntensity={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Particles({ at }: { at: THREE.Vector3 | null }) {
  const ref = useRef<THREE.Points>(null);
  const [tBorn, setTBorn] = useState(0);

  useEffect(() => {
    if (at) setTBorn(performance.now());
  }, [at]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const N = 60;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      pos[i * 3 + 0] = Math.cos(a) * (0.02 + Math.random() * 0.05);
      pos[i * 3 + 1] = Math.sin(a) * (0.02 + Math.random() * 0.05);
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const t = (performance.now() - tBorn) / 700;
    ref.current.material.opacity = THREE.MathUtils.clamp(1 - t, 0, 1);
    ref.current.scale.setScalar(1 + t * 2);
  });

  if (!at) return null;
  return (
    <points ref={ref} position={at.toArray()}>
      {/* @ts-ignore */}
      <bufferGeometry attach="geometry" {...geom} />
      {/* @ts-ignore */}
      <pointsMaterial attach="material" color={"#FFE500"} size={0.03} sizeAttenuation transparent />
    </points>
  );
}

function Scene() {
  const { curvePts, trade } = useTradingFeed();
  const linePts = useMemo(() => curvePts.map((v) => v.clone()), [curvePts]);

  // таргет робота: последняя точка или точка сделки
  const target = useMemo(() => {
    const p = trade ? new THREE.Vector3(trade.x, trade.y, 0) : linePts[linePts.length - 1];
    return p ? p.clone() : null;
  }, [linePts, trade]);

  const tradeBurst = useMemo(() => (trade ? new THREE.Vector3(trade.x, trade.y, 0) : null), [trade]);

  // отрисовка сетки/оси
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[2, 3, 3]} intensity={1.2} color={"#ffd84d"} />
      <Stars radius={12} depth={8} factor={0.2} fade speed={0.8} />

      {/* плоскость графика */}
      <mesh position={[2.2, 0.9, 0]} rotation={[-Math.PI * 0.12, Math.PI * 0.07, 0]}>
        <planeGeometry args={[7.2, 3.4, 10, 10]} />
        <meshStandardMaterial color={"#0f0f11"} metalness={0.1} roughness={0.9} />
        {/* сетка поверх */}
        <gridHelper args={[7, 7, 0x333333, 0x222222]} rotation-x={Math.PI / 2} position={[0, 0, 0.002]} />
      </mesh>

      {/* линия курса */}
      {linePts.length > 1 && (
        <group position={[2.2 - (linePts[linePts.length - 1].x - 6.2), 0.9, 0]} rotation={[-Math.PI * 0.12, Math.PI * 0.07, 0]}>
          <Line
            points={linePts.map((p) => new THREE.Vector3(p.x, p.y, 0.02))}
            color={"#22D3EE"}
            lineWidth={2}
            dashed={false}
          />
          {/* свечи */}
          {linePts.map((c, i) => {
            if (i < 2) return null;
            const prev = linePts[i - 1];
            const up = c.y >= prev.y;
            const h = Math.max(0.02, Math.abs(c.y - prev.y));
            const y = Math.min(c.y, prev.y) + h / 2;
            const col = up ? "#36D399" : "#F87171";
            return (
              <mesh key={i} position={[c.x, y, 0.01]}>
                <boxGeometry args={[0.09, h, 0.06]} />
                <meshStandardMaterial color={col} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* робот у края графика */}
      <RobotArm target={target} base={new THREE.Vector3(0.2, 0.7, 0)} />

      {/* вспышка при сделке */}
      <Particles at={tradeBurst} />

      {/* эффекты */}
      <Effects disableGamma>
        {/* лёгкое свечение */}
        {/* @ts-ignore */}
        <bloom luminanceThreshold={0.2} luminanceSmoothing={0.8} height={300} intensity={0.8} />
      </Effects>

      {/* по желанию — управление камерой для теста */}
      {/* <OrbitControls enablePan={false} enableZoom={false} enableRotate={true}/> */}
    </>
  );
}

export default function RobotChart3D() {
  return (
    <div className="h-[420px] w-full rounded-3xl overflow-hidden bg-[#0e0f11] border border-yellow-500/20 shadow-[0_10px_30px_rgba(0,0,0,.35)]">
      <Canvas camera={{ position: [2.1, 1.6, 5], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  );
}
