import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CAMERA, CONTROLS, RENDERER, LIGHTS } from './config.js';

// ------------------------------------------------------------
// Builds renderer + scene + camera + controls + base lights.
// Returns everything main.js needs for the frame loop.
// ------------------------------------------------------------
export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  const camera = new THREE.PerspectiveCamera(CAMERA.fov, innerWidth / innerHeight, 0.1, 1000);
  camera.position.set(...CAMERA.fallbackPos);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, RENDERER.maxPixelRatio));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = RENDERER.toneMappingExposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Image-based lighting: gives PBR metals/plastics reflections,
  // otherwise dark materials render pure black.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = CONTROLS.enableDamping;
  controls.autoRotate = CONTROLS.autoRotate;
  controls.target.set(...CAMERA.fallbackTarget);

  scene.add(new THREE.HemisphereLight(LIGHTS.hemi.sky, LIGHTS.hemi.ground, LIGHTS.hemi.intensity));

  const sun = new THREE.DirectionalLight(LIGHTS.sun.color, LIGHTS.sun.intensity);
  sun.position.set(5, 8, 5); // reframed to model bounds after load
  sun.castShadow = true;
  sun.shadow.mapSize.set(RENDERER.shadowMapSize, RENDERER.shadowMapSize);
  sun.shadow.bias = RENDERER.shadowBias;
  sun.shadow.normalBias = RENDERER.shadowNormalBias;
  scene.add(sun, sun.target);

  // Cool rim light for contrast against the warm sun.
  const rim = new THREE.DirectionalLight(LIGHTS.rim.color, LIGHTS.rim.intensity);
  rim.position.set(...LIGHTS.rim.position);
  scene.add(rim);

  return { scene, camera, renderer, controls, sun };
}

// Fit the sun shadow frustum + position to the loaded model.
// Without this the default +-5 box clips and creates black patches.
export function fitSunToModel(sun, center, size) {
  const extent = size * 0.5;
  Object.assign(sun.shadow.camera, {
    left: -extent, right: extent, top: extent, bottom: -extent,
    near: 0.1, far: size * 4,
  });
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.position.copy(center);
  const [ox, oy, oz] = LIGHTS.sun.offsetFactor;
  sun.position.set(center.x + size * ox, center.y + size * oy, center.z + size * oz);
}
