import { useEffect, useMemo } from "react";
import { fx } from "./scrollFx";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useJourneyProgress } from "./JourneyProgressContext";
import { TEAL, CYAN } from "./layout";
import { mulberry32 } from "./rng";
import StationGroup from "./StationGroup";
import SoftPoints from "./SoftPoints";
import { useRef } from "react";

/** Offsets its children with the pointer for layered parallax. */
function Parallax({ k, children }: { k: number; children: import("react").ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const { pointerRef } = useJourneyProgress();
  useFrame(() => {
    const o = g.current;
    if (!o || !o.parent?.visible) return;
    o.position.x += (pointerRef.current.x * k - o.position.x) * 0.06;
    o.position.y += (pointerRef.current.y * k * 0.6 - o.position.y) * 0.06;
  });
  return <group ref={g}>{children}</group>;
}

const tmpV = new THREE.Vector2();
const ROWS = 46;
const COLS = 1500;

const VERT = /* glsl */ `
attribute vec4 aRand;
uniform float uTime;
uniform float uPx;
uniform float uFade;
uniform vec2 uPtr;
varying float vA;
varying float vMix;

float field(float x, float z, float t){
  float h = 0.0;
  h += sin(x * 0.21 + z * 0.16 + t * 0.28) * 0.85;
  h += sin(x * 0.09 - z * 0.22 - t * 0.18 + 1.7) * 0.9;
  h += sin(x * 0.47 + z * 0.31 + t * 0.4) * 0.16;
  return h;
}

void main(){
  float x = position.x + uPtr.x * 0.5;
  float z = position.z;
  float t = uTime;
  float h = field(x, z, t);
  // soft dunes; the flanks sweep up into dense clusters at the left/right edges
  float ax = abs(x);
  float lift = smoothstep(3.4, 11.0, ax);
  float y = -2.7 + h + lift * lift * 4.2 * (0.75 + 0.25 * sin(z * 0.3 + x * 0.12 + t * 0.2)) - z * 0.012;
  y += (aRand.y - 0.5) * 0.04;
  vec3 p = vec3(x + (aRand.z - 0.5) * 0.08, y + uPtr.y * 0.15, z);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(1.0, -mv.z);

  float big = step(0.972, aRand.w);
  float sz = (0.9 + aRand.w * 1.6 + big * 2.6) * uPx * clamp(9.0 / dist, 0.55, 1.5);
  gl_PointSize = clamp(sz, 1.0 * uPx, 4.4 * uPx);

  // flowing ridge lines: dense dots along contours of the terrain
  float s = 0.5 + 0.5 * sin(h * 2.3 + z * 0.62 + x * 0.05);
  float crest = pow(s, 2.6);
  float sideB = smoothstep(3.0, 8.5, ax);
  float low = 1.0 - smoothstep(-1.4, 2.6, y);
  float base = 0.12 + 0.75 * crest * (0.5 + 0.5 * low) + 0.8 * sideB;
  float keep = step(aRand.y * 0.95 + 0.03, base * 1.25);
  vec2 ndc = gl_Position.xy / gl_Position.w;
  // clean zone behind the headline block / upper middle
  float zone = (1.0 - smoothstep(0.34, 0.66, abs(ndc.x))) * (1.0 - smoothstep(0.34, 0.6, abs(ndc.y - 0.1)));
  float topClean = 1.0 - smoothstep(0.1, 0.6, ndc.y) * (1.0 - sideB);
  float twinkle = 0.6 + 0.4 * sin(uTime * (0.5 + aRand.w * 1.3) + aRand.w * 60.0);
  vA = 2.6 * uFade * keep * base * (1.0 - 0.85 * zone) * topClean * (0.5 + 0.9 * aRand.w) * twinkle * exp(-dist * 0.016);
  vMix = aRand.z;
}
`;
const FRAG = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vA;
varying float vMix;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a = 1.0 - smoothstep(0.3, 1.0, d);
  vec3 c = mix(uColorA, uColorB, vMix) * (1.0 + 0.6 * (1.0 - d));
  gl_FragColor = vec4(c, a * vA);
}
`;

function WaveField() {
  const gl = useThree((s) => s.gl);
  const { pointerRef } = useJourneyProgress();

  const geom = useMemo(() => {
    const r = mulberry32(11);
    const n = ROWS * COLS;
    const pos = new Float32Array(n * 3);
    const rnd = new Float32Array(n * 4);
    let k = 0;
    for (let j = 0; j < ROWS; j++) {
      const rowT = j / (ROWS - 1);
      // denser rows toward the camera
      const z = 4 - Math.pow(rowT, 1.4) * 34;
      for (let i = 0; i < COLS; i++) {
        const u = i / (COLS - 1);
        pos[k * 3] = (u - 0.5) * 44;
        pos[k * 3 + 1] = j;
        pos[k * 3 + 2] = z + (r() - 0.5) * (0.35 + 0.5 * rowT);
        rnd[k * 4] = r();
        rnd[k * 4 + 1] = r();
        rnd[k * 4 + 2] = r();
        rnd[k * 4 + 3] = r();
        k++;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 4));
    return g;
  }, []);

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
          uPx: { value: 1 },
          uFade: { value: 1 },
          uPtr: { value: new THREE.Vector2() },
          uColorA: { value: new THREE.Color(TEAL) },
          uColorB: { value: new THREE.Color(CYAN) },
        },
      }),
    [],
  );

  useEffect(() => () => geom.dispose(), [geom]);
  useEffect(() => () => mat.dispose(), [mat]);

  useFrame(() => {
    mat.uniforms.uTime.value = fx.t;
    mat.uniforms.uPx.value = gl.getPixelRatio();
    tmpV.set(pointerRef.current.x, pointerRef.current.y);
    (mat.uniforms.uPtr.value as THREE.Vector2).lerp(tmpV, 0.05);
  });

  return <points geometry={geom} material={mat} frustumCulled={false} />;
}

/** Dense glowing particle band rising up the left/right flank. */
function flank(side: number) {
  return (r: () => number) => {
    const u = Math.pow(r(), 0.8);
    const x = side * (6.2 + u * 5.2) + (r() - 0.5) * 1.4;
    const y = -1.4 + u * u * 5.6 + (r() - 0.5) * (0.5 + 1.1 * u);
    const z = -4.5 - r() * 7;
    return [x, y, z] as [number, number, number];
  };
}

/** Hero: flowing teal particle waves, dense low and at the sides, clean centre. */
export default function ParticleWave() {
  return (
    <StationGroup id="hero">
      <WaveField />
      <SoftPoints count={420} box={[1, 1, 1]} gen={flank(1)} size={0.03} sizeVar={0.03} opacity={0.9} depthFade={0.012} seed={71} drift={0.8} />
      <SoftPoints count={420} box={[1, 1, 1]} gen={flank(-1)} size={0.03} sizeVar={0.03} opacity={0.9} depthFade={0.012} seed={72} drift={0.8} />
      <Parallax k={0.9}>
        <SoftPoints count={140} box={[18, 7, 5]} center={[0, 2.2, 3]} size={0.05} sizeVar={0.04} opacity={0.5} depthFade={0.01} seed={9} drift={1.4} />
      </Parallax>
      <Parallax k={0.25}>
      <SoftPoints
        count={500}
        box={[26, 12, 18]}
        center={[0, 3, -4]}
        size={0.022}
        sizeVar={0.02}
        opacity={0.55}
        depthFade={0.02}
        seed={3}
      />
      </Parallax>
    </StationGroup>
  );
}