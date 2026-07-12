/* ═══════════════════════════════════════════
   RIFT DASHBOARD — SETTINGS & PLAYLISTS
   Prefs persist server-side via /api/prefs
   keyed to Discord user ID — syncs across devices
═══════════════════════════════════════════ */

/* ── State ───────────────────────────────── */
let _prefs = {};
let _prefsSaveTimeout = null;
let _dynGradientId = null;
let _bgStyle = 'stars';

const DEFAULTS = {
    accent:         '#7289da',
    bg:             'stars',
    sidebarOpacity: 70,
    glassBlur:      10,
    font:           'Outfit',
    fontSize:       14,
};

/* ── Init ─────────────────────────────────── */
window.initSettings = async function() {
    await loadPrefs();
    applyAllPrefs();
    renderSettingsUI();
};

/* ── Load / Save prefs ───────────────────── */
let _prefsLoaded = false;

async function loadPrefs() {
    // Already loaded this session — don't re-fetch from the worker
    if (_prefsLoaded && Object.keys(_prefs).length > 1) return;

    if (API_BASE && userProfile?.id) {
        try {
            const res = await fetch(`${API_BASE}/prefs/${userProfile.id}`, {
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            const data = await res.json();
            if (data && !data.error && Object.keys(data).length) {
                _prefs = { ...DEFAULTS, ...data };
                localStorage.setItem('rift_prefs', JSON.stringify(_prefs));
                _prefsLoaded = true;
                return;
            }
        } catch(e) {}
    }
    try {
        const stored = localStorage.getItem('rift_prefs');
        _prefs = stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
    } catch(e) {
        _prefs = { ...DEFAULTS };
    }
    _prefsLoaded = true;
}

function scheduleSave() {
    clearTimeout(_prefsSaveTimeout);
    // 2s debounce absorbs rapid slider drags — was 800ms, could fire 10+ saves per drag
    _prefsSaveTimeout = setTimeout(persistPrefs, 2000);
}

async function persistPrefs() {
    localStorage.setItem('rift_prefs', JSON.stringify(_prefs));
    if (API_BASE && userProfile?.id) {
        try {
            await fetch(`${API_BASE}/prefs/${userProfile.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify(_prefs),
            });
        } catch(e) {}
    }
}

// Call this on every page load (after login) to apply saved prefs immediately
window.applyStoredPrefs = function() {
    try {
        const stored = localStorage.getItem('rift_prefs');
        if (stored) {
            _prefs = { ...DEFAULTS, ...JSON.parse(stored) };
            applyAllPrefs();
        }
    } catch(e) {}
};

/* ── Apply all prefs ─────────────────────── */
function applyAllPrefs() {
    applyAccent(_prefs.accent || DEFAULTS.accent);
    applyBg(_prefs.bg || DEFAULTS.bg);
    applySidebarOpacity(_prefs.sidebarOpacity ?? DEFAULTS.sidebarOpacity);
    applyGlassBlur(_prefs.glassBlur ?? DEFAULTS.glassBlur);
    applyFont(_prefs.font || DEFAULTS.font);
    applyFontSize(_prefs.fontSize ?? DEFAULTS.fontSize);
}

/* ── Render settings UI ──────────────────── */
function renderSettingsUI() {
    const p = _prefs;

    // Accent swatches
    document.querySelectorAll('.swatch[data-color]').forEach(s => {
        s.classList.toggle('active', s.dataset.color === p.accent);
    });
    const customInput = document.getElementById('customAccentInput');
    if (customInput) customInput.value = p.accent || '#7289da';

    // BG options
    document.querySelectorAll('.bg-opt[data-bg]').forEach(b => {
        b.classList.toggle('active', b.dataset.bg === p.bg);
    });

    // Sliders
    setSliderUI('sidebarOpacity', p.sidebarOpacity ?? 70, v => `${v}%`);
    setSliderUI('glassBlur',      p.glassBlur      ?? 10, v => `${v}px`);
    setSliderUI('fontSize',       p.fontSize        ?? 14, v => `${v}px`);

    // Font
    document.querySelectorAll('.font-opt[data-font]').forEach(b => {
        b.classList.toggle('active', b.dataset.font === p.font || b.dataset.font === `'${p.font}'`);
    });
}

function setSliderUI(id, val, labelFn) {
    const el = document.getElementById(id);
    const lbl = document.getElementById(id + 'Val');
    if (el) el.value = val;
    if (lbl) lbl.textContent = labelFn(val);
}

function setToggle(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = val;
}

/* ── Accent color ────────────────────────── */
window.setAccent = function(color, btn, isCustom = false) {
    applyAccent(color);
    _prefs.accent = color;
    scheduleSave();

    // Update swatch active state
    document.querySelectorAll('.swatch[data-color]').forEach(s => s.classList.remove('active'));
    if (btn) btn.classList.add('active');
    else if (!isCustom) {
        const match = document.querySelector(`.swatch[data-color="${color}"]`);
        if (match) match.classList.add('active');
    }
};

function applyAccent(color) {
    const root = document.documentElement;
    root.style.setProperty('--primary', color);

    // Derive glow from color with opacity
    const hex = color.replace('#', '');
    if (hex.length === 6) {
        const r = parseInt(hex.slice(0,2),16);
        const g = parseInt(hex.slice(2,4),16);
        const b = parseInt(hex.slice(4,6),16);
        root.style.setProperty('--primary-glow', `rgba(${r},${g},${b},0.45)`);
    }
}

/* ── Background ──────────────────────────── */
window.setBg = function(style, btn) {
    applyBg(style);
    _prefs.bg = style;
    scheduleSave();
    document.querySelectorAll('.bg-opt').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
};

window.triggerBgUpload = function() {
    document.getElementById('bgImageInput')?.click();
};

window.handleBgUpload = function(input) {
    const file = input.files[0];
    if (!file) return;
    // Compress large images before storing
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => {
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 1280;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            canvas.width  = Math.round(img.width  * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            // Save to prefs so it syncs cross-device
            _prefs.bgImage = dataUrl;
            _prefs.bg = 'custom-img';
            scheduleSave();
            localStorage.setItem('rift_bg_image', dataUrl);
            applyBg('custom-img');
            document.querySelectorAll('.bg-opt').forEach(b => b.classList.remove('active'));
            const customBtn = document.querySelector('.bg-opt[data-bg="custom-img"]');
            if (customBtn) customBtn.classList.add('active');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

function applyBg(style) {
    _bgStyle = style;
    stopDynamicGradient();

    const body  = document.body;
    const canvas = document.getElementById('dashboard-stars-canvas');

    // Reset everything
    body.style.backgroundImage = '';
    body.style.backgroundSize  = '';
    body.style.backgroundPosition = '';
    body.style.backgroundColor = '';
    if (canvas) canvas.style.opacity = '0';

    if (style === 'stars') {
        body.style.backgroundColor = 'var(--bg-dark)';
        if (canvas) canvas.style.opacity = '0.4';

    } else if (style === 'gradient') {
        const c = _prefs.accent || '#7289da';
        body.style.backgroundImage = `
            radial-gradient(ellipse at 0% 0%, ${hexToRgba(c, 0.18)} 0%, transparent 55%),
            radial-gradient(ellipse at 100% 100%, ${hexToRgba(c, 0.12)} 0%, transparent 55%),
            linear-gradient(160deg, #0c0c0e 0%, #141420 100%)`;

    } else if (style === 'dynamic') {
        startDynamicGradient();

    } else if (style === 'mesh') {
        body.style.backgroundImage = `
            radial-gradient(at 40% 20%, hsla(240,60%,20%,0.9) 0px, transparent 50%),
            radial-gradient(at 80% 0%,  hsla(270,50%,15%,0.8) 0px, transparent 50%),
            radial-gradient(at 0% 50%,  hsla(220,70%,10%,0.9) 0px, transparent 50%),
            radial-gradient(at 80% 50%, hsla(200,60%,12%,0.8) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(260,50%,15%,0.9) 0px, transparent 50%),
            radial-gradient(at 80% 100%,hsla(240,40%,10%,0.8) 0px, transparent 50%),
            linear-gradient(135deg, #090910 0%, #0f0f1a 100%)`;

    } else if (style === 'dark') {
        body.style.backgroundColor = '#08080c';
        body.style.backgroundImage = 'none';

    } else if (style === 'custom-img') {
        const img = _prefs.bgImage || localStorage.getItem('rift_bg_image');
        if (img) {
            body.style.backgroundImage = `url(${img})`;
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
        }
    }
}

/* ── Dynamic gradient ────────────────────── */
const _dyn = {
    hue: 220, hue2: 280, hue3: 180,
    spd1: 0.3, spd2: 0.2, spd3: 0.25,
};

function startDynamicGradient() {
    let t = 0;
    function frame() {
        if (_bgStyle !== 'dynamic') return;
        t += 0.4;
        const h1 = (_dyn.hue  + t * _dyn.spd1) % 360;
        const h2 = (_dyn.hue2 + t * _dyn.spd2) % 360;
        const h3 = (_dyn.hue3 + t * _dyn.spd3) % 360;
        document.body.style.backgroundImage = `
            radial-gradient(ellipse at ${50 + Math.sin(t*0.01)*30}% ${30 + Math.cos(t*0.008)*20}%,
                hsla(${h1},60%,18%,0.9) 0%, transparent 55%),
            radial-gradient(ellipse at ${70 + Math.cos(t*0.012)*20}% ${70 + Math.sin(t*0.009)*20}%,
                hsla(${h2},55%,14%,0.8) 0%, transparent 55%),
            radial-gradient(ellipse at ${20 + Math.sin(t*0.007)*25}% ${60 + Math.cos(t*0.011)*20}%,
                hsla(${h3},50%,12%,0.7) 0%, transparent 50%),
            linear-gradient(160deg, #090910 0%, #0d0d1c 100%)`;
        _dynGradientId = requestAnimationFrame(frame);
    }
    _dynGradientId = requestAnimationFrame(frame);
}

function stopDynamicGradient() {
    if (_dynGradientId) {
        cancelAnimationFrame(_dynGradientId);
        _dynGradientId = null;
    }
}

/* ── Sidebar opacity ─────────────────────── */
window.setSidebarOpacity = function(val) {
    applySidebarOpacity(val);
    _prefs.sidebarOpacity = parseInt(val);
    const lbl = document.getElementById('sidebarOpacityVal');
    if (lbl) lbl.textContent = `${val}%`;
    scheduleSave();
};

function applySidebarOpacity(val) {
    document.documentElement.style.setProperty(
        '--sidebar-bg',
        `rgba(20,20,25,${val / 100})`
    );
}

/* ── Glass blur ──────────────────────────── */
window.setGlassBlur = function(val) {
    applyGlassBlur(val);
    _prefs.glassBlur = parseInt(val);
    const lbl = document.getElementById('glassBlurVal');
    if (lbl) lbl.textContent = `${val}px`;
    scheduleSave();
};

function applyGlassBlur(val) {
    document.documentElement.style.setProperty('--glass-blur', `${val}px`);
    // Apply to glass-container
    const gc = document.querySelector('.glass-container');
    if (gc) gc.style.backdropFilter = `blur(${val}px)`;
}

/* ── Font ─────────────────────────────────── */
window.setFont = function(font, btn) {
    applyFont(font);
    _prefs.font = font;
    scheduleSave();
    document.querySelectorAll('.font-opt').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
};

function applyFont(font) {
    const clean = font.replace(/'/g, '');
    const fontId = `gf-${clean.replace(/\s/g,'-')}`;
    if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id   = fontId;
        link.rel  = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(clean)}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
    }
    document.documentElement.style.setProperty('--font-family', font);
    document.body.style.fontFamily = `${font}, sans-serif`;
    // Override font BUT explicitly exclude Font Awesome icon elements
    const style = document.getElementById('rift-font-override') || document.createElement('style');
    style.id = 'rift-font-override';
    style.textContent = `
        *:not(i), button:not(i), input, select, textarea {
            font-family: ${font}, sans-serif !important;
        }
        i[class*="fa-"] {
            font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands" !important;
        }
    `;
    if (!style.parentNode) document.head.appendChild(style);
}

/* ── Font size ───────────────────────────── */
window.setFontSize = function(val) {
    applyFontSize(val);
    _prefs.fontSize = parseInt(val);
    const lbl = document.getElementById('fontSizeVal');
    if (lbl) lbl.textContent = `${val}px`;
    scheduleSave();
};

function applyFontSize(val) {
    document.documentElement.style.fontSize = `${val}px`;
}



/* ── Reset ───────────────────────────────── */
window.resetAllSettings = function() {
    if (!confirm('Reset all settings to defaults?')) return;
    _prefs = { ...DEFAULTS };
    localStorage.removeItem('rift_prefs');
    localStorage.removeItem('rift_bg_image');
    persistPrefs();
    applyAllPrefs();
    renderSettingsUI();
    showSettingsToast('Settings reset to defaults');
};

/* ── Utility ─────────────────────────────── */
function hexToRgba(hex, alpha) {
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2),16);
    const g = parseInt(h.slice(2,4),16);
    const b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function showSettingsToast(msg, type = 'success') {
    let t = document.getElementById('settingsToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'settingsToast';
        t.className = 'settings-toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = `settings-toast ${type} show`;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}



// Apply prefs as soon as this script loads (before initSettings is called)
document.addEventListener('DOMContentLoaded', () => {
    window.applyStoredPrefs?.();
});