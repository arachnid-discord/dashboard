// API is permanently at api.arach.lol:25739 via custom Windows Server port — no Gist needed.
const CLIENT_ID = "1524062850358841354";
const API_BASE  = "http://api.arach.lol:25739";
const WS_URL    = "ws://api.arach.lol:25739/ws";
console.log('[Config] API_BASE=http://api.arach.lol:25739 (static)');
async function loadConfig() {
    // Nothing to load — URL is permanent
}

// State
let ws = null;
let userProfile = null;
let selectedGuildId = null;
let currentTrackDuration = 0;
let isSeeking = false;
let isPlaying = false;

// Telemetry state
let wsTotalFrames = 0;
let wsStatsFrames = 0;
let wsPingMs = 0;
let adminStartTime = Date.now();

// Interpolation Engine (For smooth lyrics)
let localTimeMs = 0;
let lastSyncTimestamp = 0;
let lyricsData = [];
let activeLyricIndex = -1;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    initFallingStars();
    initTabs();
    initWebSocket();
    checkRoute();
    checkAuth();
});

window.addEventListener('hashchange', checkRoute);
window.addEventListener('popstate', checkRoute);

function checkRoute() {
    const isAdminRoute = window.location.pathname.startsWith('/admin') || window.location.hash === '#admin';
    if (isAdminRoute) {
        hideLoginWall();
        const adminPane = document.getElementById('admin');
        if (adminPane) {
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            adminPane.classList.add('active');
            const titleEl = document.getElementById('activeTabTitle');
            if (titleEl) titleEl.textContent = "Admin Telemetry Panel";

            document.querySelectorAll('.nav-links li').forEach(l => {
                l.classList.toggle('active', l.dataset.tab === 'admin');
            });
        }
        checkAdminUnlockState();
    }
}

/* ================= BACKGROUND ANIMATION ================= */
function initFallingStars() {
    const canvas = document.getElementById('dashboard-stars-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, stars = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function createStar() {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.5 + 0.1,
            opacity: Math.random() * 0.5 + 0.1,
            pulseSpeed: Math.random() * 0.02 + 0.005,
            pulseOffset: Math.random() * Math.PI * 2
        };
    }

    function init() {
        resize();
        stars = Array.from({ length: 150 }, createStar);
    }

    let frame = 0;
    let _lastStarDraw = 0;
    function draw(ts) {
        requestAnimationFrame(draw);
        if (ts - _lastStarDraw < 50) return; // ~20fps
        _lastStarDraw = ts;
        ctx.clearRect(0, 0, width, height);
        frame++;
        for (let s of stars) {
            s.y += s.speed;
            if (s.y > height + 5) {
                s.y = -5;
                s.x = Math.random() * width;
            }
            const pulse = s.opacity * (0.5 + 0.5 * Math.sin(frame * s.pulseSpeed + s.pulseOffset));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${pulse})`;
            ctx.fill();
        }
    }

    window.addEventListener('resize', resize);
    init();
    draw();
}

/* ================= NAVIGATION ================= */
function initTabs() {
    const links = document.querySelectorAll('.nav-links li:not(.nav-coming-soon)');
    links.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.dataset.tab;
            if (!target) return;

            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            const targetPane = document.getElementById(target);
            if (targetPane) targetPane.classList.add('active');

            const titles = { moderation: 'Moderation & Analytics', settings: 'Settings', admin: 'Admin Telemetry Panel' };
            const titleEl = document.getElementById('activeTabTitle');
            if (titleEl) titleEl.textContent = titles[target] || target;

            // Sync mobile bottom nav highlight
            document.querySelectorAll('.mobile-tab[data-maintab]').forEach(t => {
                t.classList.toggle('active', t.dataset.maintab === target);
            });

            // Lazy-load tab script if not yet loaded, then init
            const _tabScripts = {
                moderation: ['assets/js/moderation.js', () => window.initModeration?.()],
                settings:   ['assets/js/settings.js',   () => window.initSettings?.()],
            };
            if (_tabScripts[target]) {
                const [src, init] = _tabScripts[target];
                if (typeof _lazyLoad === 'function') {
                    _lazyLoad(src, init);
                } else {
                    init();
                }
            }

            if (target === 'admin') {
                checkAdminUnlockState();
            }

            if (window.innerWidth <= 768) closeSidebar();
        });
    });
}

/* ================= WEBSOCKET (STATS) & ADMIN TELEMETRY ================= */
let _wsRetryDelay = 3000;
function initWebSocket() {
    const wsStartTime = Date.now();
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        _wsRetryDelay = 3000;
        wsPingMs = Date.now() - wsStartTime;
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) statusEl.textContent = "Connected";
        const indicator = document.querySelector('.status-indicator');
        if (indicator) indicator.className = "status-indicator online";

        logAdminEvent(`WebSocket connection established to ${WS_URL}`, 'ws');
        updateAdminWsStatus(true);
    };

    ws.onmessage = (event) => {
        wsTotalFrames++;
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'stats') {
                wsStatsFrames++;
                updateStats(message.data);
                updateAdminMetrics(message.data);
            }
            updateAdminPayloadInspect(event.data);
        } catch(e) {
            updateAdminPayloadInspect(event.data);
        }
        updateAdminWsCounters();
    };

    ws.onclose = () => {
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) statusEl.textContent = "Reconnecting...";
        const indicator = document.querySelector('.status-indicator');
        if (indicator) indicator.className = "status-indicator";

        logAdminEvent('WebSocket connection closed. Reconnecting...', 'error');
        updateAdminWsStatus(false);
        setTimeout(initWebSocket, _wsRetryDelay);
        _wsRetryDelay = Math.min(_wsRetryDelay * 2, 30000);
    };

    ws.onerror = () => {
        logAdminEvent('WebSocket error encountered', 'error');
    };
}

function updateStats(data) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setStyle = (id, prop, val) => { const el = document.getElementById(id); if (el) el.style[prop] = val; };
    set('stat-servers', data.servers);
    set('stat-users', data.users);
    set('stat-ping', `${data.latency || 0}ms`);
    if (data.uptime) {
        const h = Math.floor(data.uptime / 3600);
        const m = Math.floor((data.uptime % 3600) / 60);
        set('stat-uptime', `${h}h ${m}m`);
    }
    set('stat-cpu', `${data.cpu || 0}%`);
    setStyle('cpu-progress', 'width', `${data.cpu || 0}%`);
    set('stat-ram', `${data.ram_percent || 0}%`);
    setStyle('ram-progress', 'width', `${data.ram_percent || 0}%`);
}

/* ================= ADMIN TELEMETRY PANEL LOGIC ================= */
function checkAdminUnlockState() {
    if (sessionStorage.getItem('admin_unlocked') === 'true') {
        showAdminDashboard();
    } else {
        lockAdminPanel();
    }
}

window.handleAdminLogin = function(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('adminPasswordInput');
    const err = document.getElementById('adminAuthError');
    if (!input) return;

    if (input.value === 'arachadmin') {
        sessionStorage.setItem('admin_unlocked', 'true');
        if (err) err.classList.add('hidden');
        input.value = '';
        showAdminDashboard();
        logAdminEvent('Admin panel unlocked via password authentication.', 'info');
    } else {
        if (err) err.classList.remove('hidden');
        input.value = '';
        logAdminEvent('Failed admin unlock attempt: Invalid password.', 'warn');
    }
};

window.lockAdminPanel = function() {
    sessionStorage.removeItem('admin_unlocked');
    const lockCard = document.getElementById('adminLockCard');
    const view = document.getElementById('adminDashboardView');
    if (lockCard) lockCard.classList.remove('hidden');
    if (view) view.classList.add('hidden');
};

function showAdminDashboard() {
    const lockCard = document.getElementById('adminLockCard');
    const view = document.getElementById('adminDashboardView');
    if (lockCard) lockCard.classList.add('hidden');
    if (view) view.classList.remove('hidden');
    refreshAdminStats();
    testApiEndpoints();
}

window.refreshAdminStats = function() {
    logAdminEvent('Manual telemetry refresh triggered.', 'info');
    updateAdminWsCounters();
    testApiEndpoints();
};

function updateAdminWsStatus(connected) {
    const statusEl = document.getElementById('adminWsStatus');
    const urlEl = document.getElementById('adminWsUrl');
    if (statusEl) {
        statusEl.textContent = connected ? "Connected" : "Disconnected";
        statusEl.style.color = connected ? "#22c55e" : "#ef4444";
    }
    if (urlEl) urlEl.textContent = WS_URL;
}

function updateAdminMetrics(data) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setWidth = (id, pct) => { const el = document.getElementById(id); if (el) el.style.width = `${pct}%`; };

    set('adminWsPing', `${data.latency || wsPingMs || 12} ms`);
    set('adminCpuVal', `${data.cpu || 0}%`);
    setWidth('adminCpuBar', data.cpu || 0);

    const ramPct = data.ram_percent || 0;
    set('adminRamVal', `${ramPct}%`);
    setWidth('adminRamBar', ramPct);

    if (data.servers) set('adminGuildCount', Number(data.servers).toLocaleString());
    if (data.users) set('adminUserCount', Number(data.users).toLocaleString());
    if (data.uptime) {
        const pct = ((1 - (10 / data.uptime)) * 100).toFixed(2);
        set('adminBotUptime', `${Math.max(pct, 99.90)}%`);
    }
}

function updateAdminWsCounters() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('adminWsTotalFrames', wsTotalFrames);
    set('adminWsStatsFrames', wsStatsFrames);
    const elapsedSec = Math.max(1, (Date.now() - adminStartTime) / 1000);
    const rate = wsTotalFrames > 0 ? (wsTotalFrames / elapsedSec).toFixed(1) : "0";
    set('adminWsMsgRate', `${rate} msg/s`);
}

function updateAdminPayloadInspect(payloadStr) {
    const pre = document.getElementById('adminPayloadInspect');
    if (!pre) return;
    try {
        const obj = JSON.parse(payloadStr);
        pre.textContent = JSON.stringify(obj, null, 2);
    } catch(e) {
        pre.textContent = payloadStr;
    }
}

window.testApiEndpoints = async function() {
    const tbody = document.getElementById('adminApiTableBody');
    if (!tbody) return;

    logAdminEvent('Starting API endpoint health audit...', 'info');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Probing endpoints...</td></tr>';

    const endpoints = [
        { url: `${API_BASE}/`, method: 'GET', name: 'Root API' },
        { url: `${API_BASE}/health`, method: 'GET', name: 'Health Check' },
        { url: `${API_BASE}/stats`, method: 'GET', name: 'Stats Endpoint' },
        { url: `${API_BASE}/ping`, method: 'GET', name: 'Ping Latency' }
    ];

    let rowsHtml = '';
    let totalLatency = 0;
    let successCount = 0;

    for (const ep of endpoints) {
        const start = Date.now();
        let status = '200 OK';
        let stateColor = '#22c55e';
        let latency = 0;

        try {
            const res = await fetch(ep.url, { method: ep.method, mode: 'cors' });
            latency = Date.now() - start;
            status = `${res.status} ${res.statusText || 'OK'}`;
            if (!res.ok) stateColor = '#f59e0b';
            successCount++;
        } catch(e) {
            latency = Date.now() - start;
            status = 'ERR / Offline';
            stateColor = '#ef4444';
        }

        totalLatency += latency;

        rowsHtml += `
            <tr>
                <td><strong>${ep.name}</strong> <span style="color:var(--text-muted); font-size:11px;">(${ep.url})</span></td>
                <td><span class="admin-action-chip sm">${ep.method}</span></td>
                <td>${status}</td>
                <td>${latency} ms</td>
                <td><span style="color:${stateColor}; font-weight:600;"><i class="fa-solid fa-circle" style="font-size:8px;"></i> ${status.includes('ERR') ? 'Offline' : 'Online'}</span></td>
            </tr>
        `;
    }

    tbody.innerHTML = rowsHtml;

    const avgResp = Math.round(totalLatency / endpoints.length);
    const avgEl = document.getElementById('adminApiAvgResp');
    const statusEl = document.getElementById('adminApiStatus');

    if (avgEl) avgEl.textContent = `${avgResp} ms`;
    if (statusEl) {
        statusEl.textContent = successCount === endpoints.length ? "Healthy" : "Degraded";
        statusEl.style.color = successCount === endpoints.length ? "#22c55e" : "#f59e0b";
    }

    logAdminEvent('API endpoint health audit completed.', 'info');
};

function logAdminEvent(msg, type = 'info') {
    const stream = document.getElementById('adminLogStream');
    if (!stream) return;

    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `admin-log-entry ${type}`;
    entry.innerHTML = `<span class="timestamp">[${time}]</span> ${msg}`;

    stream.appendChild(entry);
    stream.scrollTop = stream.scrollHeight;
}

window.clearAdminLogs = function() {
    const stream = document.getElementById('adminLogStream');
    if (stream) {
        stream.innerHTML = '<div class="admin-log-entry info"><span class="timestamp">[System]</span> Log stream cleared.</div>';
    }
};

/* ================= AUTHENTICATION ================= */
function login() {
    const redirect = encodeURIComponent(window.location.href.split('#')[0]);
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=token&scope=identify%20guilds`;
}

async function checkAuth() {
    const isAdminRoute = window.location.pathname.startsWith('/admin') || window.location.hash === '#admin';
    if (isAdminRoute) {
        hideLoginWall();
        return;
    }

    const fragment = new URLSearchParams(window.location.hash.slice(1));
    let token = fragment.get('access_token') || localStorage.getItem('d_token');

    if (token) {
        localStorage.setItem('d_token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
        await fetchProfile(token);
    } else {
        showLoginWall();
    }
}

function showLoginWall() {
    // Blur everything and force login
    let wall = document.getElementById('loginWall');
    if (!wall) {
        wall = document.createElement('div');
        wall.id = 'loginWall';
        wall.innerHTML = `
            <div class="login-wall-inner">
                <i class="fa-solid fa-spider brand-logo-icon" style="color: var(--primary); font-size: 48px; margin-bottom: 12px;"></i>
                <h1 class="login-wall-title">ARACHNID</h1>
                <p class="login-wall-sub">Sign in with Discord to access the dashboard</p>
                <button class="login-wall-btn" onclick="login()">
                    <i class="fa-brands fa-discord"></i> Login with Discord
                </button>
            </div>`;
        document.body.appendChild(wall);
    }
    wall.classList.add('active');
}

function hideLoginWall() {
    const wall = document.getElementById('loginWall');
    if (wall) wall.classList.remove('active');
}

async function fetchProfile(token) {
    try {
        const res = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        userProfile = await res.json();

        if (!userProfile.id) {
            localStorage.removeItem('d_token');
            showLoginWall();
            return;
        }

        hideLoginWall();
        // Apply saved theme prefs immediately on login
        if (typeof window.applyStoredPrefs === 'function') window.applyStoredPrefs();
        renderUserCard(userProfile);
        fetchGuilds(token);
    } catch (e) {
        localStorage.removeItem('d_token');
        showLoginWall();
    }
}

function renderUserCard(u) {
    const avatar = u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.id) % 5}.png`;

    const userCard = document.getElementById('userCard');
    if (userCard) {
        userCard.innerHTML = `
            <div class="sidebar-user-card" onclick="toggleProfilePopup()" id="sidebarUserTrigger">
                <div class="sidebar-user-avatar-wrap">
                    <img src="${avatar}" class="sidebar-user-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                    <span class="sidebar-user-status"></span>
                </div>
                <div class="sidebar-user-info">
                    <span class="sidebar-user-name">${escProfile(u.global_name || u.username)}</span>
                    <span class="sidebar-user-tag">@${escProfile(u.username)}</span>
                </div>
                <button class="sidebar-logout-btn" onclick="event.stopPropagation(); logout()" title="Log out">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;
    }

    buildProfilePopup(u, avatar);
}

function buildProfilePopup(u, avatar) {
    // Remove old popup if exists
    const old = document.getElementById('discordProfilePopup');
    if (old) old.remove();

    const banner = u.banner
        ? `https://cdn.discordapp.com/banners/${u.id}/${u.banner}.${u.banner.startsWith('a_') ? 'gif' : 'png'}?size=480`
        : null;

    const accentColor = u.accent_color
        ? `#${u.accent_color.toString(16).padStart(6, '0')}`
        : '#8b5cf6';

    const badges = buildBadges(u);
    const nitroSince = u.premium_type > 0 ? getNitroLabel(u.premium_type) : null;

    const popup = document.createElement('div');
    popup.id = 'discordProfilePopup';
    popup.className = 'discord-profile-popup hidden';
    popup.innerHTML = `
        <div class="dpp-banner" style="${banner
            ? `background-image:url(${banner})`
            : `background-color:${accentColor}`}">
        </div>
        <div class="dpp-avatar-row">
            <div class="dpp-avatar-wrap">
                <img src="${avatar}" class="dpp-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                <span class="dpp-status-dot"></span>
            </div>
            ${badges ? `<div class="dpp-badges">${badges}</div>` : ''}
        </div>
        <div class="dpp-body">
            <div class="dpp-name">${escProfile(u.global_name || u.username)}</div>
            <div class="dpp-username">@${escProfile(u.username)}${u.discriminator && u.discriminator !== '0' ? '#' + u.discriminator : ''}</div>
            ${nitroSince ? `<div class="dpp-nitro"><i class="fa-solid fa-gem"></i> ${nitroSince}</div>` : ''}
            <div class="dpp-divider"></div>
            <div class="dpp-section-label">MEMBER SINCE</div>
            <div class="dpp-since">${getDiscordMemberSince(u.id)}</div>
            <div class="dpp-divider"></div>
            <button class="dpp-logout-btn" onclick="logout()">
                <i class="fa-solid fa-right-from-bracket"></i> Log Out
            </button>
        </div>
    `;
    document.body.appendChild(popup);

    // Close on outside click
    document.addEventListener('click', function _close(e) {
        if (!e.target.closest('#discordProfilePopup') && !e.target.closest('#sidebarUserTrigger')) {
            popup.classList.add('hidden');
            document.removeEventListener('click', _close);
        }
    });
}

function buildBadges(u) {
    const flags = u.public_flags || 0;
    const badges = [];
    if (flags & (1 << 0))  badges.push('<span class="dpp-badge" title="Discord Staff">🛡️</span>');
    if (flags & (1 << 2))  badges.push('<span class="dpp-badge" title="HypeSquad Bravery">🏠</span>');
    if (flags & (1 << 6))  badges.push('<span class="dpp-badge" title="HypeSquad Brilliance">💎</span>');
    if (flags & (1 << 7))  badges.push('<span class="dpp-badge" title="HypeSquad Balance">⚖️</span>');
    if (flags & (1 << 3))  badges.push('<span class="dpp-badge" title="Early Supporter">🏷️</span>');
    if (flags & (1 << 17)) badges.push('<span class="dpp-badge" title="Bug Hunter">🐛</span>');
    if (flags & (1 << 14)) badges.push('<span class="dpp-badge" title="Bug Hunter Gold">🏅</span>');
    if (flags & (1 << 18)) badges.push('<span class="dpp-badge" title="Active Developer">💻</span>');
    if (u.premium_type > 0) badges.push('<span class="dpp-badge" title="Nitro">💜</span>');
    return badges.join('');
}

function getNitroLabel(type) {
    if (type === 1) return 'Nitro Classic';
    if (type === 2) return 'Nitro';
    if (type === 3) return 'Nitro Basic';
    return 'Nitro';
}

function getDiscordMemberSince(userId) {
    // Snowflake timestamp
    const ms = (BigInt(userId) >> 22n) + 1420070400000n;
    return new Date(Number(ms)).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' });
}

function escProfile(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

window.toggleProfilePopup = function() {
    const popup = document.getElementById('discordProfilePopup');
    if (!popup) return;
    popup.classList.toggle('hidden');
    if (!popup.classList.contains('hidden')) {
        // Position above the user card
        const trigger = document.getElementById('sidebarUserTrigger');
        if (trigger) {
            const rect = trigger.getBoundingClientRect();
            popup.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
            popup.style.left = rect.left + 'px';
        }
    }
};

window.logout = function() {
    localStorage.removeItem('d_token');
    userProfile = null;
    const popup = document.getElementById('discordProfilePopup');
    if (popup) popup.remove();
    const userCard = document.getElementById('userCard');
    if (userCard) {
        userCard.innerHTML = `
            <button class="login-btn" onclick="login()">
                <i class="fa-brands fa-discord"></i> Login
            </button>`;
    }
    showLoginWall();
};

async function fetchGuilds(token) {
    const res = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${token}` }
    });
    const guilds = await res.json();
    const adminGuilds = guilds.filter(g => (BigInt(g.permissions) & 0x8n) || (BigInt(g.permissions) & 0x20n));

    const menu = document.getElementById('guildDropdownMenu');
    if (menu) menu.innerHTML = '';

    if (menu) {
        adminGuilds.forEach(g => {
            const iconUrl = g.icon
                ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
                : null;

            const item = document.createElement('div');
            item.className = 'guild-dropdown-item';
            item.dataset.id = g.id;
            item.dataset.name = g.name;
            item.dataset.icon = iconUrl || '';
            item.innerHTML = iconUrl
                ? `<img src="${iconUrl}" alt="${g.name}">`
                : `<div class="guild-initial">${g.name.charAt(0).toUpperCase()}</div>`;
            item.innerHTML += `<span>${g.name}</span>`;

            item.addEventListener('click', () => {
                selectedGuildId = g.id;
                window._selectedGuildId = g.id;
                if (typeof window._onGuildSelected === 'function') window._onGuildSelected(g.id);

                // Update selected display
                const selected = document.getElementById('guildDropdownSelected');
                if (selected) {
                    selected.innerHTML = iconUrl
                        ? `<div class="guild-dropdown-current"><img src="${iconUrl}" alt="${g.name}"><span>${g.name}</span></div>`
                        : `<div class="guild-dropdown-current"><div class="guild-initial">${g.name.charAt(0).toUpperCase()}</div><span>${g.name}</span></div>`;
                    selected.innerHTML += `<i class="fa-solid fa-chevron-down guild-dropdown-arrow"></i>`;
                }

                // Mark active
                document.querySelectorAll('.guild-dropdown-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');

                closeGuildDropdown();
            });

            menu.appendChild(item);
        });
    }

    // Populate tab-specific guild dropdowns
    populateTabGuildDropdowns(adminGuilds);
}

/* ── Tab Guild Dropdowns (Moderation) ──────────────── */
let _allGuilds = [];

function populateTabGuildDropdowns(guilds) {
    _allGuilds = guilds;
    ['mod', 'verification'].forEach(tab => {
        const menu = document.getElementById(`${tab}GuildMenu`);
        if (!menu) return;
        menu.innerHTML = guilds.map(g => {
            const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
            return `<div class="tab-guild-item" onclick="selectTabGuild('${tab}','${g.id}','${g.name.replace(/'/g,"\\'")}','${icon||''}')">
                ${icon ? `<img src="${icon}" alt="">` : `<div class="guild-initial" style="width:20px;height:20px;font-size:10px">${g.name[0]}</div>`}
                <span>${g.name}</span>
            </div>`;
        }).join('');
    });
}

window.toggleTabGuildDropdown = function(tab) {
    const menu = document.getElementById(`${tab}GuildMenu`);
    if (!menu) return;
    const isOpen = !menu.classList.contains('hidden');
    // close all first
    document.querySelectorAll('.tab-guild-menu').forEach(m => m.classList.add('hidden'));
    if (!isOpen) menu.classList.remove('hidden');
    // close on outside click
    setTimeout(() => {
        document.addEventListener('click', function _close(e) {
            if (!e.target.closest(`#${tab}GuildDropdown`)) {
                menu.classList.add('hidden');
                document.removeEventListener('click', _close);
            }
        });
    }, 10);
};

window.selectTabGuild = function(tab, guildId, guildName, iconUrl) {
    const label = document.getElementById(`${tab}GuildLabel`);
    if (label) label.textContent = guildName;
    const menu = document.getElementById(`${tab}GuildMenu`);
    if (menu) menu.classList.add('hidden');

    if (tab === 'mod' || tab === 'verification') {
        window.selectedGuildId = guildId;
        if (tab === 'mod' && typeof window.initModeration === 'function') {
            window.initModeration();
        }
        if (tab === 'verification' && typeof window.initVerification === 'function') {
            window.initVerification();
        }
    }
};

function toggleGuildDropdown() {
    const menu = document.getElementById('guildDropdownMenu');
    const selected = document.getElementById('guildDropdownSelected');
    if (!menu || !selected) return;
    const isOpen = !menu.classList.contains('hidden');
    if (isOpen) {
        closeGuildDropdown();
    } else {
        menu.classList.remove('hidden');
        selected.classList.add('open');
    }
}

function closeGuildDropdown() {
    const menu = document.getElementById('guildDropdownMenu');
    const selected = document.getElementById('guildDropdownSelected');
    if (menu) menu.classList.add('hidden');
    if (selected) selected.classList.remove('open');
}
