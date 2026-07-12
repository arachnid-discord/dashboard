// Verification Tab Logic
window.initVerification = function() {
    const guildId = window.selectedGuildId;
    if (!guildId) {
        document.getElementById('vFlagsList').innerHTML = '<tr><td colspan="4" class="v-empty">Select a server to view flagged verifications</td></tr>';
        document.getElementById('vHistoryList').innerHTML = '<div class="v-empty">No data available</div>';
        const label = document.getElementById('verificationGuildLabel');
        if (label) label.textContent = 'Select a Server';
        return;
    }
    
    // Update label if needed
    if (window._allGuilds) {
        const g = window._allGuilds.find(x => x.id === guildId);
        if (g) {
            const label = document.getElementById('verificationGuildLabel');
            if (label) label.textContent = g.name;
        }
    }

    fetchVerificationFlags();
    fetchVerificationHistory();
};

async function fetchVerificationFlags() {
    const guildId = window.selectedGuildId;
    if (!guildId) return;
    
    const list = document.getElementById('vFlagsList');
    list.innerHTML = '<tr><td colspan="4" class="v-empty"><div class="loading-shimmer" style="height:20px"></div></td></tr>';

    try {
        const response = await fetch(`https://api.rift.baby/api/verification/flags/${guildId}`);
        const flags = await response.json();

        if (!flags || flags.length === 0) {
            list.innerHTML = '<tr><td colspan="4" class="v-empty">No flagged ban evasions found. System is clean.</td></tr>';
            return;
        }

        list.innerHTML = flags.map(f => `
            <tr>
                <td>
                    <div class="v-user-cell">
                        <div class="v-username"><i class="fa-solid fa-user"></i> ${f.user_id}</div>
                    </div>
                </td>
                <td>
                    <div class="v-user-cell">
                        <div class="v-username"><i class="fa-solid fa-user-slash"></i> ${f.matched_user_id}</div>
                        <div class="v-match-reason">BANNED</div>
                    </div>
                </td>
                <td><span class="v-fp-badge">${f.fingerprint_hash.substring(0, 8)}...</span></td>
                <td><span class="v-time">${new Date(f.timestamp * 1000).toLocaleString()}</span></td>
            </tr>
        `).join('');
    } catch (err) {
        list.innerHTML = '<tr><td colspan="4" class="v-empty error-text">Failed to load flags.</td></tr>';
    }
}

async function fetchVerificationHistory() {
    const guildId = window.selectedGuildId;
    if (!guildId) return;

    const list = document.getElementById('vHistoryList');
    list.innerHTML = '<div class="loading-shimmer" style="height:60px; border-radius:12px"></div>';

    try {
        const response = await fetch(`https://api.rift.baby/api/verification/fingerprints/${guildId}`);
        const fps = await response.json();

        if (!fps || fps.length === 0) {
            list.innerHTML = '<div class="v-empty">No recent successful verifications.</div>';
            return;
        }

        list.innerHTML = fps.map(f => `
            <div class="v-history-item">
                <div class="v-user-cell">
                    <i class="fa-solid fa-user-check" style="color:var(--success)"></i>
                    <div>
                        <div class="v-username">User ID: ${f.user_id}</div>
                        <div class="v-time">${new Date(f.timestamp * 1000).toLocaleString()}</div>
                    </div>
                </div>
                <div class="v-fp-badge">${f.fingerprint_hash.substring(0, 16)}...</div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = '<div class="v-empty error-text">Failed to load history.</div>';
    }
}
