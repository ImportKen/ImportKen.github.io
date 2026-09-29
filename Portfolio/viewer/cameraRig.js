import * as THREE from 'three';
import { CAMERA_RIG } from './config.js';

// ------------------------------------------------------------
// Click-to-zoom camera: flies in front of an object, tracks it
// while selected, and flies back on deselect.
// ------------------------------------------------------------
export function createCameraRig(camera, controls) {
  let savedView = null; // {pos, tgt} before zoom
  let followTarget = null; // object tracked after zoom
  const followTmp = new THREE.Vector3();
  const flight = {
    active: false, t: 0, dur: CAMERA_RIG.flightDuration,
    fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(),
    fromTgt: new THREE.Vector3(), toTgt: new THREE.Vector3(),
  };

  function flyTo(pos, tgt, dur = CAMERA_RIG.flightDuration) {
    flight.fromPos.copy(camera.position);
    flight.toPos.copy(pos);
    flight.fromTgt.copy(controls.target);
    flight.toTgt.copy(tgt);
    flight.t = 0;
    flight.dur = dur;
    flight.active = true;
    controls.enabled = false;
  }

  function focusObject(obj) {
    if (!savedView) savedView = { pos: camera.position.clone(), tgt: controls.target.clone() };
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = Math.max(box.getSize(new THREE.Vector3()).length(), CAMERA_RIG.minObjectSize);
    const dir = camera.position.clone().sub(center).normalize();
    if (dir.lengthSq() < 0.5) dir.set(1, 0.5, 1).normalize(); // camera exactly at center
    const dist = THREE.MathUtils.clamp(size * CAMERA_RIG.distanceFactor, CAMERA_RIG.minFocusDistance, CAMERA_RIG.maxFocusDistance);
    const dest = center.clone().add(dir.multiplyScalar(dist));
    dest.y += size * CAMERA_RIG.liftFactor;
    flyTo(dest, center, CAMERA_RIG.flightDuration);
    followTarget = obj;
  }

  function goBack() {
    followTarget = null;
    if (!savedView) return;
    flyTo(savedView.pos, savedView.tgt, CAMERA_RIG.flightDuration);
    savedView = null;
  }

  // Advance flight tween + look-follow. Called every frame.
  function update(dt, followSpeed) {
    if (flight.active) {
      flight.t += dt;
      const k = Math.min(flight.t / flight.dur, 1);
      const e = k * k * (3 - 2 * k); // smoothstep
      camera.position.lerpVectors(flight.fromPos, flight.toPos, e);
      controls.target.lerpVectors(flight.fromTgt, flight.toTgt, e);
      if (k >= 1) {
        flight.active = false;
        controls.enabled = true;
      }
    }
    if (followTarget && !flight.active) {
      followTarget.getWorldPosition(followTmp);
      controls.target.lerp(followTmp, 1 - Math.exp(-followSpeed * dt));
    }
  }

  return {
    flyTo,
    focusObject,
    goBack,
    cancelFlight: () => { flight.active = false; controls.enabled = true; },
    clearSaved: () => { savedView = null; followTarget = null; },
    update,
  };
}
