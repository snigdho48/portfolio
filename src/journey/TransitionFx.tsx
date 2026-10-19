import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useJourneyProgress } from "./JourneyProgressContext";
import { STATION_Z, SUN_NDC, SUN_D, halfW, halfH } from "./layout";
import { stationScale, stationShift } from "./portrait";
import { hwBell, weFlip, weShard, weIris, saCollapse, saDawn, acShutter } from "./transitions";

const VERT = /* glsl */ `
varying vec2 vP;
void main(){
  vP = position.xy;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/**
 * One full-screen overlay (drawn before Bloom) that carries the screen-space part of the four
 * section-entry transitions. Output is premultiplied: rgb adds light, alpha covers the scene, so a
 * pixel can both glow and darken. Each effect is a pure function of the journey progress.
 */
const FRAG = /* glsl */ `
uniform float uAsp;
uniform float uTime;
uniform float uHW;
uniform float uFlip;
uniform float uShard;
uniform float uIris;
uniform float uSA;
uniform float uDawn;
uniform float uAC;
uniform vec2 uBall;
uniform vec2 uSun;
varying vec2 vP;
float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
void main(){
  vec2 q = vec2(vP.x * uAsp, vP.y);
  vec3 glow = vec3(0.0);
  float cov = 0.0;
  vec3 covCol = vec3(0.0015, 0.005, 0.007);

  // Hero -> Work: a brief horizontal streak of light with faint speed lines
  if (uHW > 0.002) {
    float core = exp(-vP.y * vP.y * 1400.0);
    float soft = exp(-vP.y * vP.y * 22.0) * 0.1;
    float xf = 1.0 - smoothstep(0.4, 1.15, abs(vP.x)) * 0.8;
    float ang = atan(vP.y, vP.x * uAsp);
    float r = length(q);
    float sl = pow(h1(floor(ang * 70.0)), 8.0) * smoothstep(0.3, 1.3, r) * 0.08;
    glow += vec3(0.45, 0.95, 0.88) * (core * 0.55 * xf + soft + sl) * uHW;
  }

  // Work -> Experience: shards drawn into the light ball + iris wipe around it
  if (uShard > 0.002 && uShard < 0.999) {
    for (int i = 0; i < 44; i++) {
      float fi = float(i);
      vec2 o = vec2((h1(fi * 3.1) - 0.5) * 0.9, (h1(fi * 5.7) - 0.5) * 0.8) + vec2(0.0, 0.05);
      float e = clamp((uShard * 1.45 - h1(fi * 7.3) * 0.45) / 0.55, 0.0, 1.0);
      e = e * e * (3.0 - 2.0 * e);
      vec2 pos = mix(o, uBall, e);
      pos += vec2(sin(fi * 2.0 + e * 3.0), cos(fi * 1.3 + e * 3.0)) * 0.05 * (1.0 - e) * e * 4.0;
      float sz = (0.006 + h1(fi * 9.1) * 0.016) * (1.0 - 0.6 * e);
      vec2 d = (vP - pos) * vec2(uAsp, 1.0);
      float ca = cos(fi + uTime * 2.0);
      float sa = sin(fi + uTime * 2.0);
      d = vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
      float m = 1.0 - smoothstep(sz * 0.7, sz, abs(d.x) + abs(d.y) * 1.6);
      float live = smoothstep(0.0, 0.08, uShard) * (1.0 - smoothstep(0.82, 1.0, e) * 0.9);
      glow += mix(vec3(0.5, 1.0, 0.92), vec3(0.15, 0.7, 0.66), h1(fi * 2.3)) * m * live * 0.9;
    }
    glow += vec3(0.35, 0.95, 0.85) * exp(-length((vP - uBall) * vec2(uAsp, 1.0)) * 9.0) * uShard * 0.5;
  }
  if (uIris < 0.999) {
    vec2 pb = (vP - uBall) * vec2(uAsp, 1.0);
    float rb = length(pb);
    float R = uIris * 3.3;
    cov = max(cov, smoothstep(R - 0.025, R + 0.02, rb));
    float edge = exp(-abs(rb - R) * 38.0) * (1.0 - smoothstep(0.55, 1.0, uIris));
    glow += vec3(0.4, 1.0, 0.9) * edge * 0.9;
    glow += vec3(0.5, 1.0, 0.92) * exp(-rb * 12.0) * (1.0 - smoothstep(0.1, 0.5, uIris)) * 0.6;
  }

  // Skills -> About: the planets become one point of light; then a calm dawn gradient fades away
  if (uSA > 0.002 || uDawn > 0.002) {
    vec2 c0 = mix(vec2(0.0, -0.32), uSun, uDawn);
    vec2 pc = (vP - uSun) * vec2(uAsp, 1.0);
    float rc = length(pc);
    float pt = exp(-rc * rc * 150.0) * uSA;
    glow += mix(vec3(0.3, 0.9, 0.85), vec3(1.0, 0.94, 0.8), pt) * (pt * 0.9 + exp(-rc * 5.0) * 0.5 * uSA * (1.0 - uDawn));
    if (uDawn > 0.002) {
      float y = vP.y * 0.5 + 0.5;
      vec3 sky = mix(vec3(0.003, 0.012, 0.016), vec3(0.008, 0.024, 0.03), y);
      vec2 pd = (vP - c0) * vec2(uAsp * 0.55, 1.0);
      float hz = exp(-dot(pd, pd) * 1.6);
      sky += vec3(0.01, 0.1, 0.1) * hz + vec3(0.1, 0.09, 0.04) * exp(-dot(pd, pd) * 6.0) * 0.35;
      covCol = mix(covCol, sky, 1.0);
      cov = max(cov, uDawn * 0.97);
    }
  }

  // About -> Contact: a shutter of vertical blades with a sweep of light across their edges
  if (uAC > 0.002) {
    float N = 7.0;
    float x = vP.x * 0.5 + 0.5;
    float f = fract(x * N);
    float dd = abs(f - 0.5) * 2.0;
    float bl = 1.0 - smoothstep(uAC - 0.03, uAC + 0.03, dd * 1.0 + 0.0);
    bl *= step(0.001, uAC);
    cov = max(cov, mix(bl, 1.0, smoothstep(0.92, 1.0, uAC)));
    float edgeD = abs(dd - uAC);
    glow += vec3(0.4, 1.0, 0.9) * exp(-edgeD * 30.0) * (1.0 - smoothstep(0.85, 1.0, uAC)) * 0.5 * smoothstep(0.02, 0.2, uAC);
    float sw = vP.x - (uAC * 2.4 - 1.2);
    glow += vec3(0.35, 0.9, 0.85) * exp(-sw * sw * 60.0) * uAC * (1.0 - uAC) * 1.6;
  }

  gl_FragColor = vec4(glow + covCol * cov, cov);
}
`;

const sunV = new THREE.Vector3();
/** Where the light ball sits on screen when the Experience path starts (NDC). Calibrated from screenshots. */
// eslint-disable-next-line react-refresh/only-export-components -- shared constants/helpers live next to the component
export const EXP_BALL_NDC: [number, number] = [0.0, 0.36];

export default function TransitionFx() {
  const { progressRef } = useJourneyProgress();
  const size = useThree((s) => s.size);
  const ref = useRef<THREE.Mesh>(null);
  const geom = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const sunLast = useRef(new THREE.Vector2(SUN_NDC[0], SUN_NDC[1]));
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        uniforms: {
          uAsp: { value: 1.6 },
          uTime: { value: 0 },
          uHW: { value: 0 },
          uFlip: { value: 0 },
          uShard: { value: 0 },
          uIris: { value: 1 },
          uSA: { value: 0 },
          uDawn: { value: 0 },
          uAC: { value: 0 },
          uBall: { value: new THREE.Vector2(EXP_BALL_NDC[0], EXP_BALL_NDC[1]) },
          uSun: { value: new THREE.Vector2() },
        },
      }),
    [],
  );
  useEffect(() => () => geom.dispose(), [geom]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const p = progressRef.current;
    const u = mat.uniforms;
    const hw = hwBell(p);
    const fl = weFlip(p);
    const sh = weShard(p);
    const ir = weIris(p);
    const sa = saCollapse(p);
    const dn = saDawn(p);
    const ac = acShutter(p);
    const on = hw > 0.002 || (sh > 0.002 && p < 0.35) || ir < 0.999 || sa > 0.002 || dn > 0.002 || ac > 0.002;
    if (m.visible !== on) m.visible = on;
    if (!on) return;
    // eslint-disable-next-line react-hooks/immutability -- three.js objects are mutated per frame by design
    u.uAsp.value = size.width / size.height;
    u.uTime.value = state.clock.elapsedTime;
    u.uHW.value = hw;
    u.uFlip.value = fl;
    u.uShard.value = p < 0.35 ? sh : 0;
    u.uIris.value = ir;
    u.uSA.value = p > 0.7 ? sa * dn : sa;
    u.uDawn.value = dn;
    u.uAC.value = ac;
    if (p < 0.665 && sa > 0) {
      const kS = stationScale("skills", size.width / size.height);
        const shS = stationShift("skills", size.width / size.height);
      sunV.set(SUN_NDC[0] * halfW(SUN_D) * kS + shS[0], SUN_NDC[1] * halfH(SUN_D) * kS + shS[1], STATION_Z.skills - SUN_D * kS).project(state.camera);
      sunLast.current.set(sunV.x, sunV.y);
    }
    // follow the real sun while it is visible, then settle toward the calm lower-centre where the About dawn rises
    const k = Math.min(1, Math.max(0, (p - 0.665) / 0.035));
    const sk2 = k * k * (3 - 2 * k);
    u.uSun.value.set(sunLast.current.x * (1 - sk2), sunLast.current.y * (1 - sk2) + -0.3 * sk2);
  });
  return <mesh ref={ref} geometry={geom} material={mat} renderOrder={10000} frustumCulled={false} visible={false} />;
}
