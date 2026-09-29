import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ASSETS, CAMERA, CONTROLS, PRESETS, DEMO } from './config.js';
import { createScene, setupRoomLights, fitSunToModel } from './scene.js';
import { fixBlackMaterials, applyWoodTexture } from './materials.js';
import { createCameraRig } from './cameraRig.js';
import { initPicking } from './picking.js';
import { createDemoObjects } from './demoObjects.js';
import { initUI, syncRange } from './ui.js';

// ------------------------------------------------------------
// Entry point: load Room.glb -> fix materials -> add demo
// objects/lights -> wire control panel -> animate.
// ------------------------------------------------------------
const container = document.getElementById('app');
const loaderEl = document.getElementById('loader');
const hintEl = document.getElementById('hint');

const { scene, camera, renderer, controls, sun } = createScene(container);
const rig = createCameraRig(camera, controls);
const pickables = [];
const picking = initPicking({ renderer, camera, rig, pickables });

let demo = null;
let roomLights = null;
let followSpeed = CONTROLS.followSpeed;
let initialView = null;

// --- model load ------------------------------------------------
new GLTFLoader().load(
  ASSETS.modelUrl,
  (gltf) => onModelLoaded(gltf.scene),
  undefined,
  (err) => {
    loaderEl.textContent = 'Failed to load: ' + err.message;
    console.error(err);
  },
);

function onModelLoaded(model) {
  model.userData.isPickRoot = true;
  scene.add(model);
  pickables.push(model);

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();

  model.updateMatrixWorld(true);
  fixBlackMaterials(model, box);
  applyWoodTexture({ model, renderer, hintEl });

  fitSunToModel(sun, center, size);
  frameCameraOnModel(center, size);

  demo = createDemoObjects({ scene, pickables, center, size });
  demo.setDemoVisible(DEMO.enabled);
  demo.setOrbitVisible(DEMO.orbitMoon);
  roomLights = setupRoomLights(scene, center, size);

  loaderEl.classList.add('hidden');
}

// Position camera to fit the model (or use CAMERA.startPos override).
function frameCameraOnModel(center, size) {
  controls.target.copy(center);
  if (CAMERA.startPos) camera.position.set(...CAMERA.startPos);
  else camera.position.set(center.x - size * 0.35, center.y + size * 0.3, center.z - size * 0.45);
  if (CAMERA.startTarget) controls.target.set(...CAMERA.startTarget);
  camera.near = Math.max(0.1, size / CAMERA.nearDivisor);
  camera.far = size * CAMERA.farMultiplier;
  camera.updateProjectionMatrix();
  controls.update();
  initialView = { pos: camera.position.clone(), tgt: controls.target.clone() };
}

// --- control panel ---------------------------------------------
initUI({
  onReset: () => {
    picking.clearSelection();
    rig.clearSaved();
    rig.cancelFlight();
    if (initialView) rig.flyTo(initialView.pos, initialView.tgt, 1.2);
  },
  onRotate: (v) => { controls.autoRotate = v; },
  onDemo: (v) => { demo?.setDemoVisible(v); },
  onMoon: (v) => { demo?.setOrbitVisible(v); },
  onSun: (v) => { sun.intensity = v; },
  onExposure: (v) => { renderer.toneMappingExposure = v; },
  onFollow: (v) => { followSpeed = v; },
  onRoom1: (v) => { if (roomLights) roomLights.warm.visible = v; },
  onRoom1Color: (v) => { roomLights?.warm.color.set(v); },
  onRoom1Level: (v) => { if (roomLights) roomLights.warm.intensity = v; },
  onRoom2: (v) => { if (roomLights) roomLights.cool.visible = v; },
  onRoom2Color: (v) => { roomLights?.cool.color.set(v); },
  onRoom2Level: (v) => { if (roomLights) roomLights.cool.intensity = v; },
  onPreset: (name) => {
    const p = PRESETS[name];
    if (!p) return;
    sun.color.set(p.sun);
    sun.intensity = p.intensity;
    renderer.toneMappingExposure = p.exposure;
    scene.background.set(p.bg);
    syncRange('uiSun', 'uiSunVal', p.intensity);
    syncRange('uiExp', 'uiExpVal', p.exposure, 2);
  },
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// --- frame loop --------------------------------------------------
const clock = new THREE.Clock();
(function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  rig.update(dt, followSpeed);
  demo?.update(clock.elapsedTime);
  controls.update();
  renderer.render(scene, camera);
})();
