import { useEffect, useMemo } from "react";
import { fx } from "./scrollFx";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TAN_HALF, TEAL, CYAN } from "./layout";
import { mulberry32 } from "./rng";

const VERT = /* glsl */ `
attribute vec4 aRand;
uniform float uTime;
uniform float uFocal;
uniform float uSize;
uniform float uSizeVar;
uniform float uDrift;
uniform float uDepthFade;
uniform float uOpacity;
uniform float uFade;
varying float vA;
varying float vMix;
void main(){
  vec3 p = position;
  p.y += sin(uTime * uDrift * 0.6 + aRand.x * 6.2831) * 0.22;
  p.x += cos(uTime * uDrift * 0.5 + aRand.y * 6.2831) * 0.18;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(0.5, -mv.z);
  float s = (uSize + aRand.z * uSizeVar) * uFocal / dist;
  gl_PointSize = clamp(s, 1.4, 190.0);
  float tw = 0.55 + 0.45 * sin(uTime * (0.35 + aRand.w * 0.9) + aRand.x * 40.0);
  vA = uOpacity * uFade * tw * exp(-dist * uDepthFade) * (0.35 + 0.65 * aRand.w);
  vMix = aRand.y;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uBokeh;
varying float vA;
varying float vMix;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a;
  if (uBokeh > 0.5) {
    float disc = 0.28;
    float edge = smoothstep(0.62, 0.92, d) * (1.0 - smoothstep(0.9, 1.0, d));
    a = (disc + edge * 0.9) * (1.0 - smoothstep(0.82, 1.0, d));
  } else {
    a = (1.0 - smoothstep(0.25, 1.0, d)) * 0.85;
  }
  vec3 c = mix(uColorA, uColorB, vMix);
  gl_FragColor = vec4(c, a * vA);
}
`;

export type SoftPointsProps = {
  count: number;
  /** [w, h, d] box size */
  box: [number, number, number];
  center?: [number, number, number];
  /** World-unit diameter (dust ~0.02, bokeh ~0.6) */
  size?: number;
  sizeVar?: number;
  opacity?: number;
  drift?: number;
  depthFade?: number;
  bokeh?: boolean;
  colors?: [string, string];
  seed?: number;
  /** Custom position generator (overrides the box). */
  gen?: (r: () => number, i: number) => [number, number, number];
};

/**
 * GPU soft points: dust, bokeh discs. Drift/twinkle are computed in the
 * vertex shader, so nothing touches the CPU per frame except the clock.
 */
export default function SoftPoints({
  count,
  box,
  center = [0, 0, -12],
  size = 0.02,
  sizeVar = 0.02,
  opacity = 0.7,
  drift = 1,
  depthFade = 0.012,
  bokeh = false,
  colors = [TEAL, CYAN],
  seed = 7,
  gen,
}: SoftPointsProps) {
  const gl = useThree((s) => s.gl);
  const sizeState = useThree((s) => s.size);

  const geom = useMemo(() => {
    const r = mulberry32(seed + count);
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      if (gen) {
        const q = gen(r, i);
        pos[i * 3] = q[0];
        pos[i * 3 + 1] = q[1];
        pos[i * 3 + 2] = q[2];
      } else {
        pos[i * 3] = center[0] + (r() - 0.5) * box[0];
        pos[i * 3 + 1] = center[1] + (r() - 0.5) * box[1];
        pos[i * 3 + 2] = center[2] + (r() - 0.5) * box[2];
      }
      rnd[i * 4] = r();
      rnd[i * 4 + 1] = r();
      rnd[i * 4 + 2] = r();
      rnd[i * 4 + 3] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 4));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed, gen, box[0], box[1], box[2], center[0], center[1], center[2]]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uFocal: { value: 1000 },
          uSize: { value: size },
          uSizeVar: { value: sizeVar },
          uDrift: { value: drift },
          uDepthFade: { value: depthFade },
          uOpacity: { value: opacity },
          uFade: { value: 1 },
          uColorA: { value: new THREE.Color(colors[0]) },
          uColorB: { value: new THREE.Color(colors[1]) },
          uBokeh: { value: bokeh ? 1 : 0 },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size, sizeVar, drift, depthFade, opacity, bokeh, colors[0], colors[1]],
  );

  useEffect(() => () => geom.dispose(), [geom]);
  useEffect(() => () => mat.dispose(), [mat]);

  useFrame(() => {
    mat.uniforms.uTime.value = fx.t;
    mat.uniforms.uFocal.value =
      (sizeState.height * gl.getPixelRatio()) / (2 * TAN_HALF);
  });

  return <points geometry={geom} material={mat} frustumCulled={false} />;
}