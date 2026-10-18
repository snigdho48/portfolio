import { getSoftShadowTex } from "./softShadow";
import { isLowPowerDevice } from "@/utils/heroCapabilities";
import { useEffect, useMemo, useRef, useState } from "react";
import { fx } from "./scrollFx";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useJourneyProgress } from "./JourneyProgressContext";
import { panelPose, type PanelPose, type WorkPanelDatum } from "./workPath";
import { goToWorkIndex } from "./workScroll";
import { roundedBorderGeometry, roundedRectGeometry } from "./shapes";
import { getRadialGlow } from "./glow";
import { getPanelVignette } from "./panelFx";
import { TEAL, CYAN } from "./layout";
import { hwFan, weFlip } from "./transitions";

const RIM_FRONT = new THREE.Color("#c9fff6");
const RIM_BACK = new THREE.Color(TEAL);

const CW = 1280;
const CH = 800;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Tasteful dashboard-skeleton texture carrying the [PLACEHOLDER] label. */
function makePlaceholderTexture(title: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, CW, CH);
  bg.addColorStop(0, "#0d141a");
  bg.addColorStop(1, "#081015");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);

  // sidebar
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(0, 0, 210, CH);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i === 1 ? "rgba(31,227,194,0.28)" : "rgba(255,255,255,0.07)";
    rr(ctx, 26, 130 + i * 62, 158, 34, 10);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(31,227,194,0.7)";
  rr(ctx, 28, 44, 44, 44, 12);
  ctx.fill();

  // top bar
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  rr(ctx, 250, 36, 520, 46, 14);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.arc(CW - 70, 59, 22, 0, Math.PI * 2);
  ctx.fill();

  // stat cards
  for (let i = 0; i < 3; i++) {
    const x = 250 + i * 330;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    rr(ctx, x, 120, 300, 130, 18);
    ctx.fill();
    ctx.strokeStyle = "rgba(31,227,194,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    rr(ctx, x + 24, 146, 90, 12, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(31,227,194,0.75)";
    rr(ctx, x + 24, 184, 140 + i * 18, 26, 8);
    ctx.fill();
  }

  // chart
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  rr(ctx, 250, 290, 610, 330, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(31,227,194,0.9)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const x = 280 + (i / 40) * 550;
    const y = 520 - 120 * Math.sin(i * 0.22 + 1) - i * 2.6 - 30 * Math.sin(i * 0.7);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(34,211,238,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const x = 280 + (i / 40) * 550;
    const y = 560 - 70 * Math.sin(i * 0.3) - i * 1.4;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // side list
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  rr(ctx, 890, 290, 340, 330, 20);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    rr(ctx, 916, 320 + i * 58, 220 - (i % 3) * 30, 14, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(31,227,194,0.55)";
    rr(ctx, 1160, 318 + i * 58, 40, 18, 9);
    ctx.fill();
  }

  // label + title
  ctx.fillStyle = "#f5c84c";
  rr(ctx, 250, 664, 300, 56, 14);
  ctx.fill();
  ctx.fillStyle = "#1a1400";
  ctx.font = "bold 34px 'IBM Plex Sans', Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("[PLACEHOLDER]", 272, 693);
  ctx.fillStyle = "#f3f6f8";
  ctx.font = "bold 46px Syne, 'IBM Plex Sans', Arial, sans-serif";
  ctx.fillText(title, 580, 693, 640);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Compose a screenshot into a panel-shaped canvas, always showing the WHOLE image:
 * - images that already carry a device frame (e.g. Play Store phone shots) are shown as-is, no extra frame;
 * - desktop captures with a panel-like aspect fill the screen (tiny crop at most);
 * - everything else is contain-fit with letterboxing on a blurred, darkened backdrop.
 */
function makeShotTexture(img: HTMLImageElement, aspect: number, framed = false): THREE.CanvasTexture {
  const W = 1280;
  const H = Math.round(W / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const ia = iw / ih;

  if (ia >= 0.8) {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0c141a");
    bg.addColorStop(1, "#070b0f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  const phone = ia < 0.8;
  // Round 15: never cover-crop - every desktop capture is contain-fitted with the same padding
  const near = false as boolean;

  if (!near && !phone) {
    // blurred, darkened copy of the capture as a glass backdrop
    const sc = Math.max(W / iw, H / ih) * 1.25;
    ctx.save();
    ctx.filter = `blur(26px) brightness(${phone ? 0.14 : 0.42}) saturate(1.15)`;
    ctx.drawImage(img, (W - iw * sc) / 2, (H - ih * sc) / 2, iw * sc, ih * sc);
    ctx.restore();
    ctx.fillStyle = "rgba(6,10,13,0.38)";
    ctx.fillRect(0, 0, W, H);
  }

  if (phone && framed) {
    // already a device frame / marketing mock-up: fit whole, no extra bezel
    const sc = Math.min((W * 0.96) / iw, (H * 0.96) / ih);
    const dw = iw * sc;
    const dh = ih * sc;
    const x = (W - dw) / 2;
    const y = (H - dh) / 2;
    ctx.save();
    rr(ctx, x, y, dw, dh, Math.min(dw, dh) * 0.04);
    ctx.clip();
    ctx.drawImage(img, x, y, dw, dh);
    ctx.restore();
  } else if (phone) {
    const ph = H * 0.96;
    const bz = ph * 0.02;
    const sh = ph - bz * 2;
    const sw = sh * ia;
    const pw = sw + bz * 2;
    const x = (W - pw) / 2;
    const y = (H - ph) / 2;
    const r = ph * 0.075;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#0a0e11";
    rr(ctx, x, y, pw, ph, r);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#1a2227";
    rr(ctx, x + pw - 1, y + ph * 0.24, 4, ph * 0.09, 2);
    ctx.fill();
    rr(ctx, x + pw - 1, y + ph * 0.36, 4, ph * 0.15, 2);
    ctx.fill();
    ctx.save();
    rr(ctx, x + bz, y + bz, sw, sh, r - bz);
    ctx.clip();
    ctx.drawImage(img, x + bz, y + bz, sw, sh);
    const gl = ctx.createLinearGradient(x, y, x + pw, y + ph * 0.6);
    gl.addColorStop(0, "rgba(255,255,255,0.10)");
    gl.addColorStop(0.35, "rgba(255,255,255,0)");
    ctx.fillStyle = gl;
    ctx.fillRect(x, y, pw, ph);
    ctx.restore();
    ctx.fillStyle = "#020304";
    ctx.beginPath();
    ctx.arc(x + pw / 2, y + bz + ph * 0.026, ph * 0.0125, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(201,255,246,0.45)";
    ctx.lineWidth = 2;
    rr(ctx, x, y, pw, ph, r);
    ctx.stroke();
  } else if (near) {    const sc = Math.max(W / iw, H / ih);
    ctx.drawImage(img, (W - iw * sc) / 2, (H - ih * sc) / 2, iw * sc, ih * sc);
  } else {
    const m = 0.03;
    const sc = Math.min((W * (1 - 2 * m)) / iw, (H * (1 - 2 * m)) / ih);
    const dw = iw * sc;
    const dh = ih * sc;
    const x = (W - dw) / 2;
    const y = (H - dh) / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#05080b";
    rr(ctx, x, y, dw, dh, 14);
    ctx.fill();
    ctx.restore();
    ctx.save();
    rr(ctx, x, y, dw, dh, 14);
    ctx.clip();
    ctx.drawImage(img, x, y, dw, dh);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.userData.phone = phone;
  return tex;
}
/** CSS-style "cover" fit, anchored to the top of the image. */
function coverFit(tex: THREE.Texture, aspect: number) {
  const img = tex.image as { width: number; height: number } | undefined;
  if (!img?.width) return;
  const ia = img.width / img.height;
  tex.repeat.set(1, 1);
  tex.offset.set(0, 0);
  if (ia > aspect) {
    tex.repeat.x = aspect / ia;
    tex.offset.x = (1 - tex.repeat.x) / 2;
  } else {
    tex.repeat.y = ia / aspect;
    tex.offset.y = 1 - tex.repeat.y;
  }
}

export default function WorkPanel({ data }: { data: WorkPanelDatum }) {
  const group = useRef<THREE.Group>(null);
  const hoverRef = useRef(false);
  const hoverMix = useRef(0);
  const lite = isLowPowerDevice();
  const altTex = useRef<THREE.Texture[]>([]);
  const altLoading = useRef(false);
  const cycleT = useRef(0);
  const cycleIdx = useRef(0);
  const screenShader = useRef<THREE.WebGLProgramParametersWithUniforms | null>(null);
  const dofOn = useMemo(() => !isLowPowerDevice(), []);
  const pose = useRef<PanelPose>({
    x: 0, y: 0, z: 0, rotY: 0, bright: 1, fade: 1, front: 0, scale: 1,
  });
  const mats = useRef<Record<string, THREE.Material | null>>({});
  const { startFlyTo, flyActiveRef, workIndexRef, pointerRef, progressRef } = useJourneyProgress();
  const { width: w, height: h, index } = data;

  const geoms = useMemo(
    () => ({
      screen: roundedRectGeometry(w, h, 0.16),
      back: roundedRectGeometry(w + 0.1, h + 0.1, 0.19),
      rim: roundedBorderGeometry(w + 0.1, h + 0.1, 0.2, 0.012),
      halo: roundedBorderGeometry(w + 0.1, h + 0.1, 0.2, 0.04),
      bezel: roundedBorderGeometry(w + 0.1, h + 0.1, 0.2, 0.05),
    }),
    [w, h],
  );
  useEffect(
    () => () => Object.values(geoms).forEach((g) => g.dispose()),
    [geoms],
  );

  const [map, setMap] = useState<THREE.Texture | null>(null);
  const phone = !!map?.userData.phone;
  const phoneRef = useRef(false);
  useEffect(() => {
    phoneRef.current = phone;
  }, [phone]);
  useEffect(() => {
    let cancelled = false;
    let owned: THREE.Texture | null = null;
    if (data.isPlaceholder) {
      owned = makePlaceholderTexture(data.title);
      coverFit(owned, w / h);
       
      setMap(owned);
    } else {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => {
        if (cancelled) return;
        const tex = makeShotTexture(im, w / h, data.coverFramed);
        owned = tex;
        setMap(tex);
      };
      im.onerror = () => {
        if (cancelled) return;
        owned = makePlaceholderTexture(data.title);
        coverFit(owned, w / h);
        setMap(owned);
      };
      im.src = data.coverSrc;
    }
    return () => {
      cancelled = true;
      owned?.dispose();
    };
  }, [data.coverSrc, data.coverFramed, data.isPlaceholder, data.title, w, h]);

  useEffect(() => {
    const list = altTex.current;
    return () => {
      list.forEach((t) => t.dispose());
      list.length = 0;
    };
  }, []);
  /** Cheap depth-of-field: bias the mip level of the screenshot by how far back the panel is queued. */
  const dofCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uBias = { value: 0 };
    shader.fragmentShader = "uniform float uBias;\n" + shader.fragmentShader.replace("#include <map_fragment>", "#ifdef USE_MAP\n vec4 sampledDiffuseColor = texture2D( map, vMapUv, uBias );\n diffuseColor *= sampledDiffuseColor;\n#endif");
    screenShader.current = shader;
  };

  const glow = getRadialGlow();
  const vig = getPanelVignette();

  useFrame((_, delta) => {
    const g = group.current;
    if (!g || !g.parent?.visible) return;
    // Hero -> Work: panels arrive ALONG the light path (queued far back on it, sliding forward into place)
    const flying = flyActiveRef.current;
    const fan = flying ? 1 : hwFan(progressRef.current);
    const o = panelPose(index - workIndexRef.current + (1 - fan) * 3.2, pose.current);
    if (o.fade <= 0.002) {
      if (g.visible) g.visible = false;
      return;
    }
    if (!g.visible) g.visible = true;

    // Panels always draw ON TOP of every other Work light/particle/glow (those render at order <= 4): all panel layers
    // ignore depth and are ordered by renderOrder instead (nearer panel = later), so nothing washes out the images.
    const base = 100 + (40 + o.z) * 2; // o.z = -depth: nearer panel => larger order
    for (let j = 0; j < g.children.length; j++) {
      const c = g.children[j] as THREE.Mesh;
      c.renderOrder = base + j * 0.1;
      const mm = c.material as THREE.Material | undefined;
      if (mm && mm.depthTest) {
        mm.depthTest = false;
        mm.needsUpdate = true;
      }
    }

    hoverMix.current += ((hoverRef.current && o.front > 0.6 ? 1 : 0) - hoverMix.current) * Math.min(1, delta * 8);
    // Hover: short live preview cycling through the project's other screenshots
    const hot = hoverMix.current > 0.5;
    if (hot && data.altSrcs.length && !altLoading.current) {
      altLoading.current = true;
      data.altSrcs.forEach((src) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => altTex.current.push(makeShotTexture(im, w / h, data.coverFramed));
        im.src = src;
      });
    }
    const scr = mats.current.screen as THREE.MeshBasicMaterial | null;
    if (scr && map) {
      const list = altTex.current;
      if (hot && list.length) {
        cycleT.current += delta;
        if (cycleT.current > 1.1) {
          cycleT.current = 0;
          cycleIdx.current = (cycleIdx.current + 1) % (list.length + 1);
        }
      } else if (!hot) {
        cycleIdx.current = 0;
        cycleT.current = 0;
      }
      const want = cycleIdx.current === 0 ? map : (list[cycleIdx.current - 1] ?? map);
      if (scr.map !== want) {
        scr.map = want;
        scr.needsUpdate = true;
      }
    }
    // Single-screenshot projects: hover gives a slow zoom + pan "live preview" of the same capture
    const cur = scr?.map;
    if (cur && !data.altSrcs.length && !phoneRef.current) {
       
      const base = (cur.userData.panBase ??= { rx: cur.repeat.x, ry: cur.repeat.y, ox: cur.offset.x, oy: cur.offset.y });
      const k = hoverMix.current;
      const z = 1 + 0.2 * k;
      const sx = base.rx - base.rx / z;
      const sy = base.ry - base.ry / z;
      const px = 0.5 + 0.5 * Math.sin(fx.t * 0.8);
      const py = 0.5 + 0.5 * Math.sin(fx.t * 0.55 + 1.3);
      cur.repeat.set(base.rx / z, base.ry / z);
      cur.offset.set(base.ox + sx * px, base.oy + sy * py);
    }
    const sh = screenShader.current;
    if (sh) sh.uniforms.uBias.value = dofOn ? (1 - Math.min(1, o.front)) * 2.4 : 0;
    const t = fx.t;
    const bob = Math.sin(t * 0.8 + index * 1.7) * 0.07 * (0.4 + 0.6 * o.front);
    const px = pointerRef.current.x;
    const py = pointerRef.current.y;
    // Hero -> Work: panels fly in from depth in a fan; Work -> Experience: they flip edge-on and vanish (shards in TransitionFx)
    const flip = flying ? 0 : weFlip(progressRef.current);
    const trMul = (1 - Math.min(1, Math.max(0, (flip - 0.72) / 0.28))) * (0.12 + 0.88 * Math.min(1, fan * 2));
    g.position.set(o.x, o.y + bob, o.z);
    g.rotation.set(
      -py * 0.07 * o.front * (1 + hoverMix.current * 1.1) + Math.sin(t * 0.5 + index) * 0.012,
      o.rotY + px * 0.1 * o.front * (1 + hoverMix.current * 1.1) + flip * 1.45 * (o.x >= 0 ? 1 : -1),
      Math.sin(t * 0.6 + index * 2.1) * 0.012,
    );
    g.scale.setScalar(o.scale * (1 + hoverMix.current * 0.035) * (1 - 0.25 * flip));

    const m = mats.current;
    const fd = o.fade * trMul;
    const b = o.bright;
    const fr = o.front;
    const set = (k: string, mul: number) => {
      const mm = m[k];
      if (mm) mm.userData.mul = mul;
    };
    set("glow", fd * (0.4 + 0.4 * fr) * (0.5 + 0.5 * b));
    const nf = phoneRef.current ? 0 : 1; // phone captures: no landscape panel frame
    set("back", fd * nf);
    set("screen", fd);
    set("vig", fd * nf);
    set("rim", fd * (0.45 * b + 0.55 * fr) * nf);
    set("halo", fd * (0.25 + 0.5 * fr) * b * nf);
    set("bezel", fd * (0.45 + 0.55 * b) * nf);
    const sm = m.screen as THREE.MeshBasicMaterial | null;
    if (sm) sm.color.setScalar(phoneRef.current ? 0.62 + 0.3 * b : 0.2 + 0.34 * b);
    const rm = m.rim as THREE.MeshBasicMaterial | null;
    if (rm) rm.color.copy(RIM_BACK).lerp(RIM_FRONT, fr);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const g = group.current;
    if (!g?.parent?.visible || !g.visible) return;
    e.stopPropagation();
    if (flyActiveRef.current) return;
    if (pose.current.front > 0.6) {
      startFlyTo({ slug: data.slug, position: data.flyPosition, lookAt: data.lookAt });
    } else {
      goToWorkIndex(index);
    }
  };

  const reg = (k: string) => (el: THREE.Material | null) => {
    mats.current[k] = el;
  };

  return (
    <group
      ref={group}
      position={data.position}
      rotation={[0, data.rotY, 0]}
      onClick={onClick}
      onPointerOver={(e) => {
        if (!group.current?.parent?.visible) return;
        e.stopPropagation();
        hoverRef.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hoverRef.current = false;
        document.body.style.cursor = "";
      }}
    >
      {/* soft teal glow behind the glass */}
      <sprite position={[0, 0, -0.2]} scale={[w * 1.7, h * 1.9, 1]}>
        <spriteMaterial ref={reg("glow")} map={glow} color={CYAN} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      {lite ? null : (
        <sprite position={[0, -h * 0.66, -0.12]} scale={[w * 1.15, h * 0.26, 1]}>
          <spriteMaterial map={getSoftShadowTex()} transparent opacity={0.34} depthWrite={false} fog={false} />
        </sprite>
      )}
      <mesh geometry={geoms.back} position={[0, 0, -0.02]}>
        <meshBasicMaterial ref={reg("back")} color="#05080b" transparent opacity={0.96} />
      </mesh>
      <mesh geometry={geoms.screen}>
        <meshBasicMaterial ref={reg("screen")} map={map} color="#ffffff" toneMapped={false} transparent depthWrite={false} alphaTest={phone ? 0.01 : 0} onBeforeCompile={dofCompile} />
      </mesh>
      {/* brushed-metal bezel + glass sheet (env reflections) */}
      <mesh geometry={geoms.bezel} position={[0, 0, 0.003]}>
        <meshPhysicalMaterial ref={reg("bezel")} color="#0c1418" metalness={0.8} roughness={0.4} envMapIntensity={0.6} transparent opacity={1} />
      </mesh>
      {/* inner vignette + top-edge glass highlight (no flat veil) */}
      <mesh geometry={geoms.screen} position={[0, 0, 0.008]}>
        <meshBasicMaterial ref={reg("vig")} map={vig} transparent depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
      {lite ? null : (
        <>
          {/* env-reflective glass sheet over the screen */}
          <mesh geometry={geoms.screen} position={[0, 0, 0.011]}>
            <meshPhysicalMaterial color="#ffffff" roughness={0.05} clearcoat={1} clearcoatRoughness={0.04} envMapIntensity={1.5} transparent opacity={0.05} depthWrite={false} />
          </mesh>
          {/* subtle chromatic edge: two faint offset rims */}
          <mesh geometry={geoms.rim} position={[0.012, 0, 0.018]}>
            <meshBasicMaterial color="#ff4f9a" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
          </mesh>
          <mesh geometry={geoms.rim} position={[-0.012, 0, 0.018]}>
            <meshBasicMaterial color="#3fd4ff" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
          </mesh>
        </>
      )}
{/* rim light + halo */}
      <mesh geometry={geoms.rim} position={[0, 0, 0.02]}>
        <meshBasicMaterial ref={reg("rim")} color={TEAL} transparent opacity={1} toneMapped={false} fog={false} />
      </mesh>
      <mesh geometry={geoms.halo} position={[0, 0, 0.002]}>
        <meshBasicMaterial ref={reg("halo")} color={TEAL} transparent opacity={0.09} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}
