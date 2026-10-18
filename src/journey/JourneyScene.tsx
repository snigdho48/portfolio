import { Suspense, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { makeEnvTexture } from "./env";

/** Procedural reflection environment for the glass / metal materials. */
function Env() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const tex = makeEnvTexture(gl);
    scene.environment = tex;
    scene.environmentIntensity = 1;
    return () => {
      scene.environment = null;
      tex.dispose();
    };
  }, [gl, scene]);
  return null;
}
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import CameraRig from "./CameraRig";
import ParticleWave from "./ParticleWave";
import CursorGlow3D from "./CursorGlow3D";
import WorkPanels from "./WorkPanels";
import ExperienceTimeline from "./ExperienceTimeline";
import SkillsOrbit from "./SkillsOrbit";
import AboutCalm from "./AboutCalm";
import ContactPortal from "./ContactPortal";
import BloomFlash from "./BloomFlash";

/**
 * Full journey scene: hero -> work -> experience -> skills -> about -> contact.
 * The 3D world is always the dark charcoal night scene (the HTML overlay is
 * scoped to dark tokens inside the journey track), so it stays readable in
 * both site themes. Everything is unlit (basic/shader materials): glow comes
 * from additive sprites, vertex colours and the bloom pass.
 */
export default function JourneyScene() {
  return (
    <>
      <color attach="background" args={["#0a0c0f"]} />
      <fog attach="fog" args={["#080b0e", 12, 52]} />

      <Env />
      <CameraRig />
      <CursorGlow3D />
      <ParticleWave />
      <WorkPanels />
      <ExperienceTimeline />
      <SkillsOrbit />
      <AboutCalm />
      <ContactPortal />
      <BloomFlash />

      <Suspense fallback={null}>
        <EffectComposer multisampling={4}>
          <Bloom intensity={0.85} luminanceThreshold={0.42} luminanceSmoothing={0.6} mipmapBlur />
        </EffectComposer>
      </Suspense>
    </>
  );
}