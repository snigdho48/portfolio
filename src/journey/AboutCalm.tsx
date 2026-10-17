import * as THREE from "three";
import StationGroup from "./StationGroup";
import SoftPoints from "./SoftPoints";
import { getRadialGlow } from "./glow";
import { TEAL_DEEP, CYAN } from "./layout";
import WireAccent from "./WireAccent";

/** About: calm, slow, faint particle field with a soft atmospheric glow. */
export default function AboutCalm() {
  const glow = getRadialGlow();
  return (
    <StationGroup id="about">
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