// ------------------------------------------------------------
// Wires the Controls panel. All behavior lives in main.js via
// callbacks, so this module never imports scene/picking/camera
// code (no import cycles).
//
// Callbacks: onReset, onRotate, onDemo, onMoon, onSun,
// onExposure, onFollow, onPreset, onRoom1, onRoom1Color,
// onRoom1Level, onRoom2, onRoom2Color, onRoom2Level
// ------------------------------------------------------------
export function initUI(cb) {
  const $ = (id) => document.getElementById(id);
  const panel = $('ui-panel');
  const fab = $('uiFab');

  $('resetView').onclick = cb.onReset;
  $('uiCollapse').onclick = () => { panel.classList.add('collapsed'); fab.classList.remove('hidden'); };
  fab.onclick = () => { panel.classList.remove('collapsed'); fab.classList.add('hidden'); };

  document.querySelectorAll('.ui-chips button').forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll('.ui-chips button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      cb.onPreset(btn.dataset.preset);
    };
  });

  $('uiRotate').onchange = (e) => cb.onRotate(e.target.checked);
  $('uiDemo').onchange = (e) => cb.onDemo(e.target.checked);
  $('uiMoon').onchange = (e) => cb.onMoon(e.target.checked);

  bindRange('uiSun', 'uiSunVal', cb.onSun, 1);
  bindRange('uiExp', 'uiExpVal', cb.onExposure, 2);
  bindRange('uiFollow', 'uiFollowVal', cb.onFollow, 1);

  $('uiRoom1').onchange = (e) => cb.onRoom1(e.target.checked);
  $('uiRoom1Color').oninput = (e) => cb.onRoom1Color(e.target.value);
  $('uiRoom1Level').oninput = (e) => setLevel(e.target.value, 'uiRoom1Val', cb.onRoom1Level);

  $('uiRoom2').onchange = (e) => cb.onRoom2(e.target.checked);
  $('uiRoom2Color').oninput = (e) => cb.onRoom2Color(e.target.value);
  $('uiRoom2Level').oninput = (e) => setLevel(e.target.value, 'uiRoom2Val', cb.onRoom2Level);
}

function bindRange(inputId, valId, onChange, digits) {
  document.getElementById(inputId).oninput = (e) => {
    const v = parseFloat(e.target.value);
    document.getElementById(valId).textContent = v.toFixed(digits);
    onChange(v);
  };
}

function setLevel(raw, valId, onChange) {
  const v = parseFloat(raw);
  document.getElementById(valId).textContent = v.toFixed(0);
  onChange(v);
}

// Called by main.js when a mood preset changes slider-backed
// values, so the panel always shows the truth.
export function syncRange(inputId, valId, v, digits = 1) {
  document.getElementById(inputId).value = v;
  document.getElementById(valId).textContent = Number(v).toFixed(digits);
}
