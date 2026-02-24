import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { ModularUnit3D } from "./ModularUnit3D";
import type { ConfigState } from "@/hooks/useConfigurator";

// Interior images for BLOQ START
import brownImg1 from "@/assets/start-interior-brown-1.avif";
import brownImg2 from "@/assets/start-interior-brown-2.avif";
import lightoakImg1 from "@/assets/start-interior-lightoak-1.avif";
import lightoakImg2 from "@/assets/start-interior-lightoak-2.avif";
import whiteImg1 from "@/assets/start-interior-white-1.avif";
import whiteImg2 from "@/assets/start-interior-white-2.avif";
import instapklaarImg1 from "@/assets/start-interior-instapklaar-1.avif";
import instapklaarImg2 from "@/assets/start-interior-instapklaar-2.avif";

const interiorImageMap: Record<string, [string, string]> = {
  "finished": [instapklaarImg1, instapklaarImg2],
  "fully-finished:brown": [brownImg1, brownImg2],
  "fully-finished:light-oak": [lightoakImg1, lightoakImg2],
  "fully-finished:white": [whiteImg1, whiteImg2],
};

function getInteriorImages(config: ConfigState): [string, string] {
  if (config.finishLevel === "finished") return interiorImageMap["finished"];
  return interiorImageMap[`fully-finished:${config.shelfColor}`] ?? interiorImageMap["fully-finished:brown"];
}

interface PreviewPanelProps {
  config: ConfigState;
  currentStep: number;
  onOverrideWoodColor?: (color: string | null) => void;
  showInteriorImages?: boolean;
}

function SceneContent({ config }: { config: ConfigState }) {
  return (
    <>
      <ambientLight intensity={0.3} color="#f0ece8" />
      <directionalLight
        position={[7, 9, 6]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={35}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-5, 3, 4]} intensity={0.4} color="#e8f0f8" />
      <directionalLight position={[0, -3, 3]} intensity={0.15} color="#f5f0ea" />
      <Environment preset="city" />
      <ModularUnit3D config={config} />
      <ContactShadows position={[0, -1.41, 0]} opacity={0.35} scale={20} blur={2.5} far={4} color="#000000" />
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

const modelLabels: Record<ConfigState["model"], string> = {
  start: "BLOQ START · 14m²",
  flow: "BLOQ FLOW · 21–28m²",
  hub: "BLOQ HUB · 35m²",
  base: "BLOQ BASE · 50m²",
};

export function PreviewPanel({ config, showInteriorImages }: PreviewPanelProps) {
  const images = getInteriorImages(config);

  return (
    <div className="relative w-full h-full bg-surface flex flex-col overflow-hidden">

      {/* Model badge */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 pointer-events-none">
        <span className="px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border text-xs font-medium text-foreground">
          {modelLabels[config.model]}
        </span>
      </div>

      {config.mirrorPlan && (
        <div className="absolute top-14 right-4 sm:top-16 sm:right-6 z-10 pointer-events-none">
          <span className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
            Gespiegeld
          </span>
        </div>
      )}

      <div className="absolute bottom-16 left-0 right-0 z-10 hidden lg:flex justify-center pointer-events-none">
        <span className="px-3 py-1.5 rounded-full bg-card/70 backdrop-blur-sm border border-border text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
          </svg>
          Sleep om te draaien · Scroll om te zoomen
        </span>
      </div>

      {/* 3D Canvas */}
      <AnimatePresence>
        {!showInteriorImages && (
          <motion.div
            key="canvas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Suspense fallback={<LoadingFallback />}>
              <Canvas
                shadows
                camera={{ position: [7, 3.5, 7], fov: 38 }}
                gl={{ antialias: true, toneMapping: 4, toneMappingExposure: 0.9 }}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interior images overlay for BLOQ START */}
      <AnimatePresence>
        {showInteriorImages && (
          <motion.div
            key="interior-images"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 overflow-auto"
          >
            <img
              src={images[0]}
              alt="Interieur aanzicht 1"
              className="w-full max-w-2xl rounded-lg object-contain"
            />
            <img
              src={images[1]}
              alt="Interieur aanzicht 2"
              className="w-full max-w-2xl rounded-lg object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center pointer-events-none">
        <Chip label={config.facade.replace(/-/g, " ")} />
        <Chip label={config.floorPlan === "a" ? "Plan A" : "Plan B"} />
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
