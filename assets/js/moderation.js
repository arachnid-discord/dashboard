/* ═══════════════════════════════════════════
   RIFT DASHBOARD — MODERATION MODULE
═══════════════════════════════════════════ */

/* ── State ───────────────────────────────── */
let modGuildId        = null;
let modCurrentUser    = null;   // looked-up user object
let modActionTarget   = null;   // same ref, used for action modal
let modPendingAction  = null;   // string: 'ban','kick', etc.
let modActivityChart  = null;
let modLogPage        = 0;
let modLogTotal       = 0;
let modLogPageSize    = 25;
let modLogTypeFilter  = '';
let modLogUserFilter  = '';
let modLogDebounce    = null;
let modAllBans        = [];
let modRoles          = [];
let modInitDone       = false;

/* ── Init ─────────────────────────────────── */
window.initModeration = async function() {
    const newGuildId = window._selectedGuildId || window.selectedGuildId || modGuildId || null;
    if (!API_BASE) return;
    if (!newGuildId) { showModHint('Select a server using the dropdown above.'); return; }

    // Skip full re-init if same guild already loaded
    if (modInitDone && newGuildId === modGuildId) return;
    modGuildId = newGuildId;

    // Stagger: load critical data first, then secondary data
    await Promise.all([loadModStats(), loadModLog()]);
    // Ban list and roles are cacheable and less urgent — load after
    loadBanList();
    loadRoles();
    loadServerAnalytics();
    modInitDone = true;
};

function showModHint(msg) {
    const el = document.getElementById('modStatsRow');
    if (el) el.innerHTML = `<div class="mod-hint">${msg}</div>`;
}

/* ── Stats & Activity Chart ──────────────── */
async function loadModStats() {
    if (!API_BASE || !modGuildId) return;
    const cacheKey = `modStats:${modGuildId}`;
    if (typeof _cache !== 'undefined') {
        const cached = _cache.get(cacheKey);
        if (cached) { _renderModStats(cached); return; }
    }
    try {
        const _tok = localStorage.getItem('d_token') || '';
        const res = await fetch(`${API_BASE}/mod/stats/${modGuildId}`, {
            headers: { 'ngrok-skip-browser-warning': 'true', 'Authorization': `Bearer ${_tok}` }
        });
        const data = await res.json();
        if (data.error) return;
        if (typeof _cache !== 'undefined') _cache.set(cacheKey, data, 120000); // 2 min
        _renderModStats(data);
    } catch(e) { console.error('[Mod] stats error:', e); }
}

function _renderModStats(data) {
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val ?? '0'; };
    set('modTotalCases',    data.total);
    set('modTotalWarns',    data.by_action?.warn    || 0);
    set('modTotalBans',     data.by_action?.ban     || 0);
    set('modTotalTimeouts', data.by_action?.timeout || 0);
    set('modTotalKicks',    data.by_action?.kick    || 0);
    const topEl = document.getElementById('modTopMods');
    if (topEl && data.top_mods?.length) {
        topEl.innerHTML = data.top_mods.map((m, i) => `
            <div class="mod-top-mod-row">
                <span class="lb-rank">${['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
                <img class="lb-avatar" src="${m.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}"
                     onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                <span class="mod-top-mod-name">${escMod(m.name)}</span>
                <span class="mod-top-mod-count">${m.count} actions</span>
            </div>`).join('');
    } else if (topEl) {
        topEl.innerHTML = '<div class="mod-empty">No moderator data yet</div>';
    }
    renderModActivityChart(data.activity_7d || {});
}

function renderModActivityChart(buckets) {
    const ctx = document.getElementById('modActivityChart');
    if (!ctx) return;

    // Days in order Mon→Sun with today last
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const today = new Date().toLocaleDateString('en', {weekday:'short'});
    const todayIdx = days.indexOf(today);
    const ordered = [...days.slice(todayIdx + 1), ...days.slice(0, todayIdx + 1)];
    const values  = ordered.map(d => buckets[d] || 0);
    const maxVal  = Math.max(...values, 1);

    if (modActivityChart) modActivityChart.destroy();
    modActivityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ordered,
            datasets: [{
                data: values,
                backgroundColor: ordered.map((d, i) =>
                    i === ordered.length - 1
                        ? 'rgba(114,137,218,0.9)'
                        : 'rgba(114,137,218,0.35)'),
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            animation: { duration: 400 },
            plugins: { legend: { display: false },
                tooltip: { backgroundColor: 'rgba(14,14,18,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }},
            scales: {
                x: { grid: { display: false }, ticks: { color: '#a0a0a8' } },
                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#a0a0a8', stepSize: 1 },
                     min: 0, max: maxVal + 1 }
            }
        }
    });
}

/* ── User Lookup ─────────────────────────── */
let autocompleteDebounce = null;

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('modUserInput');
    if (!input) return;
    input.addEventListener('input', e => {
        clearTimeout(autocompleteDebounce);
        const q = e.target.value.trim();
        if (!q) { hideAutocomplete(); return; }
        autocompleteDebounce = setTimeout(() => fetchAutocomplete(q), 300);
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { hideAutocomplete(); lookupUser(); }
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.mod-search-wrap')) hideAutocomplete();
    });
});

async function fetchAutocomplete(q) {
    modGuildId = modGuildId || window._selectedGuildId || window.selectedGuildId || null;
    if (!API_BASE || !modGuildId) return;
    try {
        const res = await fetch(`${API_BASE}/mod/members/${modGuildId}?q=${encodeURIComponent(q)}`, {
            headers: { 'ngrok-skip-browser-warning': 'true', 'Authorization': `Bearer ${localStorage.getItem('d_token') || ''}` }
        });
        const data = await res.json();
        showAutocomplete(data.members || []);
    } catch(e) {}
}

function showAutocomplete(members) {
    const box = document.getElementById('modAutocomplete');
    if (!box) return;
    if (!members.length) { box.classList.add('hidden'); return; }
    box.innerHTML = members.map(m => `
        <div class="mod-ac-item" onclick="selectAutocomplete('${m.id}','${escMod(m.name)}')">
            <img src="${m.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}"
                 onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
            <div class="mod-ac-info">
                <span class="mod-ac-name">${escMod(m.name)}</span>
                <span class="mod-ac-tag">${escMod(m.username)} · ${m.id}</span>
            </div>
            ${m.timed_out ? '<span class="mod-ac-badge timeout">Timed out</span>' : ''}
            ${m.bot ? '<span class="mod-ac-badge bot">BOT</span>' : ''}
        </div>`).join('');
    box.classList.remove('hidden');
}

function hideAutocomplete() {
    const box = document.getElementById('modAutocomplete');
    if (box) box.classList.add('hidden');
}

window.selectAutocomplete = function(id, name) {
    document.getElementById('modUserInput').value = id;
    hideAutocomplete();
    lookupUser();
};

window.lookupUser = async function() {
    const q = document.getElementById('modUserInput').value.trim();
    if (!q) return;

    // Always grab the freshest guild id
    modGuildId = modGuildId || window._selectedGuildId || window.selectedGuildId || null;

    const profile = document.getElementById('modUserProfile');

    if (!API_BASE) {
        profile.classList.remove('hidden');
        profile.innerHTML = '<div class="mod-error"><i class="fa-solid fa-circle-exclamation"></i> API not connected — check bot is online</div>';
        return;
    }
    if (!modGuildId) {
        profile.classList.remove('hidden');
        profile.innerHTML = '<div class="mod-error"><i class="fa-solid fa-circle-exclamation"></i> No server selected — go to Music tab and pick a server first</div>';
        return;
    }

    // Show spinner without destroying child elements
    profile.classList.remove('hidden');
    const spinner = document.createElement('div');
    spinner.id = 'modLookupSpinner';
    spinner.className = 'mod-loading';
    spinner.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Looking up...';
    // Insert spinner at top, hide the real content
    const existingContent = profile.querySelector('.mod-user-header');
    if (existingContent) existingContent.style.display = 'none';
    profile.prepend(spinner);

    try {
        const res = await fetch(`${API_BASE}/mod/user/${modGuildId}?q=${encodeURIComponent(q)}`, {
            headers: { 'ngrok-skip-browser-warning': 'true', 'Authorization': `Bearer ${localStorage.getItem('d_token') || ''}` }
        });
        const data = await res.json();
        if (data.error) {
            profile.innerHTML = `<div class="mod-error"><i class="fa-solid fa-circle-exclamation"></i> ${escMod(data.error)}</div>`;
            return;
        }
        modCurrentUser = data;
        modActionTarget = data.user;
        // Remove spinner, restore content
        const spinner = document.getElementById('modLookupSpinner');
        if (spinner) spinner.remove();
        const existingContent = profile.querySelector('.mod-user-header');
        if (existingContent) existingContent.style.display = '';
        renderUserProfile(data);
        updateActionTarget(data.user);
    } catch(e) {
        console.error('[Mod] lookupUser error:', e);
        const spinner = document.getElementById('modLookupSpinner');
        if (spinner) spinner.remove();
        profile.classList.remove('hidden');
        // Show error without destroying the DOM structure
        let errEl = document.getElementById('modLookupError');
        if (!errEl) {
            errEl = document.createElement('div');
            errEl.id = 'modLookupError';
            errEl.className = 'mod-error';
            profile.prepend(errEl);
        }
        errEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${e.message || 'Network error — is the bot online?'}`;
        setTimeout(() => errEl?.remove(), 4000);
    }
};

function renderUserProfile(data) {
    const u = data.user;
    const profile = document.getElementById('modUserProfile');
    profile.classList.remove('hidden');

    // Avatar
    const avatarEl = document.getElementById('modUserAvatar');
    if (avatarEl) avatarEl.src = u.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';

    const displayEl = document.getElementById('modUserDisplay');
    if (displayEl) displayEl.textContent = u.name;

    const tagEl = document.getElementById('modUserTag');
    if (tagEl) tagEl.textContent = `@${u.username}`;

    const idEl = document.getElementById('modUserId');
    if (idEl) idEl.textContent = u.id;

    // Badges
    const badgesEl = document.getElementById('modUserBadges');
    if (badgesEl) {
        badgesEl.innerHTML = '';
        if (u.is_banned)      badgesEl.innerHTML += '<span class="mod-badge banned">BANNED</span>';
        if (u.timed_out)      badgesEl.innerHTML += '<span class="mod-badge timed-out">TIMED OUT</span>';
        if (!u.in_guild)      badgesEl.innerHTML += '<span class="mod-badge not-in">NOT IN SERVER</span>';
        if (u.bot)            badgesEl.innerHTML += '<span class="mod-badge bot">BOT</span>';
        if (data.warn_count > 0) badgesEl.innerHTML += `<span class="mod-badge warns">${data.warn_count} WARN${data.warn_count !== 1 ? 'S':''}</span>`;
    }

    // Dates
    const datesEl = document.getElementById('modUserDates');
    if (datesEl) {
        const created = u.created_at ? new Date(u.created_at * 1000).toLocaleDateString('en', {day:'numeric', month:'short', year:'numeric'}) : '?';
        const joined  = u.joined_at  ? new Date(u.joined_at  * 1000).toLocaleDateString('en', {day:'numeric', month:'short', year:'numeric'}) : 'Not in server';
        datesEl.innerHTML = `<span><i class="fa-brands fa-discord"></i> Created ${created}</span><span><i class="fa-solid fa-door-open"></i> Joined ${joined}</span>`;
    }

    // Roles
    const rolesEl = document.getElementById('modUserRoles');
    if (rolesEl) {
        if (data.roles?.length) {
            rolesEl.innerHTML = data.roles.slice(0, 12).map(r =>
                `<span class="mod-role-chip" style="border-color:${r.color === '#000000' ? '#555' : r.color}">${escMod(r.name)}</span>`
            ).join('') + (data.roles.length > 12 ? `<span class="mod-role-chip muted">+${data.roles.length - 12} more</span>` : '');
        } else {
            rolesEl.innerHTML = '<span class="mod-role-chip muted">No roles</span>';
        }
    }

    // Tab counts
    const warnCount = document.getElementById('modWarnCount');
    const noteCount = document.getElementById('modNoteCount');
    if (warnCount) warnCount.textContent = data.warn_count || '';
    if (noteCount) noteCount.textContent = data.notes?.length || '';

    renderWarns(data.warnings || []);
    renderHistory(data.history || []);
    renderNotes(data.notes || []);
    switchUserTab('warns', document.querySelector('.mod-user-tab[data-panel="warns"]'));
}

function renderWarns(warns) {
    const el = document.getElementById('modWarnsList');
    if (!warns.length) { el.innerHTML = '<div class="mod-empty">No warnings</div>'; return; }
    el.innerHTML = warns.map(w => `
        <div class="mod-warn-row">
            <div class="mod-warn-info">
                <span class="mod-warn-reason">${escMod(w.reason)}</span>
                <span class="mod-warn-meta">by ${escMod(w.moderator?.name || '?')} · ${fmtTime(w.timestamp)} · ID: ${w.id}</span>
            </div>
            <button class="mod-warn-del" onclick="deleteWarn('${w.id}')" title="Delete warning">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>`).join('');
}

function renderHistory(history) {
    const el = document.getElementById('modHistoryList');
    if (!history.length) { el.innerHTML = '<div class="mod-empty">No mod history</div>'; return; }
    el.innerHTML = history.map(h => `
        <div class="mod-history-row">
            <span class="mod-action-chip ${h.action}">${actionIcon(h.action)} ${h.action}</span>
            <div class="mod-history-info">
                <span class="mod-history-reason">${escMod(h.reason)}</span>
                <span class="mod-history-meta">by ${escMod(h.moderator?.name || '?')} · ${fmtTime(h.timestamp)}</span>
            </div>
        </div>`).join('');
}

function renderNotes(notes) {
    const el = document.getElementById('modNotesList');
    if (!notes.length) { el.innerHTML = '<div class="mod-empty">No notes</div>'; return; }
    el.innerHTML = notes.map(n => `
        <div class="mod-note-row">
            <i class="fa-solid fa-note-sticky"></i>
            <div class="mod-note-info">
                <span class="mod-note-text">${escMod(n.reason)}</span>
                <span class="mod-note-meta">by ${escMod(n.moderator?.name || '?')} · ${fmtTime(n.timestamp)}</span>
            </div>
        </div>`).join('');
}

window.switchUserTab = function(panel, btn) {
    document.querySelectorAll('.mod-user-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.mod-user-panel').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(`modUserPanel${capitalize(panel)}`);
    if (el) el.classList.add('active');
};

window.deleteWarn = async function(warnId) {
    if (!confirm('Delete this warning?')) return;
    if (!modCurrentUser || !API_BASE) return;
    const res = await modApiAction('delwarn', modActionTarget.id, '', {}, {warn_id: warnId});
    if (res?.status === 'removed') {
        showModToast('Warning deleted', 'success');
        await relookupCurrentUser();
    } else {
        showModToast('Could not delete warning', 'error');
    }
};

window.addNote = async function() {
    const input = document.getElementById('modNoteInput');
    const note = input?.value.trim();
    if (!note || !modActionTarget) return;
    const res = await modApiAction('note', modActionTarget.id, note, {}, {note});
    if (res?.status === 'note_added') {
        input.value = '';
        showModToast('Note added', 'success');
        await relookupCurrentUser();
    }
};

async function relookupCurrentUser() {
    if (!modActionTarget) return;
    const q = modActionTarget.id;
    const res = await fetch(`${API_BASE}/mod/user/${modGuildId}?q=${q}`, {
        headers: {'ngrok-skip-browser-warning':'true', 'Authorization': `Bearer ${localStorage.getItem('d_token') || ''}`}
    });
    const data = await res.json();
    if (!data.error) {
        modCurrentUser = data;
        renderUserProfile(data);
    }
}

function updateActionTarget(user) {
    const el = document.getElementById('modActionTarget');
    if (!el) return;
    el.innerHTML = user
        ? `<img src="${user.avatar || ''}" onerror="this.style.display='none'">
           <span>${escMod(user.name)}</span>
           <span class="mod-target-id">${user.id}</span>`
        : 'No user selected';
}

/* ── Action Modal ────────────────────────── */
window.openActionModal = function(action) {
    if (!modActionTarget && !['ban','unban'].includes(action)) {
        showModToast('Look up a user first', 'error');
        return;
    }
    modPendingAction = action;
    const overlay = document.getElementById('modModalOverlay');
    overlay.classList.remove('hidden');

    const titles = {
        ban: '🔨 Ban User', kick: '👟 Kick User', warn: '⚠️ Warn User',
        timeout: '⏰ Timeout User', unban: '🔓 Unban User',
        untimeout: '↩️ Remove Timeout', role_add: '➕ Add Role',
        role_remove: '➖ Remove Role', nick: '✏️ Change Nickname',
        clearwarns: '🧹 Clear All Warnings',
        forcenick: '🔒 Force Nickname',
        forcenick_reset: '🔓 Release Force Nickname',
    };
    document.getElementById('modModalTitle').textContent = titles[action] || action;

    // Target display
    const tEl = document.getElementById('modModalTarget');
    if (modActionTarget) {
        tEl.innerHTML = `<img src="${modActionTarget.avatar || ''}" onerror="this.style.display='none'">
            <strong>${escMod(modActionTarget.name)}</strong>
            <span class="mod-target-id">${modActionTarget.id}</span>`;
    } else {
        tEl.innerHTML = '<span class="mod-hint-inline">Enter a user ID below</span>';
    }

    // Extra fields
    const fields = document.getElementById('modModalFields');
    fields.innerHTML = '';

    if (!modActionTarget) {
        fields.innerHTML += `<input type="text" id="modModalUserInput" placeholder="User ID or mention..." class="mod-modal-field-input">`;
    }

    if (action === 'timeout') {
        fields.innerHTML += `
            <label class="mod-modal-field-label">Duration</label>
            <div class="mod-duration-btns">
                <button class="mod-dur-btn" onclick="setDur('5m')">5m</button>
                <button class="mod-dur-btn" onclick="setDur('10m')">10m</button>
                <button class="mod-dur-btn" onclick="setDur('30m')">30m</button>
                <button class="mod-dur-btn" onclick="setDur('1h')">1h</button>
                <button class="mod-dur-btn" onclick="setDur('6h')">6h</button>
                <button class="mod-dur-btn" onclick="setDur('12h')">12h</button>
                <button class="mod-dur-btn" onclick="setDur('1d')">1d</button>
                <button class="mod-dur-btn" onclick="setDur('7d')">7d</button>
            </div>
            <input type="text" id="modModalDuration" value="1h" placeholder="e.g. 1h, 30m, 7d" class="mod-modal-field-input">`;
    }

    if (action === 'ban') {
        fields.innerHTML += `
            <label class="mod-modal-field-label">Delete message history</label>
            <div class="mod-duration-btns">
                <button class="mod-dur-btn active" id="delDays0" onclick="setDelDays(0)">None</button>
                <button class="mod-dur-btn" id="delDays1" onclick="setDelDays(1)">1 day</button>
                <button class="mod-dur-btn" id="delDays3" onclick="setDelDays(3)">3 days</button>
                <button class="mod-dur-btn" id="delDays7" onclick="setDelDays(7)">7 days</button>
            </div>`;
        fields.dataset.delDays = '0';
    }

    if (action === 'nick') {
        fields.innerHTML += `<input type="text" id="modModalNick" placeholder="New nickname (blank to reset)..." class="mod-modal-field-input">`;
    }

    if (action === 'forcenick') {
        fields.innerHTML += `
            <input type="text" id="modModalNick" placeholder="Nickname to lock in place..." class="mod-modal-field-input" maxlength="32">
            <div class="mod-modal-warning" style="margin-top:8px">
                <i class="fa-solid fa-triangle-exclamation"></i>
                This will lock the nickname and strip the user's ability to change it.
                Use <b>Release Nick</b> to undo.
            </div>`;
    }

    if (action === 'forcenick_reset') {
        fields.innerHTML += `
            <div class="mod-modal-warning" style="margin-top:8px;border-color:rgba(67,181,129,0.3);color:#3ba55d">
                <i class="fa-solid fa-circle-info"></i>
                This will remove the forced nickname and restore the user's nickname permissions
                (if they had them before).
            </div>`;
    }

    if (action === 'role_add' || action === 'role_remove') {
        const opts = modRoles.map(r => `<option value="${r.id}">${escMod(r.name)}</option>`).join('');
        fields.innerHTML += `
            <label class="mod-modal-field-label">Role</label>
            <select id="modModalRole" class="mod-modal-field-input">${opts}</select>`;
    }

    if (action === 'clearwarns') {
        const count = modCurrentUser?.warn_count || 0;
        fields.innerHTML += `<div class="mod-modal-warning">This will remove all ${count} warning${count !== 1 ? 's' : ''} permanently.</div>`;
    }

    // Style confirm button
    const confirmBtn = document.getElementById('modModalConfirm');
    const dangerActions = ['ban','kick','clearwarns','forcenick'];
    confirmBtn.className = `mod-modal-confirm ${dangerActions.includes(action) ? 'danger' : ''}`;
    const confirmLabels = {
        forcenick: 'Lock Nickname',
        forcenick_reset: 'Release Nickname',
        clearwarns: 'Clear Warnings',
    };
    confirmBtn.textContent = confirmLabels[action] || titles[action]?.split(' ').slice(1).join(' ') || 'Confirm';

    document.getElementById('modModalResult').classList.add('hidden');
    document.getElementById('modModalReason').value = '';
};

window.setDur = function(val) {
    document.getElementById('modModalDuration').value = val;
    document.querySelectorAll('.mod-dur-btn').forEach(b => {
        b.classList.toggle('active', b.textContent === val);
    });
};

window.setDelDays = function(days) {
    document.getElementById('modModalFields').dataset.delDays = days;
    document.querySelectorAll('[id^="delDays"]').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`delDays${days}`);
    if (btn) btn.classList.add('active');
};

window.closeActionModal = function() {
    document.getElementById('modModalOverlay').classList.add('hidden');
    modPendingAction = null;
};

window.confirmAction = async function() {
    const action = modPendingAction;
    if (!action) return;

    // Refresh modGuildId from whichever source is current
    modGuildId = window._modGuildId || window._selectedGuildId || window.selectedGuildId || modGuildId;
    if (!modGuildId) { showModalResult('error', 'Select a server first'); return; }

    // Resolve target
    let targetId = modActionTarget?.id;
    const manualInput = document.getElementById('modModalUserInput');
    if (manualInput && manualInput.value.trim()) {
        targetId = manualInput.value.trim().replace(/[<@!>]/g, '');
    }
    if (!targetId) { showModalResult('error', 'No target specified'); return; }

    const reason   = document.getElementById('modModalReason').value.trim() || 'No reason provided';
    const duration = document.getElementById('modModalDuration')?.value || '1h';
    const roleId   = document.getElementById('modModalRole')?.value || '';
    const nick     = document.getElementById('modModalNick')?.value || '';
    const delDays  = parseInt(document.getElementById('modModalFields')?.dataset?.delDays || '0');

    // Validate forcenick has a nickname
    if (action === 'forcenick' && !nick.trim()) {
        showModalResult('error', 'Enter a nickname to lock');
        return;
    }

    const confirmBtn = document.getElementById('modModalConfirm');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    const extra = {};
    if (roleId) extra.role_id = roleId;
    if (nick !== undefined) extra.nick = nick;
    if (delDays) extra.delete_days = delDays;

    const res = await modApiAction(action, targetId, reason, {duration}, extra);

    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm';

    if (!res || res.error) {
        showModalResult('error', res?.error || 'Network error');
        return;
    }

    const successMsgs = {
        ban: `✓ Banned ${res.user || targetId}`,
        unban: '✓ Unbanned',
        kick: `✓ Kicked ${res.user || targetId}`,
        warn: `✓ Warned — now has ${res.total_warns} warning(s)`,
        timeout: `✓ Timed out until ${res.until ? new Date(res.until*1000).toLocaleString() : '?'}`,
        untimeout: '✓ Timeout removed',
        role_add: `✓ Added role: ${res.role}`,
        role_remove: `✓ Removed role: ${res.role}`,
        nick: '✓ Nickname updated',
        clearwarns: '✓ All warnings cleared',
        delwarn: '✓ Warning deleted',
        forcenick: `✓ Nickname locked to "${nick}"`,
        forcenick_reset: '✓ Force-nick released',
    };
    showModalResult('success', successMsgs[action] || '✓ Done');

    // Refresh relevant parts
    setTimeout(async () => {
        closeActionModal();
        await Promise.all([loadModLog(), loadModStats()]);
        if (modCurrentUser) await relookupCurrentUser();
        if (action === 'ban' || action === 'unban') await loadBanList();
    }, 1500);
};

function showModalResult(type, msg) {
    const el = document.getElementById('modModalResult');
    el.textContent = msg;
    el.className = `mod-modal-result ${type}`;
    el.classList.remove('hidden');
}

/* ── Shared API call ─────────────────────── */
async function modApiAction(action, targetId, reason, opts = {}, extra = {}) {
    modGuildId = window._modGuildId || window._selectedGuildId || window.selectedGuildId || modGuildId;
    if (!API_BASE || !modGuildId) return null;
    try {
        const gid = modGuildId; // keep as string — server does int() which handles it fine
        if (!gid) return { error: 'No server selected' };
        const token = localStorage.getItem('d_token') || '';
        const res = await fetch(`${API_BASE}/mod/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                guild_id: gid,
                mod_id: userProfile?.id || 0,
                action,
                target: String(targetId),
                reason: reason || 'No reason provided',
                duration: opts.duration || '1h',
                extra,
            })
        });
        return await res.json();
    } catch(e) { console.error('[Mod] action error:', e); return null; }
}

/* ── Ban List ─────────────────────────────── */
window.loadBanList = async function() {
    if (!API_BASE || !modGuildId) return;
    const cacheKey = `modBans:${modGuildId}`;
    if (typeof _cache !== 'undefined') {
        const cached = _cache.get(cacheKey);
        if (cached) { modAllBans = cached; renderBanList(modAllBans); return; }
    }
    const el = document.getElementById('modBanList');
    el.innerHTML = '<div class="loading-shimmer"></div>';
    try {
        const _tok2 = localStorage.getItem('d_token') || '';
        const res = await fetch(`${API_BASE}/mod/bans/${modGuildId}`, {
            headers: { 'ngrok-skip-browser-warning': 'true', 'Authorization': `Bearer ${_tok2}` }
        });
        const data = await res.json();
        modAllBans = data.bans || [];
        if (typeof _cache !== 'undefined') _cache.set(cacheKey, modAllBans, 180000); // 3 min
        renderBanList(modAllBans);
    } catch(e) { el.innerHTML = '<div class="mod-empty">Failed to load bans</div>'; }
};

function renderBanList(bans) {
    const el = document.getElementById('modBanList');
    if (!bans.length) { el.innerHTML = '<div class="mod-empty">No bans</div>'; return; }
    el.innerHTML = bans.map(b => `
        <div class="mod-ban-row">
            <img src="${b.avatar}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'" class="mod-ban-avatar">
            <div class="mod-ban-info">
                <span class="mod-ban-name">${escMod(b.name)}</span>
                <span class="mod-ban-reason">${escMod(b.reason)}</span>
                <span class="mod-ban-id">${b.id}</span>
            </div>
            <button class="mod-unban-btn" onclick="quickUnban('${b.id}','${escMod(b.name).replace(/'/g,"\\'")}')">
                <i class="fa-solid fa-unlock"></i> Unban
            </button>
        </div>`).join('');
}

window.filterBans = function(q) {
    const filtered = q
        ? modAllBans.filter(b => b.name.toLowerCase().includes(q.toLowerCase()) || b.id.includes(q))
        : modAllBans;
    renderBanList(filtered);
};

window.quickUnban = async function(userId, name) {
    if (!confirm(`Unban ${name}?`)) return;
    // Temporarily set action target so modApiAction works
    const prev = modActionTarget;
    modActionTarget = { id: userId, name };
    const res = await modApiAction('unban', userId, 'Unbanned via dashboard');
    modActionTarget = prev;
    if (res?.status === 'unbanned') {
        showModToast(`✓ Unbanned ${name}`, 'success');
        await loadBanList();
        await loadModLog();
    } else {
        showModToast(res?.error || 'Failed to unban', 'error');
    }
};

/* ── Mod Log ─────────────────────────────── */
window.loadModLog = async function() {
    if (!API_BASE || !modGuildId) return;
    const el = document.getElementById('modLogList');
    el.innerHTML = '<div class="loading-shimmer"></div>';

    const params = new URLSearchParams({
        limit: modLogPageSize,
        offset: modLogPage * modLogPageSize,
    });
    if (modLogTypeFilter) params.set('type', modLogTypeFilter);
    if (modLogUserFilter) params.set('user', modLogUserFilter);

    try {
        const res = await fetch(`${API_BASE}/mod/logs/${modGuildId}?${params}`, {
            headers: { 'ngrok-skip-browser-warning': 'true', 'Authorization': `Bearer ${localStorage.getItem('d_token') || ''}` }
        });
        const data = await res.json();
        modLogTotal = data.total || 0;
        renderModLog(data.logs || []);
        updateLogPagination();
    } catch(e) { el.innerHTML = '<div class="mod-empty">Failed to load logs</div>'; }
};

function renderModLog(logs) {
    const el = document.getElementById('modLogList');
    if (!logs.length) { el.innerHTML = '<div class="mod-empty">No log entries found</div>'; return; }
    el.innerHTML = logs.map(log => `
        <div class="mod-log-row" onclick="quickLookup('${log.target?.id}')">
            <span class="mod-action-chip ${log.action}">${actionIcon(log.action)} ${log.action}</span>
            <div class="mod-log-target">
                <img src="${log.target?.avatar || ''}" onerror="this.style.display='none'" class="mod-log-avatar">
                <div>
                    <span class="mod-log-name">${escMod(log.target?.name || '?')}</span>
                    <span class="mod-log-id">${log.target?.id || ''}</span>
                </div>
            </div>
            <span class="mod-log-reason">${escMod(log.reason || 'No reason')}</span>
            <div class="mod-log-mod">
                <img src="${log.moderator?.avatar || ''}" onerror="this.style.display='none'" class="mod-log-avatar">
                <span>${escMod(log.moderator?.name || '?')}</span>
            </div>
            <span class="mod-log-time">${fmtTime(log.timestamp)}</span>
        </div>`).join('');
}

window.quickLookup = function(userId) {
    if (!userId) return;
    const input = document.getElementById('modUserInput');
    if (input) { input.value = userId; lookupUser(); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function updateLogPagination() {
    const totalPages = Math.ceil(modLogTotal / modLogPageSize) || 1;
    document.getElementById('modLogPageInfo').textContent = `Page ${modLogPage + 1} of ${totalPages} (${modLogTotal} total)`;
    document.getElementById('modLogPrev').disabled = modLogPage === 0;
    document.getElementById('modLogNext').disabled = modLogPage >= totalPages - 1;
}

window.changeLogPage = function(delta) {
    modLogPage = Math.max(0, modLogPage + delta);
    loadModLog();
};

window.applyLogFilters = function() {
    modLogPage = 0;
    modLogTypeFilter = document.getElementById('modLogTypeFilter').value;
    loadModLog();
};

window.debounceLogFilter = function() {
    clearTimeout(modLogDebounce);
    modLogDebounce = setTimeout(() => {
        modLogPage = 0;
        modLogUserFilter = document.getElementById('modLogUserFilter').value.trim();
        loadModLog();
    }, 500);
};

window.clearLogFilters = function() {
    document.getElementById('modLogTypeFilter').value = '';
    document.getElementById('modLogUserFilter').value = '';
    modLogTypeFilter = '';
    modLogUserFilter = '';
    modLogPage = 0;
    loadModLog();
};

/* ── Roles ───────────────────────────────── */
async function loadRoles() {
    if (!API_BASE || !modGuildId) return;
    const cacheKey = `modRoles:${modGuildId}`;
    if (typeof _cache !== 'undefined') {
        const cached = _cache.get(cacheKey);
        if (cached) { modRoles = cached; return; }
    }
    try {
        const res = await fetch(`${API_BASE}/mod/roles/${modGuildId}`, {
            headers: { 'ngrok-skip-browser-warning': 'true', 'Authorization': `Bearer ${localStorage.getItem('d_token') || ''}` }
        });
        const data = await res.json();
        modRoles = data.roles || [];
        if (typeof _cache !== 'undefined') _cache.set(cacheKey, modRoles, 300000); // 5 min
    } catch(e) {}
}

/* ── Toast ───────────────────────────────── */
function showModToast(msg, type = 'success') {
    let toast = document.getElementById('modToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'modToast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `mod-toast ${type} show`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ── Helpers ─────────────────────────────── */
function escMod(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function fmtTime(ts) {
    if (!ts) return '?';
    const d = new Date(ts * 1000);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)    return `${Math.floor(diff)}s ago`;
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return d.toLocaleDateString('en', {day:'numeric', month:'short', year:'numeric'});
}

function actionIcon(action) {
    const icons = {
        ban:'🔨', kick:'👟', warn:'⚠️', timeout:'⏰', unban:'🔓',
        untimeout:'↩️', note:'📝', clearwarns:'🧹', role_add:'➕',
        role_remove:'➖', nick:'✏️', mute:'🔇', unmute:'🔊',
    };
    return icons[action] || '📋';
}

/* ═══════════════════════════════════════════
   SERVER ANALYTICS
═══════════════════════════════════════════ */

let anaJoinChart  = null;
let anaMsgChart   = null;
let anaRawData    = null;
let anaDays       = 7;

window.setAnalyticsRange = function(days, btn) {
    anaDays = days;
    document.querySelectorAll('.analytics-range-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (anaRawData) renderAnalyticsCharts(anaRawData);
};

async function loadServerAnalytics() {
    if (!API_BASE || !modGuildId) return;
    const cacheKey = `analytics:${modGuildId}`;
    if (typeof _cache !== 'undefined') {
        const cached = _cache.get(cacheKey);
        if (cached) { anaRawData = cached; renderAnalyticsCharts(cached); _renderAnalyticsCards(cached); return; }
    }
    ['anaMembers','anaOnline','anaJoins','anaLeaves','anaMessages'].forEach(id => {
        const el = document.getElementById(id); if (el) el.textContent = '—';
    });
    try {
        const res = await fetch(`${API_BASE}/analytics/${modGuildId}`, {
            headers: { 'ngrok-skip-browser-warning': 'true', 'Authorization': `Bearer ${localStorage.getItem('d_token') || ''}` }
        });
        const data = await res.json();
        if (data.error) return;
        if (typeof _cache !== 'undefined') _cache.set(cacheKey, data, 300000); // 5 min
        anaRawData = data;
        _renderAnalyticsCards(data);
        renderAnalyticsCharts(data);
    } catch(e) { console.error('[Analytics]', e); }
}

function _renderAnalyticsCards(data) {
    const infoEl = document.getElementById('analyticsServerInfo');
    if (infoEl) infoEl.textContent = data.guild_name || '';
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val ?? '—'; };
    set('anaMembers', (data.member_count || 0).toLocaleString());
    set('anaOnline',  (data.online_count || 0).toLocaleString());
    const last7 = (arr) => (arr || []).slice(-7).reduce((a, b) => a + b, 0);
    set('anaJoins',    last7(data.joins).toLocaleString());
    set('anaLeaves',   last7(data.leaves).toLocaleString());
    set('anaMessages', last7(data.messages).toLocaleString());
}

function renderAnalyticsCharts(data) {
    const days    = anaDays;
    const labels  = (data.dates  || []).slice(-days);
    const joins   = (data.joins  || []).slice(-days);
    const leaves  = (data.leaves || []).slice(-days);
    const msgs    = (data.messages || []).slice(-days);

    // Short date labels
    const shortLabels = labels.map(d => {
        const dt = new Date(d);
        return dt.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    });

    const chartDefaults = {
        responsive: true,
        animation: { duration: 500 },
        plugins: {
            legend: { display: true, labels: { color: '#a0a0a8', font: { size: 11 }, boxWidth: 10, usePointStyle: true } },
            tooltip: {
                backgroundColor: 'rgba(10,10,14,0.97)',
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                padding: 10,
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#a0a0a8', maxRotation: 0, font: { size: 10 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#a0a0a8', precision: 0 }, beginAtZero: true }
        }
    };

    // Joins vs Leaves chart
    const joinCtx = document.getElementById('anaJoinChart')?.getContext('2d');
    if (joinCtx) {
        if (anaJoinChart) anaJoinChart.destroy();
        anaJoinChart = new Chart(joinCtx, {
            type: 'bar',
            data: {
                labels: shortLabels,
                datasets: [
                    {
                        label: 'Joins',
                        data: joins,
                        backgroundColor: 'rgba(67,181,129,0.7)',
                        borderRadius: 4,
                        borderSkipped: false,
                    },
                    {
                        label: 'Leaves',
                        data: leaves,
                        backgroundColor: 'rgba(240,71,71,0.55)',
                        borderRadius: 4,
                        borderSkipped: false,
                    }
                ]
            },
            options: { ...chartDefaults }
        });
    }

    // Messages chart
    const msgCtx = document.getElementById('anaMsgChart')?.getContext('2d');
    if (msgCtx) {
        if (anaMsgChart) anaMsgChart.destroy();
        const gradient = msgCtx.createLinearGradient(0, 0, 0, 160);
        gradient.addColorStop(0,   'rgba(114,137,218,0.6)');
        gradient.addColorStop(1,   'rgba(114,137,218,0.02)');
        anaMsgChart = new Chart(msgCtx, {
            type: 'line',
            data: {
                labels: shortLabels,
                datasets: [{
                    label: 'Messages',
                    data: msgs,
                    borderColor: '#7289da',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#7289da',
                    fill: true,
                    tension: 0.4,
                }]
            },
            options: { ...chartDefaults }
        });
    }
}