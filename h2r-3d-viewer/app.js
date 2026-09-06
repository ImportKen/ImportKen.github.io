import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c0f);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(3, 2, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.2));

// Street environment GLB - auto-fit around bike
const pmrem = new THREE.PMREMGenerator(renderer);
let envScene = null;

function fitEnvironment() {
  if (!envScene || bike.children.length === 0) return;

  const eSize = new THREE.Box3().setFromObject(envScene).getSize(new THREE.Vector3());
  const bSize = new THREE.Box3().setFromObject(bike).getSize(new THREE.Vector3());
  const scale = (Math.max(bSize.x, bSize.z) * 6) / Math.max(eSize.x, eSize.z, eSize.y);
  envScene.scale.setScalar(scale);

  const box2 = new THREE.Box3().setFromObject(envScene);
  const c2 = box2.getCenter(new THREE.Vector3());
  envScene.position.sub(c2);
  envScene.position.y = -box2.min.y;

  envScene.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  scene.add(envScene);
}

new GLTFLoader().load(
  'https://importken.github.io/dirty_street.glb',
  gltf => {
    envScene = gltf.scene;
    scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    fitEnvironment();
  },
  undefined,
  e => console.error('Env load error:', e)
);

// Ring helper
function makeRing(color) {
  const r = new THREE.Mesh(
    new THREE.RingGeometry(1.22, 1.38, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
  );
  r.rotation.x = -Math.PI / 2;
  r.position.y = 0.14;
  return r;
}

// One spotlight per direction, each with a matching glow ring
const spotTop = new THREE.SpotLight(0xffffff, 6);
spotTop.position.set(0, 6, 0);

const spots = [];
const dirs = [
  [3, 2.5, 0],   // front  (red)
  [-3, 2.5, 0],  // back
  [0, 2.5, 3],   // right  (blue)
  [0, 2.5, -3],  // left
];
const spotColors = [0xff6666, 0xffdd66, 0x6cb4ff, 0x66ffa0];
const rings = [];

[spotTop, ...dirs.map(p => {
  const s = new THREE.SpotLight(0xffffff, 6);
  s.position.set(...p);
  return s;
})].forEach(s => {
  s.angle = 0.7;
  s.penumbra = 0.5;
  s.decay = 1;
  s.castShadow = true;
  scene.add(s);
  spots.push(s);
});

// Glow rings for each directional spot
dirs.forEach((_, i) => {
  const r = makeRing(spotColors[i]);
  scene.add(r);
  rings.push(r);
});

const allSpots = spots;

// Light controls
const lightBtn = document.getElementById('lightBtn');
const lightInt = document.getElementById('lightInt');
lightBtn.onclick = () => {
  const on = !allSpots[0].visible;
  allSpots.forEach(s => s.visible = on);
  rings.forEach(r => r.visible = on);
  lightBtn.textContent = on ? 'Spotlight: ON' : 'Spotlight: OFF';
  lightBtn.classList.toggle('active', on);
};
lightInt.oninput = () => {
  allSpots.forEach(s => s.intensity = parseFloat(lightInt.value));
  const c = allSpots[0].color;
  rings.forEach(r => r.material.color.copy(c));
};

// Light color swatches
const lightColors = [0xffffff, 0xffdd66, 0x6cb4ff, 0xff6666, 0x66ffa0, 0xdd66ff];
const lightPalette = document.getElementById('lightPalette');
lightColors.forEach(c => {
  const el = document.createElement('div');
  el.className = 'sw' + (c === 0xffffff ? ' on' : '');
  el.style.background = `#${c.toString(16).padStart(6, '0')}`;
  el.onclick = () => {
    lightPalette.querySelectorAll('.sw').forEach(s => s.classList.remove('on'));
    el.classList.add('on');
    allSpots.forEach(s => s.color.set(c));
    rings.forEach(r => r.material.color.set(c));
  };
  lightPalette.appendChild(el);
});

// Directional light with movable position + color
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(4, 4, 3);
scene.add(dirLight);

// Visible marker for the directional light position
const dirMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x35d07f })
);
scene.add(dirMarker);

const dirX = document.getElementById('dirX');
const dirY = document.getElementById('dirY');
const dirZ = document.getElementById('dirZ');
[dirX, dirY, dirZ].forEach(s => {
  s.oninput = () => {
    dirLight.position.set(
      parseFloat(dirX.value), parseFloat(dirY.value), parseFloat(dirZ.value)
    );
    dirMarker.position.copy(dirLight.position);
  };
});

const dirColors = [0xffffff, 0xffdd66, 0x6cb4ff, 0xff6666, 0x66ffa0, 0xdd66ff];
const dirPalette = document.getElementById('dirPalette');
dirColors.forEach(c => {
  const el = document.createElement('div');
  el.className = 'sw' + (c === 0xffffff ? ' on' : '');
  el.style.background = `#${c.toString(16).padStart(6, '0')}`;
  el.onclick = () => {
    dirPalette.querySelectorAll('.sw').forEach(s => s.classList.remove('on'));
    el.classList.add('on');
    dirLight.color.set(c);
    dirMarker.material.color.set(c);
  };
  dirPalette.appendChild(el);
});

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x1c2026, metalness: 0.3, roughness: 0.6 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Pedestal turntable
const table = new THREE.Mesh(
  new THREE.CylinderGeometry(1.1, 1.2, 0.12, 64),
  new THREE.MeshPhysicalMaterial({ color: 0x121620, metalness: 0.7, roughness: 0.3, clearcoat: 0.5 })
);
table.position.y = 0.06;
table.receiveShadow = true;
scene.add(table);

const bike = new THREE.Group();
scene.add(bike);

// Texture
let woodTex = null;
new THREE.TextureLoader().load(
  'https://importken.github.io/image/wood_table_worn_diff_1k.jpg',
  t => { woodTex = t; }
);

const defaultMat = new THREE.MeshPhysicalMaterial({
  color: 0x9a1b1b, metalness: 0.6, roughness: 0.25, clearcoat: 1.0
});
const woodMat = new THREE.MeshPhysicalMaterial({ roughness: 0.7, metalness: 0.1, map: null });

// Keep a per-mesh copy of the ORIGINAL material so we can restore it.
const originals = new Map();

function paint(color) {
  bike.traverse(o => {
    if (o.isMesh) {
      const m = new THREE.MeshPhysicalMaterial({
        color, metalness: 0.6, roughness: 0.25, clearcoat: 1.0, clearcoatRoughness: 0.08
      });
      // keep original map if present
      const orig = originals.get(o);
      if (orig && orig.map) m.map = orig.map;
      o.material = m;
    }
  });
}

function wood() {
  if (!woodTex) return;
  bike.traverse(o => {
    if (o.isMesh) {
      o.material = woodMat.clone();
      o.material.map = woodTex;
    }
  });
}

function original() {
  bike.traverse(o => {
    if (o.isMesh && originals.has(o)) {
      o.material = originals.get(o);
      o.material.needsUpdate = true;
    }
  });
}

// GLB
new GLTFLoader().load('https://importken.github.io/h2r.glb', gltf => {
  const m = gltf.scene;
  const box = new THREE.Box3().setFromObject(m);
  const c = box.getCenter(new THREE.Vector3());
  m.position.sub(c);
  m.position.y -= (box.min.y - c.y); // sit on floor
  // Keep the model's ORIGINAL material/texture (do NOT repaint)
  m.traverse(o => {
    if (o.isMesh) originals.set(o, o.material);
  });
  bike.add(m);
  fitEnvironment();
});

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.6, 0);

// Palette
const colors = [0x9a1b1b, 0x1a1a1a, 0x003da5, 0x1b8a2a, 0xf5f5f5, 0xffb300, 0x7b1fa2];
const palette = document.getElementById('palette');
colors.forEach((c, i) => {
  const el = document.createElement('div');
  el.className = 'sw' + (i === 0 ? ' on' : '');
  el.style.background = `#${c.toString(16).padStart(6, '0')}`;
  el.onclick = () => {
    palette.querySelectorAll('.sw').forEach(s => s.classList.remove('on'));
    el.classList.add('on');
    paint(c);
  };
  palette.appendChild(el);
});

// Buttons
const woodBtn = document.getElementById('woodBtn');
const origBtn = document.getElementById('origBtn');
woodBtn.onclick = () => {
  woodBtn.classList.add('active'); origBtn.classList.remove('active');
  if (woodTex) wood();
};
origBtn.onclick = () => {
  origBtn.classList.add('active'); woodBtn.classList.remove('active');
  original();
};

// Spin slider
const spd = document.getElementById('spd');

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

(function loop() {
  bike.rotation.y += 0.005 * parseFloat(spd.value);
  rings.forEach(r => r.material.opacity = 0.6 + Math.sin(performance.now() * 0.002) * 0.2);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
})();
