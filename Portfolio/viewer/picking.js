import * as THREE from 'three';
import { PICKING } from './config.js';

// ------------------------------------------------------------
// Object picking: click selects (info card + zoom),
// click again / empty space deselects and flies back.
// Emissive highlight is gated by PICKING.highlightEnabled.
// ------------------------------------------------------------
export function initPicking({ renderer, camera, rig, pickables }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pickInfo = document.getElementById('pick-info');
  let selected = null;
  let savedEmissive = null;

  function setPointer(e) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  function clearSelection() {
    if (selected && savedEmissive) {
      selected.material.emissive.setHex(savedEmissive.hex);
      selected.material.emissiveIntensity = savedEmissive.intensity;
    }
    selected = null;
    savedEmissive = null;
    pickInfo.classList.add('hidden');
  }

  // Outline helpers have no emissive -> use their parent instead.
  function resolveMesh(obj) {
    if (obj?.material?.side === THREE.BackSide && obj.parent) obj = obj.parent;
    while (obj && !obj.isMesh) obj = obj.parent;
    return obj;
  }

  function showInfoCard(obj, hitPoint) {
    const c = obj.material.color;
    pickInfo.innerHTML =
      `<b>Selected:</b> ${obj.name || '(unnamed mesh)'}<br>` +
      `Type: ${obj.geometry?.type || 'mesh'}<br>` +
      `Color: #${c ? c.getHexString() : '---'}<br>` +
      `Pos: ${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)}<br>` +
      (hitPoint ? `Hit: ${hitPoint.x.toFixed(2)}, ${hitPoint.y.toFixed(2)}, ${hitPoint.z.toFixed(2)}<br>` : '') +
      `<button id="deselectBtn">Deselect</button> ` +
      `<button id="focusBtn">Focus</button>`;
    pickInfo.classList.remove('hidden');
    document.getElementById('deselectBtn').onclick = (e) => { e.stopPropagation(); clearSelection(); rig.goBack(); };
    document.getElementById('focusBtn').onclick = (e) => { e.stopPropagation(); if (selected) rig.focusObject(selected); };
  }

  function selectObject(obj, hitPoint) {
    obj = resolveMesh(obj);
    if (!obj?.isMesh) return;
    if (PICKING.highlightEnabled && (!obj.material?.emissive || Array.isArray(obj.material))) return;
    clearSelection();
    if (PICKING.highlightEnabled) {
      // Clone per-mesh so the highlight doesn't leak to shared materials.
      obj.material = obj.material.clone();
      savedEmissive = { hex: obj.material.emissive.getHex(), intensity: obj.material.emissiveIntensity };
      obj.material.emissive.setHex(PICKING.highlightColor);
      obj.material.emissiveIntensity = PICKING.highlightIntensity;
    }
    selected = obj;
    showInfoCard(obj, hitPoint);
  }

  function pickAt(e) {
    if (!pickables.length) return null;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickables, true);
    return hits[0] || null;
  }

  // Click vs drag: only pick if the pointer barely moved.
  let downX = 0, downY = 0;
  renderer.domElement.addEventListener('pointerdown', (e) => {
    downX = e.clientX;
    downY = e.clientY;
    rig.cancelFlight();
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > PICKING.maxDragPixels) return; // was a drag
    const hit = pickAt(e);
    if (hit) {
      const obj = resolveMesh(hit.object);
      if (!obj) return;
      if (obj === selected) { clearSelection(); rig.goBack(); } // click again = back
      else { selectObject(obj, hit.point); rig.focusObject(obj); }
    } else {
      clearSelection();
      rig.goBack(); // click empty space = back
    }
  });
  // Hover cursor.
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (e.buttons !== 0 || !pickables.length) return;
    renderer.domElement.style.cursor = pickAt(e) ? 'pointer' : 'grab';
  });

  return {
    clearSelection,
    getSelected: () => selected,
    select: (obj) => { selectObject(obj, null); rig.focusObject(obj); },
  };
}
