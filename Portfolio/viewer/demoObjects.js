import * as THREE from 'three';
import { DEMO } from './config.js';
import { makeToonGradient } from './materials.js';

// Black back-side shell => cheap cartoon outline.
function addOutline(mesh, scale = 1.05) {
  const outline = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.BackSide }));
  outline.scale.setScalar(scale);
  mesh.add(outline);
  return outline;
}

function makeGlow(color, intensity) {
  return new THREE.PointLight(color, intensity, 0, 1.6);
}

// Paints a crater texture for the moon.
function makeMoonTexture() {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#d9dad2';
  g.fillRect(0, 0, 256, 128);
  const craters = [[40, 40, 14], [90, 70, 9], [130, 35, 11], [170, 80, 15], [210, 45, 8], [60, 95, 7], [150, 100, 10], [230, 95, 12], [110, 55, 6], [190, 60, 6]];
  for (const [x, y, r] of craters) {
    g.fillStyle = 'rgba(120,122,112,0.55)';
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = 'rgba(235,236,228,0.6)';
    g.beginPath(); g.arc(x - r * 0.25, y - r * 0.25, r * 0.55, 0, 7); g.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ------------------------------------------------------------
// Extra animated objects: orange torus knot + blue octahedron
// near the model, chrome ball above them, and a cratered moon
// orbiting the whole room. All sizes derive from model size.
// ------------------------------------------------------------
export function createDemoObjects({ scene, pickables, center, size }) {
  const r = size * DEMO.sizes.torusRadiusFactor;

  // --- torus knot ---
  const torusGroup = new THREE.Group();
  torusGroup.name = 'CelDemo_TorusKnot';
  const torusMesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(r, r * DEMO.torus.tubeRatio, 120, 20),
    new THREE.MeshToonMaterial({ color: new THREE.Color(DEMO.torus.color), gradientMap: makeToonGradient(DEMO.torus.toonSteps) }),
  );
  torusMesh.castShadow = true;
  torusMesh.name = 'CelDemo_TorusKnot';
  addOutline(torusMesh, 1.05);
  const torusGlow = makeGlow(DEMO.torus.glow, DEMO.torus.glowIntensity);
  torusGroup.add(torusMesh, torusGlow);
  const [tx, ty, tz] = DEMO.offsets.torus;
  torusGroup.position.set(center.x + size * tx, center.y + size * ty, center.z + size * tz);
  scene.add(torusGroup);
  pickables.push(torusGroup);
  const torusBaseY = torusGroup.position.y;

  // --- octahedron floating above the torus ---
  const octaGroup = new THREE.Group();
  octaGroup.name = 'CelDemo_Octa';
  const octaMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(r * 0.9, 0),
    new THREE.MeshToonMaterial({ color: new THREE.Color(DEMO.octa.color), gradientMap: makeToonGradient(DEMO.octa.toonSteps) }),
  );
  octaMesh.castShadow = true;
  octaMesh.name = 'CelDemo_Octa';
  addOutline(octaMesh, 1.08);
  const octaGlow = makeGlow(DEMO.octa.glow, DEMO.octa.glowIntensity);
  octaGroup.add(octaMesh, octaGlow);
  octaGroup.position.copy(torusGroup.position);
  octaGroup.position.y += size * DEMO.offsets.octaHeightFactor;
  scene.add(octaGroup);
  pickables.push(octaGroup);
  const octaBaseY = octaGroup.position.y;

  // --- chrome ball at the top of the stack ---
  const chromeGroup = new THREE.Group();
  chromeGroup.name = 'ChromeBall';
  const chromeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(r * 0.7, 32, 24),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(DEMO.chrome.color),
      roughness: DEMO.chrome.roughness,
      metalness: DEMO.chrome.metalness,
      envMapIntensity: DEMO.chrome.envMapIntensity,
    }),
  );
  chromeMesh.castShadow = true;
  chromeMesh.name = 'ChromeBall';
  addOutline(chromeMesh, 1.08);
  chromeGroup.add(chromeMesh);
  chromeGroup.position.copy(octaGroup.position);
  chromeGroup.position.y += size * DEMO.offsets.chromeHeightFactor;
  scene.add(chromeGroup);
  pickables.push(chromeGroup);

  // --- orbiting moon ---
  const moonGroup = new THREE.Group();
  moonGroup.name = 'OrbitSat';
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(size * DEMO.sizes.moonRadiusFactor, 24, 18),
    new THREE.MeshToonMaterial({ color: new THREE.Color(0xffffff), map: makeMoonTexture(), gradientMap: makeToonGradient(DEMO.moon.toonSteps) }),
  );
  moonMesh.castShadow = true;
  moonMesh.name = 'OrbitSat';
  addOutline(moonMesh, 1.15);
  moonGroup.add(moonMesh, makeGlow(DEMO.moon.lightColor, DEMO.moon.lightIntensity));
  const orbitR = size * DEMO.moon.orbitRadiusFactor;
  const orbitY = center.y + size * DEMO.offsets.orbitHeightFactor;
  scene.add(moonGroup);
  pickables.push(moonGroup);

  const anim = DEMO.animation;
  function update(time) {
    torusGroup.rotation.y = time * anim.spinA;
    torusGroup.position.y = torusBaseY + Math.sin(time * anim.bobA) * anim.bobAmountA;
    octaGroup.rotation.y = -time * anim.spinB;
    octaGroup.rotation.x = Math.sin(time * 0.7) * 0.4;
    octaGroup.position.y = octaBaseY + Math.sin(time * anim.bobA + Math.PI) * anim.bobAmountB;
    chromeGroup.rotation.y = time * 1.1;
    torusGlow.intensity = 10 + Math.sin(time * 3.0) * 4;
    octaGlow.intensity = 8 + Math.sin(time * 3.0 + Math.PI) * 3;
    const a = time * DEMO.moon.orbitSpeed;
    moonGroup.position.set(
      center.x + Math.cos(a) * orbitR,
      orbitY + Math.sin(time * 1.1) * 0.15,
      center.z + Math.sin(a) * orbitR,
    );
    moonGroup.rotation.y = time * 2.0;
  }

  return {
    update,
    setDemoVisible: (v) => { torusGroup.visible = octaGroup.visible = chromeGroup.visible = v; },
    setOrbitVisible: (v) => { moonGroup.visible = v; },
    targets: { torus: torusGroup, octa: octaGroup, chrome: chromeGroup, moon: moonGroup },
  };
}
