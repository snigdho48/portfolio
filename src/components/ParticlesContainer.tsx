import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ParticlesContainer() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth  || window.innerWidth;
    const h = el.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(1); // keep lightweight
    // Never let the canvas eat pointer/wheel events
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.touchAction   = "none";
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 5;

    // ── Particles ──────────────────────────────────────────
    const COUNT = 80;
    const posArr = new Float32Array(COUNT * 3);
    const velArr: { vx: number; vy: number }[] = [];

    for (let i = 0; i < COUNT; i++) {
      posArr[i * 3]     = (Math.random() - 0.5) * 10;
      posArr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      posArr[i * 3 + 2] = (Math.random() - 0.5) * 2;
      velArr.push({
        vx: (Math.random() - 0.5) * 0.008,
        vy: (Math.random() - 0.5) * 0.008,
      });
    }

    const ptGeo = new THREE.BufferGeometry();
    const ptAttr = new THREE.BufferAttribute(posArr.slice(), 3);
    ptGeo.setAttribute("position", ptAttr);

    const ptMat = new THREE.PointsMaterial({
      color: "#e68e2e",
      size: 0.06,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(ptGeo, ptMat);
    scene.add(points);

    // ── Connecting lines ────────────────────────────────────
    const MAX_LINE_PAIRS = COUNT * 5;
    const linePos = new Float32Array(MAX_LINE_PAIRS * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    const lineAttr = new THREE.BufferAttribute(linePos, 3);
    lineAttr.setUsage(THREE.DynamicDrawUsage);
    lineGeo.setAttribute("position", lineAttr);
    lineGeo.setDrawRange(0, 0);

    const lineMat = new THREE.LineBasicMaterial({
      color: "#f5d393",
      transparent: true,
      opacity: 0.25,
    });
    const lineSegs = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineSegs);

    // ── Mouse repulse ───────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const handleMove = (e: MouseEvent) => {
      mouseX =  (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMove);

    // working copy of positions
    const pos = ptAttr.array as Float32Array;

    let animId: number;
    const MAX_DIST = 2.0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // update particle positions
      for (let i = 0; i < COUNT; i++) {
        pos[i * 3]     += velArr[i].vx;
        pos[i * 3 + 1] += velArr[i].vy;
        if (Math.abs(pos[i * 3])     > 5) velArr[i].vx *= -1;
        if (Math.abs(pos[i * 3 + 1]) > 4) velArr[i].vy *= -1;
      }
      ptAttr.needsUpdate = true;

      // rebuild line segments
      let lIdx = 0;
      for (let i = 0; i < COUNT && lIdx < MAX_LINE_PAIRS - 1; i++) {
        for (let j = i + 1; j < COUNT && lIdx < MAX_LINE_PAIRS - 1; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < MAX_DIST * MAX_DIST) {
            linePos[lIdx * 6]     = pos[i * 3];
            linePos[lIdx * 6 + 1] = pos[i * 3 + 1];
            linePos[lIdx * 6 + 2] = pos[i * 3 + 2];
            linePos[lIdx * 6 + 3] = pos[j * 3];
            linePos[lIdx * 6 + 4] = pos[j * 3 + 1];
            linePos[lIdx * 6 + 5] = pos[j * 3 + 2];
            lIdx++;
          }
        }
      }
      lineAttr.needsUpdate = true;
      lineGeo.setDrawRange(0, lIdx * 2);

      // camera follows mouse gently
      camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.04;
      camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const nw = el.clientWidth  || window.innerWidth;
      const nh = el.clientHeight || window.innerHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full translate-z-0 pointer-events-none"
      aria-hidden
    />
  );
}
