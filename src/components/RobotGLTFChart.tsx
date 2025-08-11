import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Stars, Trail, useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

/** ===== поток «цены» с торговыми импульсами ===== */
type Trade = { x: number; y: number; type: "buy" | "sell" };

function useTradingFeed(points = 44) {
  const [curvePts, setCurvePts] = useState<THREE.Vector3[]>([]);
  const [trade, setTrade] = useState<Trade | null>(null);

  useEffect(() => {
    const init: THREE.Vector3[] = [];
    let val = 1.0;
    for (let i = 0; i < points; i++) {
      val = THREE.MathUtils.clamp(val + (Math.random() - 0.5) * 0.12, 0.35, 2.0);
      init.push(new THREE.Vector3(i * 0.16, val, 0));
    }
    setCurvePts(init);
  }, [points]);

  useEffect(() => {
    const t = setInterval(() => {
      setCurvePts((prev) => {
        const last = prev[prev.length - 1];
        const val = THREE.MathUtils.clamp(last.y + (Math.random() - 0.5) * 0.18, 0.3, 2.1);
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

/** ===== неоновая рука с IK (2 сегмента) ===== */
function NeonArm({
  target,
  base = new THREE.Vector3(-3.0, -1.05, 0.08),
}: {
  target: THREE.Vector3 | null;
  base?: THREE.Vector3;
}) {
  const shoulder = useRef<THREE.Group>(null);
  const forearm = useRef<THREE.Group>(null);
  const hand = useRef<THREE.Mesh>(null);

  const L1 = 0.85;
  const L2 = 0.75;

  useFrame(() => {
    if (!shoulder.current || !forearm.current) return;
    const tgt = target ?? new THREE.Vector3(base.x + 1.2, base.y + 0.8, base.z);

    const tx = tgt.x - base.x;
    const ty = tgt.y - base.y;
    const d = Math.min(Math.hypot(tx, ty), L1 + L2 - 1e-4);

    const a = Math.acos(THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const b = Math.atan2(ty, tx);
    const shoulderAng = b - a;
    const elbowAng =
      Math.PI -
      Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));

    shoulder.current.rotation.z = THREE.MathUtils.lerp(shoulder.current.rotation.z, shoulderAng, 0.18);
    forearm.current.rotation.z = THREE.MathUtils.lerp(forearm.current.rotation.z, elbowAng, 0.22);
    shoulder.current.rotation.y = THREE.MathUtils.lerp(
      shoulder.current.rotation.y,
      Math.sin(performance.now() / 1200) * 0.1,
      0.06
    );

    if (hand.current && target) {
      const dist = hand.current.getWorldPosition(new THREE.Vector3()).distanceTo(target);
      hand.current.scale.setScalar(dist < 0.08 ? 1.14 : 1);
    }
  });

  const cyl = (len: number, r = 0.08, color = "#FFE500") => (
    <mesh rotation={[0, 0, Math.PI / 2]} position={[len / 2, 0, 0]}>
      <cylinderGeometry args={[r, r, len, 22]} />
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.35} />
    </mesh>
  );

  return (
    <group position={base.toArray()}>
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.55, 24]} />
        <meshStandardMaterial color="#1c1e21" metalness={0.2} roughness={0.7} />
      </mesh>
      <group ref={shoulder}>
        {cyl(L1, 0.095, "#F5D300")}
        <group ref={forearm} position={[L1, 0, 0]}>
          {cyl(L2, 0.085, "#F0C900")}
          <Trail width={3} color="#FFE500" length={4} attenuation={(t) => t}>
            <mesh ref={hand} position={[L2 + 0.06, 0, 0]}>
              <sphereGeometry args={[0.09, 24, 24]} />
              <meshStandardMaterial color="#fff" emissive="#FFE500" emissiveIntensity={0.9} />
            </mesh>
          </Trail>
        </group>
      </group>
    </group>
  );
}

/** ===== тело-робот (GLTF, CC0) — Idle-анимация ===== */
function BotBody() {
  const url = "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb";
  const gltf = useGLTF(url) as any;
  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations(gltf.animations, group);

  useEffect(() => {
    const first = actions && Object.values(actions)[0];
    first?.reset().fadeIn(0.3).play();
    return () => first?.fadeOut(0.2);
  }, [actions]);

  return (
    <group ref={group} position={[-3.35, -1.55, 0.12]} rotation={[0, Math.PI * 0.08, 0]} scale={0.9}>
      <primitive object={gltf.scene} />
    </group>
  );
}
useGLTF.preload("https://modelviewer.dev/shared-assets/models/RobotExpressive.glb");

/** ===== вспышка-частицы по сделке ===== */
function Particles({ at }: { at: THREE.Vector3 | null }) {
  const ref = useRef<THREE.Points>(null);
  const [tBorn, setTBorn] = useState(0);
  useEffect(() => {
    if (at) setTBorn(performance.now());
  }, [at]);

  const { pos } = useMemo(() => {
    const N = 72;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      arr[i * 3 + 0] = Math.cos(a) * (0.02 + Math.random() * 0.06);
      arr[i * 3 + 1] = Math.sin(a) * (0.02 + Math.random() * 0.06);
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.06;
    }
    return { pos: arr };
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const t = (performance.now() - tBorn) / 650;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = THREE.MathUtils.clamp(1 - t, 0, 1);
    ref.current.scale.setScalar(1 + t * 2.2);
  });

  if (!at) return null;
  return (
    <points ref={ref} position={at.toArray()}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={pos} count={pos.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#FFE500" size={0.035} sizeAttenuation transparent opacity={1} />
    </points>
  );
}

/** ===== сцена: график + робот ===== */
function Scene() {
  const { curvePts, trade } = useTradingFeed();
  const linePts = useMemo(() => curvePts.map((v) => v.clone()), [curvePts]);

  const last = linePts[linePts.length - 1] ?? new THREE.Vector3(0, 1, 0);
  const shiftX = 2.4 - last.x;

  const targetLocal = useMemo(() => {
    const p = trade ? new THREE.Vector3(trade.x, trade.y, 0) : last.clone();
    p.x += shiftX;
    return p;
  }, [trade, last, shiftX]);

  const burst = useMemo(
    () => (trade ? new THREE.Vector3(trade.x + shiftX, trade.y, 0) : null),
    [trade, shiftX]
  );

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[2.2, 3, 3]} intensity={1.2} color="#ffd84d" />
      <Stars radius={12} depth={8} factor={0.2} fade speed={0.8} />

      <group position={[2.2, 0.9, 0]} rotation={[-Math.PI * 0.12, Math.PI * 0.07, 0]}>
        <mesh>
          <planeGeometry args={[7.2, 3.4, 10, 10]} />
          <meshStandardMaterial color="#0f0f11" metalness={0.12} roughness={0.9} />
        </mesh>
        <gridHelper args={[7, 7, 0x2e2e2e, 0x1f1f1f]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.002]} />

        <group position={[shiftX, 0, 0]}>
          {linePts.length > 1 && (
            <>
              <Line points={linePts.map((p) => new THREE.Vector3(p.x, p.y, 0.02))} color="#22D3EE" lineWidth={2} />
              {linePts.map((c, i) => {
                if (i < 2) return null;
                const prev = linePts[i - 1];
                const up = c.y >= prev.y;
                const h = Math.max(0.02, Math.abs(c.y - prev.y));
                const y = Math.min(c.y, prev.y) + h / 2;
                const col = up ? "#36D399" : "#F87171";
                return (
                  <mesh key={i} position={[c.x, y, 0.01]}>
                    <boxGeometry args={[0.12, h, 0.07]} />
                    <meshStandardMaterial color={col} />
                  </mesh>
                );
              })}
            </>
          )}
        </group>

        <Suspense fallback={null}>
          <BotBody />
        </Suspense>

        <NeonArm target={targetLocal} />
        <Particles at={burst} />
      </group>
    </>
  );
}

export default function RobotGLTFChart() {
  return (
    <div className="h-[420px] w-full rounded-3xl overflow-hidden bg-[#0e0f11] border border-yellow-500/20 shadow-[0_10px_30px_rgba(0,0,0,.35)]">
      <Canvas camera={{ position: [2.1, 1.7, 5.2], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  );
}
