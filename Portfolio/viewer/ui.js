// ------------------------------------------------------------
// Wires the Controls panel. All behavior lives in main.js via
// callbacks, so this module never imports scene/picking/camera
// code (no import cycles).
//
// Callbacks: onReset, onRotate, onDemo, onMoon, onSun,
// onExposure, onFollow, onPreset
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
  paintAllRanges();
}

// Paints the filled portion of a range slider (see --fill in CSS).
function paintRange(el) {
  const min = parseFloat(el.min || 0);
  const max = parseFloat(el.max || 100);
  const pct = ((parseFloat(el.value) - min) / (max - min)) * 100;
  el.style.setProperty('--fill', `${pct}%`);
}

function paintAllRanges() {
  document.querySelectorAll('#ui-panel input[type=range]').forEach(paintRange);
}

function bindRange(inputId, valId, onChange, digits) {
  const el = document.getElementById(inputId);
  paintRange(el);
  el.oninput = (e) => {
    const v = parseFloat(e.target.value);
    document.getElementById(valId).textContent = v.toFixed(digits);
    paintRange(e.target);
    onChange(v);
  };
}

// Called by main.js when a mood preset changes slider-backed
// values, so the panel always shows the truth.
export function syncRange(inputId, valId, v, digits = 1) {
  const el = document.getElementById(inputId);
  el.value = v;
  paintRange(el);
  document.getElementById(valId).textContent = Number(v).toFixed(digits);
}
