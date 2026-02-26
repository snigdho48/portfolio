import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Avatar() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Never let the canvas eat pointer/wheel events
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.touchAction   = "none";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xF13024, 1.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    const fillLight = new THREE.PointLight(0x6b21a8, 1.2, 20);
    fillLight.position.set(-5, -3, 3);
    scene.add(fillLight);

    // Main icosahedron (avatar body)
    const icoGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x131424,
      emissive: 0x1a1a3e,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: false,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    scene.add(ico);

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xF13024,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wire = new THREE.Mesh(icoGeo, wireMat);
    scene.add(wire);

    // Orbiting ring
    const ringGeo = new THREE.TorusGeometry(1.8, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xF13024, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    // Second ring
    const ring2 = ring.clone();
    ring2.rotation.x = Math.PI / 5;
    ring2.rotation.y = Math.PI / 4;
    ring2.material = new THREE.MeshBasicMaterial({ color: 0x6b21a8, transparent: true, opacity: 0.35 });
    scene.add(ring2);

    // Floating particles around avatar
    const ptCount = 60;
    const ptPositions = new Float32Array(ptCount * 3);
    for (let i = 0; i < ptCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 1.6 + Math.random() * 0.8;
      ptPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      ptPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      ptPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute("position", new THREE.BufferAttribute(ptPositions, 3));
    const ptMat = new THREE.PointsMaterial({ color: 0xe68e2e, size: 0.04, transparent: true, opacity: 0.8 });
    const pts = new THREE.Points(ptGeo, ptMat);
    scene.add(pts);

    let animId: number;
    let t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.005;
      ico.rotation.y = t * 0.5;
      ico.rotation.x = Math.sin(t * 0.3) * 0.1;
      wire.rotation.copy(ico.rotation);
      ring.rotation.z = t * 0.3;
      ring2.rotation.y = t * 0.2;
      pts.rotation.y = -t * 0.15;
      camera.position.y = Math.sin(t * 0.5) * 0.1;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full max-w-[737px] max-h-[678px] translate-z-0"
      aria-hidden
    />
  );
}
