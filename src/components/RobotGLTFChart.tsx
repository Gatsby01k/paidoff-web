// src/components/RobotGLTFChart.tsx
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, Stars, Trail, useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

/* ------------ простая «цена» + события сделок ------------ */
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
        const val = THREE.MathUtils.clamp(last.y + (Math.random() - 0.5) * 0.16, 0.3, 2.1);
        const next = new THREE.Vector3(last.x + 0.16, val, 0);
        const arr = [...prev.slice(1), next];

        const delta = next.y - prev[prev.length - 2].y;
        if (Math.abs(delta) > 0.12) setTrade({ x: next.x, y: next.y, type: delta > 0 ? "buy" : "sell" });
        else setTrade(null);

        return arr;
      });
    }, 950);
    return () => clearInterval(t);
  }, []);

  return { curvePts, trade };
}

/* ------------ рука-манипулятор (IK) — укоротил и сместил ------------ */
function NeonArm({
  target,
  base = new THREE.Vector3(-1.65, -0.75, 0.08),
}: {
  target: THREE.Vector3 | null;
  base?: THREE.Vector3;
}) {
  const shoulder = useRef<THREE.Group>(null);
  const forearm = useRef<THREE.Group>(null);
  const hand = useRef<THREE.Mesh>(null);

  // более компактные сегменты
  const L1 = 0.6;
  const L2 = 0.5;

  useFrame(() => {
    if (!shoulder.current || !forearm.current) return;
    const tgt = target ?? new THREE.Vector3(base.x + 0.9, base.y + 0.6, base.z);

    const tx = tgt.x - base.x;
    const ty = tgt.y - base.y;
    const d = Math.min(Math.hypot(tx, ty), L1 + L2 - 1e-4);

    const a = Math.acos(THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const b = Math.atan2(ty, tx);
    const shoulderAng = b - a;
    const elbowAng = Math.PI - Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));

    shoulder.current.rotation.z = THREE.MathUtils.lerp(shoulder.current.rotation.z, shoulderAng, 0.18);
    forearm.current.rotation.z = THREE.MathUtils.lerp(forearm.current.rotation.z, elbowAng, 0.22);
    shoulder.current.rotation.y = THREE.MathUtils.lerp(
      shoulder.current.rotation.y,
      Math.sin(performance.now() / 1300) * 0.08,
      0.06
    );

    if (hand.current && target) {
      const dist = hand.current.getWorldPosition(new THREE.Vector3()).distanceTo(target);
      hand.current.scale.setScalar(dist < 0.08 ? 1.12 : 1);
    }
  });

  const cyl = (len: number, r = 0.07, color = "#FFE500") => (
    <mesh rotation={[0, 0, Math.PI / 2]} position={[len / 2, 0, 0]}>
      <cylinderGeometry args={[r, r, len, 22]} />
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.35} />
    </mesh>
  );

  return (
    <group position={base.toArray()}>
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.45, 24]} />
        <meshStandardMaterial color="#17181a" metalness={0.2} roughness={0.7} />
      </mesh>
      <group ref={shoulder}>
        {cyl(L1, 0.085, "#F5D300")}
        <group ref={forearm} position={[L1, 0, 0]}>
          {cyl(L2, 0.075, "#F0C900")}
          <Trail width={2.5} color="#FFE500" length={4} attenuation={(t) => t}>
            <mesh ref={hand} position={[L2 + 0.05, 0, 0]}>
              <sphereGeometry args={[0.08, 24, 24]} />
              <meshStandardMaterial color="#fff" emissive="#FFE500" emissiveIntensity={0.9} />
            </mesh>
          </Trail>
        </group>
      </group>
    </group>
  );
}

/* ------------ тело робота (GLTF) — меньше, дальше, повернут к графику ------------ */
function BotBody() {
  const url = "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb";
  const gltf = useGLTF(url) as any;
  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations(gltf.animations, group);

  useEffect(() => {
    const idle = actions && Object.values(actions)[0];
    idle?.reset().fadeIn(0.3).play();
    return () => idle?.fadeOut(0.2);
  }, [actions]);

  return (
    <group ref={group} position={[-2.25, -1.25, 0.08]} rotation={[0, Math.PI * 0.18, 0]} scale={0.55}>
      <primitive object={gltf.scene} />
    </group>
  );
}
useGLTF.preload("https://modelviewer.dev/shared-assets/models/RobotExpressive.glb");

/* ------------ частицы вспышки сделки ------------ */
function Particles({ at }: { at: THREE.Vector3 | null }) {
  const ref = useRef<THREE.Points>(null);
  const [born, setBorn] = useState(0);
  useEffect(() => {
    if (at) setBorn(performance.now());
  }, [at]);

  const { pos } = useMemo(() => {
    const N = 60;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      arr[i * 3 + 0] = Math.cos(a) * (0.02 + Math.random() * 0.05);
      arr[i * 3 + 1] = Math.sin(a) * (0.02 + Math.random() * 0.05);
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }
    return { pos: arr };
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const t = (performance.now() - born) / 600;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = THREE.MathUtils.clamp(1 - t, 0, 1);
    ref.current.scale.setScalar(1 + t * 2);
  });

  if (!at) return null;
  return (
    <points ref={ref} position={at.toArray()}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={pos} count={pos.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#FFE500" size={0.03} sizeAttenuation transparent opacity={1} />
    </points>
  );
}

/* ------------ сцена: аккуратный кадр, панель «стекло» ------------ */
function Scene() {
  const { gl } = useThree();
  useEffect(() => {
    gl.setClearColor("#0b0c0e");
    gl.physicallyCorrectLights = true;
  }, [gl]);

  const { curvePts, trade } = useTradingFeed();
  const pts = useMemo(() => curvePts.map((v) => v.clone()), [curvePts]);
  const last = pts[pts.length - 1] ?? new THREE.Vector3(0, 1, 0);
  const shiftX = 2.0 - last.x;

  const target = useMemo(() => {
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
      {/* мягкий свет и фон */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 4]} intensity={1.2} color={"#fff9c2"} />
      <Stars radius={10} depth={6} factor={0.25} fade speed={0.6} />

      {/* панель с сеткой (чуть меньше, чтобы не упиралась в края) */}
      <group position={[1.25, 0.6, 0]} rotation={[-Math.PI * 0.12, Math.PI * 0.08, 0]}>
        <mesh>
          <planeGeometry args={[6.2, 3.1, 10, 10]} />
          <meshStandardMaterial color="#0e0f12" metalness={0.12} roughness={0.85} />
        </mesh>
        <gridHelper args={[6.2, 7, 0x2b2b2b, 0x1b1b1b]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.002]} />

        {/* график сдвинут так, чтобы не обрезался справа */}
        <group position={[shiftX, 0, 0]}>
          {pts.length > 1 && (
            <>
              <Line
                points={pts.map((p) => new THREE.Vector3(p.x, p.y, 0.02))}
                color="#22D3EE"
                lineWidth={2}
              />
              {pts.map((c, i) => {
                if (i < 2) return null;
                const prev = pts[i - 1];
                const up = c.y >= prev.y;
                const h = Math.max(0.02, Math.abs(c.y - prev.y));
                const y = Math.min(c.y, prev.y) + h / 2;
                return (
                  <mesh key={i} position={[c.x, y, 0.01]}>
                    <boxGeometry args={[0.11, h, 0.06]} />
                    <meshStandardMaterial color={up ? "#36D399" : "#F87171"} />
                  </mesh>
                );
              })}
            </>
          )}
        </group>

        {/* аккуратный робот в кадре */}
        <Suspense fallback={null}>
          <BotBody />
        </Suspense>

        <NeonArm target={target} />
        <Particles at={burst} />
      </group>
    </>
  );
}

export default function RobotGLTFChart() {
  return (
    <div
      className="relative h-[520px] w-full rounded-3xl overflow-hidden border border-yellow-500/20"
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,215,0,.06) inset, 0 20px 60px rgba(0,0,0,.45), 0 0 60px rgba(255,215,0,.06)",
        background:
          "radial-gradient(1200px 600px at 20% -20%, rgba(255,231,91,.06), transparent 60%), #050607",
      }}
    >
      <Canvas
        camera={{ position: [1.3, 1.05, 4.1], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
