import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useJourneyProgress } from "./JourneyProgressContext";
import { warpAt, WARP_HOP } from "./warp";
import { STATION_Z, REF_ASPECT, SUN_NDC, SUN_D, halfW, halfH } from "./layout";

const sunV = new THREE.Vector3();

const VERT = /* glsl */ `
varying vec2 vP;
void main(){
  vP = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** Iris: a white-teal disc that grows from the centre until it fills the frame, then contracts onto the sun. */
const FRAG = /* glsl */ `
uniform float uF;
uniform float uAspect;
uniform float uTime;
uniform vec2 uC;
varying vec2 vP;
void main(){
  vec2 p = (vP - uC) * vec2(uAspect, 1.0);
  float r = length(p);
  float R = uF * 2.6;
  float m = 1.0 - smoothstep(R - 0.75, R, r);
  float rim = clamp(r / max(R, 0.001), 0.0, 1.0);
  float rays = 0.5 + 0.5 * sin(atan(p.y, p.x) * 18.0 + uTime * 1.2);
  vec3 col = mix(vec3(1.0), vec3(0.42, 1.0, 0.9), pow(rim, 1.4) * 0.9);
  col += vec3(0.2, 0.5, 0.45) * rays * (1.0 - uF) * 0.5 * (1.0 - rim);
  gl_FragColor = vec4(col, m * min(1.0, uF * 1.7));
}
`;

/**
 * Full-screen bloom flash for the Experience -> Skills warp. Lives in the canvas (before the
 * Bloom pass, so it blooms too) and only draws while the warp is under way.
 */
export default function BloomFlash() {
  const { progressRef } = useJourneyProgress();
  const size = useThree((s) => s.size);
  const ref = useRef<THREE.Mesh>(null);
  const geom = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: { uF: { value: 0 }, uAspect: { value: 1.6 }, uTime: { value: 0 }, uC: { value: new THREE.Vector2() } },
      }),
    [],
  );
  useEffect(() => () => geom.dispose(), [geom]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const f = warpAt(progressRef.current).flash;
    const on = f > 0.002;
    if (m.visible !== on) m.visible = on;
    if (!on) return;
    mat.uniforms.uF.value = f;
    mat.uniforms.uAspect.value = size.width / size.height;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    // before the hop the light is the ball (screen centre); after it the iris closes onto the sun
    const pn = progressRef.current;
    if (pn >= WARP_HOP) {
      const kS = Math.min(1, size.width / size.height / REF_ASPECT);
      sunV.set(SUN_NDC[0] * halfW(SUN_D) * kS, SUN_NDC[1] * halfH(SUN_D) * kS, STATION_Z.skills - SUN_D * kS).project(state.camera);
      mat.uniforms.uC.value.set(sunV.x, sunV.y);
    } else mat.uniforms.uC.value.set(0, 0);
  });
  return <mesh ref={ref} geometry={geom} material={mat} renderOrder={9999} frustumCulled={false} visible={false} />;
}