import * as THREE from "three";

/**
 * Procedural studio environment (a few emissive teal / white / cyan panels on
 * near-black) baked once with PMREM. Gives glass and metal something to
 * reflect without shipping an HDR file.
 */
export function makeEnvTexture(gl: THREE.WebGLRenderer): THREE.Texture {
  const pm = new THREE.PMREMGenerator(gl);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#04080a");
  const panel = (color: string, gain: number, w: number, h: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(gain), side: THREE.DoubleSide }),
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  panel("#1fe3c2", 7, 12, 4, -9, 5, 5);
  panel("#ffffff", 6, 9, 3, 7, 9, 6);
  panel("#22d3ee", 5, 14, 2.5, 0, -7, -9);
  panel("#8ff5e6", 4, 3, 12, 10, 0, -3);
  panel("#0d8f86", 3, 24, 7, 0, 11, -11);
  panel("#ffffff", 3, 5, 5, -4, -2, 12);
  const rt = pm.fromScene(scene, 0.035);
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  });
  pm.dispose();
  return rt.texture;
}