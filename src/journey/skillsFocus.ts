import * as THREE from "three";

/** Shared Skills-planet focus state (written by SkillsOrbit, read by CameraRig). */
export const skillsFocus = {
  /** Index into SkillsOrbit ITEMS, -1 = none. */
  idx: -1,
  /** Smoothed 0..1 weight of the focus camera. */
  w: 0,
  /** World position of the focused planet (updated each frame by SkillsOrbit). */
  pos: new THREE.Vector3(),
  /** performance.now() of the last focus click (to ignore the same click in the click-away handler). */
  setAt: 0,
};
