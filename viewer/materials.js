import * as THREE from 'three';
import { ASSETS } from './config.js';

// ------------------------------------------------------------
// Cel-shading helper: stepped gradient map for MeshToonMaterial.
// ------------------------------------------------------------
export function makeToonGradient(steps = 3) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) data[i] = Math.round((i / (steps - 1)) * 255);
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

// ------------------------------------------------------------
// Room.glb ships every material as metalness 0 / roughness 0.5
// with no textures, and nodes are unnamed Blender primitives,
// so infer a plausible PBR surface from shape + color.
// ------------------------------------------------------------
const PBR_RULES = [
  { name: 'floor plane', when: (t, h, ctx) => t === 'plane' && ctx.isFloor, metalness: 0.05, roughness: 0.32, envMapIntensity: 1.3 },
  { name: 'wall plane', when: (t) => t === 'plane', metalness: 0.0, roughness: 0.92, envMapIntensity: 0.55 },
  { name: 'dark metal', when: (t, h) => h.s < 0.12 && h.l < 0.22, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.35 },
  { name: 'gray plastic/metal', when: (t, h) => h.s < 0.12 && h.l < 0.6, metalness: 0.5, roughness: 0.45, envMapIntensity: 1.05 },
  { name: 'cylinder', when: (t) => t === 'cylinder', metalness: 0.0, roughness: 0.38, envMapIntensity: 1.0 },
  { name: 'default', when: () => true, metalness: 0.0, roughness: 0.5, envMapIntensity: 0.9 },
];

const _hsl = { h: 0, s: 0, l: 0 };
const _typePrefix = /^[A-Za-z]+/;

export function fixBlackMaterials(root, bounds) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const mat of mats) {
      if (!mat?.isMeshStandardMaterial) continue;
      if (mat.map || mat.metalnessMap || mat.roughnessMap) continue; // already textured
      const type = (node.name.match(_typePrefix) || ['Mesh'])[0].toLowerCase();
      mat.color.getHSL(_hsl);
      const ctx = { isFloor: node.position.y - bounds.min.y < 0.05 };
      const rule = PBR_RULES.find((r) => r.when(type, _hsl, ctx));
      mat.metalness = rule.metalness;
      mat.roughness = rule.roughness;
      mat.envMapIntensity = rule.envMapIntensity;
    }
  });
}

// ------------------------------------------------------------
// Applies the wood diffuse texture to the table mesh.
// Reports progress into the hint bar so failures are visible.
// ------------------------------------------------------------
const normalizeName = (s) => (s || '').toLowerCase().replace(/[._\s-]+/g, '');

export function applyWoodTexture({ model, renderer, hintEl, url = ASSETS.woodUrl }) {
  const hintOrig = hintEl.textContent;
  hintEl.textContent = 'Loading wood texture…';
  new THREE.TextureLoader().load(
    url,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

      const found = [];
      const allNames = [];
      model.traverse((o) => {
        if (!o.isMesh || o.material?.side === THREE.BackSide) return;
        allNames.push(o.name);
        if (normalizeName(o.name) === ASSETS.woodTargetName) found.push(o);
      });
      console.log('model meshes:', allNames.join(', '));
      if (!found.length) {
        hintEl.textContent = `Table mesh not found (${allNames.length} meshes) — see console`;
        console.warn('Wood target not found:', ASSETS.woodTargetName);
        return;
      }
      for (const target of found) {
        const mat = target.material.clone();
        mat.map = tex;
        mat.color.set(0xffffff);
        mat.roughness = 0.75;
        mat.metalness = 0.0;
        mat.needsUpdate = true;
        target.material = mat;
      }
      hintEl.textContent = hintOrig;
    },
    undefined,
    (err) => {
      hintEl.textContent = 'Wood texture failed to load (network/CORS?)';
      console.error('wood texture failed', err);
    },
  );
}

// Polished chrome for the model's own center ball.
export function applyCenterChrome(model) {
  let done = 0;
  model.traverse((o) => {
    if (!o.isMesh || normalizeName(o.name) !== 'sphere') return;
    if (!o.material?.isMeshStandardMaterial) return;
    const mat = o.material.clone();
    mat.roughness = 0.1;
    mat.metalness = 0.6;
    mat.envMapIntensity = 1.2;
    mat.needsUpdate = true;
    o.material = mat;
    done++;
  });
  console.log(`center chrome applied to ${done} sphere(s)`);
}
