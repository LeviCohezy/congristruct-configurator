import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { ModularUnit3D } from "./ModularUnit3D";
import type { ConfigState } from "@/hooks/useConfigurator";

interface PreviewPanelProps {
  config: ConfigState;
  currentStep: number;
}

function SceneContent({ config }: { config: ConfigState }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.45} color="#f0ece8" />
      <directionalLight
        position={[7, 9, 6]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={35}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* Fill light from left */}
      <directionalLight position={[-5, 3, 4]} intensity={0.6} color="#e8f0f8" />
      {/* Bounce from ground */}
      <directionalLight position={[0, -3, 3]} intensity={0.25} color="#f5f0ea" />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* The unit */}
      <ModularUnit3D config={config} />

      {/* Ground shadow */}
      <ContactShadows
        position={[0, -1.41, 0]}
        opacity={0.35}
        scale={20}
        blur={2.5}
        far={4}
        color="#000000"
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.42, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#f4f2ef" roughness={1} metalness={0} />
      </mesh>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-accent rounded-full animate-spin" />
        <span className="text-xs font-medium tracking-wide">Loading 3D model…</span>
      </div>
    </div>
  );
}

export function PreviewPanel({ config }: PreviewPanelProps) {
  const modelLabel =
    config.model === "compact"
      ? "Compact · 15m²"
      : config.model === "standard"
      ? "Standard · 25m²"
      : "Large · 40m²";

  return (
    <div className="relative w-full h-full bg-surface flex flex-col overflow-hidden">
      {/* Floating model badge */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 pointer-events-none">
        <span className="px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border text-xs font-medium text-foreground">
          {modelLabel}
        </span>
      </div>

      {/* Mirror indicator */}
      {config.mirrorPlan && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 pointer-events-none">
          <span className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
            Mirrored
          </span>
        </div>
      )}

      {/* Drag hint */}
      <div className="absolute bottom-16 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <span className="px-3 py-1.5 rounded-full bg-card/70 backdrop-blur-sm border border-border text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
          </svg>
          Drag to rotate · Scroll to zoom
        </span>
      </div>

      {/* 3D Canvas */}
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          shadows
          camera={{ position: [7, 3.5, 7], fov: 38 }}
          gl={{ antialias: true, toneMapping: 4 /* ReinhardToneMapping */, toneMappingExposure: 1.1 }}
          style={{ width: "100%", height: "100%" }}
        >
          <SceneContent config={config} />
          <OrbitControls
            enablePan={false}
            minDistance={5}
            maxDistance={18}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate={false}
            target={[0, 0, 0]}
          />
        </Canvas>
      </Suspense>

      {/* Config chips */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center pointer-events-none">
        <Chip label={config.facade.replace(/-/g, " ")} />
        <Chip label={config.windowType + " windows"} />
        <Chip label={config.finishLevel.replace(/-/g, " ")} />
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="px-2.5 py-1 rounded-md bg-card/70 backdrop-blur-sm border border-border text-[11px] font-medium text-muted-foreground capitalize">
      {label}
    </span>
  );
}
