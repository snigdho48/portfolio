import * as THREE from "three";
import StationGroup from "./StationGroup";
import SoftPoints from "./SoftPoints";
import { getRadialGlow } from "./glow";
import { TEAL_DEEP, CYAN } from "./layout";
import WireAccent from "./WireAccent";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { portraitAmount } from "./portrait";

/** Phone / portrait only: a clearer knot, glow and drifting dust that show through the translucent text cards. */
function PortraitBackdrop() {
  const g = useRef<THREE.Group>(null);
  const glow = getRadialGlow();
  useFrame(({ size }) => {
    if (g.current) g.current.visible = portraitAmount(size.width / size.height) > 0.35;
  });
  return (
    <group ref={g} visible={false}>
      <sprite position={[0, 0.5, -9]} scale={[16, 22, 1]}>
        <spriteMaterial map={glow} color={TEAL_DEEP} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <WireAccent kind="knot" position={[3.4, -1.2, -9]} radius={1.5} opacity={0.14} speed={0.1} glowScale={6} />
      <SoftPoints count={520} box={[11, 20, 7]} center={[0, 0.5, -8]} size={0.034} sizeVar={0.03} opacity={0.85} drift={0.45} depthFade={0.01} seed={67} colors={[CYAN, TEAL_DEEP]} />
    </group>
  );
}

/** About: calm, slow, faint particle field with a soft atmospheric glow. */
export default function AboutCalm() {
  const glow = getRadialGlow();
  return (
    <StationGroup id="about">
      <PortraitBackdrop />
      <sprite position={[3, -1, -16]} scale={[20, 12, 1]}>
        <spriteMaterial map={glow} color={TEAL_DEEP} transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <sprite position={[-5, 3, -20]} scale={[16, 10, 1]}>
        <spriteMaterial map={glow} color={CYAN} transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      <WireAccent kind="knot" position={[7.4, 3.3, -15]} radius={1.1} opacity={0.12} speed={0.06} glowScale={7} />
      <SoftPoints count={950} box={[26, 14, 16]} center={[0, 0, -12]} size={0.017} sizeVar={0.02} opacity={0.5} drift={0.35} depthFade={0.012} seed={61} colors={[CYAN, TEAL_DEEP]} />
      <SoftPoints count={12} box={[22, 11, 10]} center={[0, 0, -12]} size={0.5} sizeVar={0.6} opacity={0.07} drift={0.25} bokeh seed={63} depthFade={0.004} />
    </StationGroup>
  );
}