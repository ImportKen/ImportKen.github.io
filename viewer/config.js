// ============================================================
//  Room Viewer — central configuration
// ------------------------------------------------------------
//  Edit values here to tune the whole scene.
//  No other file contains magic numbers for look/feel.
//  Each section is independent and documented.
// ============================================================

export const ASSETS = {
  /** Main .glb model to load (root-relative so every page finds it) */
  modelUrl: 'https://importken.github.io/GLB/FinalRoom.glb',
  /** Wood diffuse texture applied to the table mesh */
  woodUrl: 'https://importken.github.io/image/wood_table_worn_diff_1k.jpg',
  /** Mesh name (case/punctuation-insensitive) that gets the wood texture */
  woodTargetName: 'cube002',
};

export const CAMERA = {
  /** Fixed start position [x,y,z], or null = auto-fit from model bounds */
  startPos: null, // e.g. [6, 4, 8]
  /** Fixed look-at target, or null = model center */
  startTarget: null, // e.g. [0, 1, 0]
  fov: 60,
  nearDivisor: 1000, // near = size / nearDivisor (min 0.1)
  farMultiplier: 20, // far = size * farMultiplier
  fallbackPos: [4, 3, 6], // used before model loads
  fallbackTarget: [0, 1, 0],
};

export const CONTROLS = {
  enableDamping: true,
  autoRotate: false, // initial value of the "Auto-rotate" checkbox
  followSpeed: 2.0, // how fast camera tracks selected object (1/s)
};

export const RENDERER = {
  maxPixelRatio: 2,
  toneMappingExposure: 1.1,
  shadowMapSize: 2048,
  shadowBias: -0.0004,
  shadowNormalBias: 0.02,
};

export const LIGHTS = {
  // Hemisphere fill so shadows are never pitch black.
  hemi: { sky: 0xffffff, ground: 0x444444, intensity: 0.15 },
  // Main sun (shadow-casting directional).
  sun: { color: 0xfff4e6, intensity: 2.6, offsetFactor: [0.5, 0.8, 0.5] },
  // Cool rim from behind for contrast.
  rim: { color: 0x6fb3ff, intensity: 1.1, position: [-6, 3, -5] },
};

// Mood presets for the Day / Sunset / Night chips in the panel.
export const PRESETS = {
  day: { sun: 0xfff4e6, intensity: 2.6, exposure: 1.1, bg: 0x1a1a2e },
  sunset: { sun: 0xff9a5a, intensity: 2.2, exposure: 1.0, bg: 0x2b1a26 },
  night: { sun: 0x8fb4ff, intensity: 0.7, exposure: 0.9, bg: 0x05070f },
};

export const DEMO = {
  enabled: true,
  /** Fixed world position of the chrome ball; torus + octa stack below it, moon orbits it. */
  chromeAnchor: [-3.36, 5.26, 2.73],
  torus: { color: 0xff5a3c, glow: 0xff7a1a, glowIntensity: 12, tubeRatio: 0.32, toonSteps: 3 },
  octa: { color: 0x27d7ff, glow: 0x2f7bff, glowIntensity: 10, toonSteps: 4 },
  chrome: { color: 0xcfd6e4, roughness: 0.1, metalness: 0.6, envMapIntensity: 1.2 },
  moon: { lightColor: 0xdce8ff, lightIntensity: 8, toonSteps: 3, orbitSpeed: 0.45, orbitRadiusFactor: 0.45 },
  sizes: { torusRadiusFactor: 0.02, moonRadiusFactor: 0.025 },
  offsets: {
    torus: [-0.07, -0.14, 0.2], // x,y,z as fraction of model size
    octaHeightFactor: 0.09,
    chromeHeightFactor: 0.07, // stacked above octa
    orbitHeightFactor: 0.12,
  },
  animation: { spinA: 0.6, spinB: 0.9, bobA: 1.5, bobAmountA: 0.08, bobAmountB: 0.06 },
  orbitMoon: true,
};

export const CAMERA_RIG = {
  flightDuration: 1.0,
  minFocusDistance: 1.2,
  maxFocusDistance: 12,
  distanceFactor: 1.6, // focus dist = objectSize * this
  minObjectSize: 0.5,
  liftFactor: 0.15, // camera sits this * size above center
};

export const PICKING = {
  highlightColor: 0xff8c00,
  highlightIntensity: 0.45,
  maxDragPixels: 6, // pointerup beyond this = drag, not click
};

export const UI_DEFAULTS = {
  sun: 2.6,
  exposure: 1.1,
  follow: 2.0,
};
