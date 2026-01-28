// Profile Page Logic
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    initProfileTabs();
    initContributionHistory();
    initReminderToggles();
    initRedeemModal(); // Add this

    loadUserProfile();
    initProfileTabs();
    initContributionHistory();
    initReminderToggles();
    initRedeemModal(); // Add this
});

// Tab Switching Logic
function initProfileTabs() {
    const tabs = {
        'tab-overview': 'section-overview',
        'tab-history': 'section-history',
        'tab-expenses': 'section-expenses',
        'tab-reminders': 'section-reminders',
        'tab-points': 'section-points'
    };

    // Add click listeners to all tabs
    Object.keys(tabs).forEach(tabId => {
        const tabButton = document.getElementById(tabId);
        if (tabButton) {
            tabButton.addEventListener('click', () => {
                switchTab(tabId, tabs[tabId]);
            });
        }
    });

    // Check URL for tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && tabs[`tab-${tabParam}`]) {
        switchTab(`tab-${tabParam}`, tabs[`tab-${tabParam}`]);
    }
}

function switchTab(activeTabId, activeSectionId) {
    // Remove active class from all tabs
    document.querySelectorAll('.comm-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Add active class to clicked tab
    const activeTab = document.getElementById(activeTabId);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Hide all sections
    document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show the active section
    const activeSection = document.getElementById(activeSectionId);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }

    // Sync profile values when switching to points tab
    if (activeSectionId === 'section-points') {
        loadUserProfile(); // Use the more robust version
    }
}

// Global user state
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

async function loadUserProfile() {
    if (!currentUser || !currentUser.id) {
        console.warn("No user logged in, redirecting to login...");
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch latest user data from server (base info)
        const userResp = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}`);
        if (userResp.ok) {
            const freshUser = await userResp.json();
            currentUser = { ...currentUser, ...freshUser };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        // Fetch full profile stats
        const profileResp = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/full-profile`);
        if (profileResp.ok) {
            const profileData = await profileResp.json();
            updateProfileStats(profileData);
        }
    } catch (err) {
        console.error("Error fetching fresh profile data:", err);
    }

    const { username, fullName, role, swapPoints } = currentUser;
    const displayName = fullName || username;

    // Update Name & Role
    const nameEls = document.querySelectorAll('.profile-text-info h2, .breadcrumb-text h1');
    nameEls.forEach(el => el.textContent = displayName);

    const roleBadge = document.querySelector('.p-badge');
    if (roleBadge) roleBadge.textContent = role || 'Reader';

    // Update Avatar
    const avatarEls = document.querySelectorAll('.profile-avatar-lg, .user-avatar');
    const initials = displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
    avatarEls.forEach(el => el.textContent = initials);

    // Sync Points displays
    updatePointsDisplays(swapPoints);
}

function updateProfileStats(data) {
    console.log("[DEBUG] Received Full Profile Data:", data);

    const donatedEl = document.getElementById('stats-books-donated');
    const contribEl = document.getElementById('overview-contributed');
    const pointsEl = document.getElementById('overview-points');

    const role = (currentUser && currentUser.role) ? currentUser.role.toUpperCase() : 'READER';
    const isAuthor = role === 'AUTHOR';

    // Update Books Stat
    if (donatedEl) {
        donatedEl.textContent = isAuthor ? (data.booksPublished || 0) : (data.booksDonated || 0);
        const label = donatedEl.nextElementSibling;
        if (label && label.classList.contains('sb-label')) {
            label.textContent = isAuthor ? "Books Published" : "Books Donated";
        }
    }

    // Update Funds Stat
    if (contribEl) {
        const amount = isAuthor ? (data.fundsRaised || 0) : (data.fundsContributed || 0);
        contribEl.textContent = `$${amount.toFixed(2)}`;

        const label = contribEl.nextElementSibling;
        if (label && label.classList.contains('sb-label')) {
            label.textContent = isAuthor ? "Funds Raised" : "Funds Donated";
        }
        console.log(`[DEBUG] Updated ${isAuthor ? 'Funds Raised' : 'Funds Donated'}: $${amount.toFixed(2)}`);
    }

    if (pointsEl) pointsEl.textContent = data.swapPoints || 0;

    // Expenses tab summary (Always show funds donated/contributed for now or adapt if needed)
    const totalContributedEl = document.getElementById('stats-total-contributed');
    if (totalContributedEl) {
        const amount = isAuthor ? (data.fundsRaised || 0) : (data.fundsContributed || 0);
        totalContributedEl.textContent = `$${amount.toFixed(2)}`;

        const label = totalContributedEl.nextElementSibling;
        if (label && label.classList.contains('sb-label')) {
            label.textContent = isAuthor ? "Total Funds Raised" : "Total Funds Donated";
        }
    }
}

function updatePointsDisplays(points) {
    const elements = [
        'hero-swap-points',
        'overview-points',
        'points-hero-value',
        'modal-points-balance'
    ];

    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'hero-swap-points') {
                el.innerHTML = `${points} <span class="unit">pts</span>`;
            } else {
                el.textContent = points;
            }
        }
    });
}

// Redeem Modal Logic
function initRedeemModal() {
    const modal = document.getElementById('redeem-modal');
    const openBtns = document.querySelectorAll('.btn-redeem, .btn-white');
    const closeBtn = document.getElementById('close-redeem-modal');
    const mTabs = document.querySelectorAll('.m-tab');

    // Open Modal
    openBtns.forEach(btn => {
        if (btn.textContent.includes('Redeem')) {
            btn.addEventListener('click', () => {
                modal.classList.remove('hidden');
                loadRewards('ALL');
                loadUserProfile();
            });
        }
    });

    // Close Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // Modal tabs (Category filtering)
    mTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            mTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadRewards(tab.dataset.category);
        });
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Sync points initially
    syncUserPoints();
}

async function loadRewards(category) {
    const grid = document.getElementById('rewards-grid');
    grid.innerHTML = `
        <div class="loading-spinner">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <p>Loading rewards...</p>
        </div>
    `;

    try {
        let url = `${API_BASE_URL}/api/rewards`;
        if (category !== 'ALL') {
            url = `${API_BASE_URL}/api/rewards/category/${category}`;
        }

        const response = await fetch(url);
        if (response.ok) {
            const rewards = await response.json();
            renderRewards(rewards);
        } else {
            grid.innerHTML = '<p class="error-msg">Failed to load rewards. Please try again.</p>';
        }
    } catch (err) {
        console.error('Error loading rewards:', err);
        grid.innerHTML = '<p class="error-msg">Error connecting to server.</p>';
    }
}

function renderRewards(rewards) {
    const grid = document.getElementById('rewards-grid');
    if (rewards.length === 0) {
        grid.innerHTML = '<p class="empty-msg">No rewards available in this category.</p>';
        return;
    }

    grid.innerHTML = rewards.map(reward => `
        <div class="reward-card" data-category="${reward.category}">
            <div class="reward-icon-box">
                <i class="${reward.iconClass || 'fa-solid fa-gift'}"></i>
            </div>
            <div class="reward-info">
                <h4>${reward.name}</h4>
                <p>${reward.description}</p>
            </div>
            <div class="reward-footer">
                <div class="reward-cost">${reward.pointsCost} <span>pts</span></div>
                <button class="btn-redeem-action" 
                    onclick="handleRedeem(${reward.id}, ${reward.pointsCost})"
                    ${currentUser && currentUser.swapPoints < reward.pointsCost ? 'disabled' : ''}>
                    Redeem
                </button>
            </div>
        </div>
    `).join('');
}

async function handleRedeem(rewardId, cost) {
    if (!currentUser) {
        alert('Please login to redeem rewards.');
        return;
    }

    if (currentUser.swapPoints < cost) {
        alert('Insufficient points!');
        return;
    }

    if (!confirm(`Are you sure you want to redeem this reward for ${cost} points?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/rewards/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                rewardId: rewardId
            })
        });

        if (response.ok) {
            const result = await response.json();
            alert('Success! Your reward has been redeemed. Check your email for details.');
            loadUserProfile().then(() => {
                // Refresh the current view to update button states
                const activeTab = document.querySelector('.m-tab.active');
                loadRewards(activeTab ? activeTab.dataset.category : 'ALL');
            });
        } else {
            const err = await response.json();
            alert(err.error || 'Redemption failed. Please try again.');
        }
    } catch (err) {
        console.error('Redemption error:', err);
        alert('Error connecting to server. Please check your connection.');
    }
}

// Need to make it global since it's used in onclick
window.handleRedeem = handleRedeem;

async function initContributionHistory() {
    const listContainer = document.getElementById('contribution-history-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<p class="loading-msg">Loading history...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/contributions`);
        if (response.ok) {
            const contributions = await response.json();
            renderContributionHistory(contributions);
        } else {
            listContainer.innerHTML = '<p class="error-msg">Failed to load contribution history.</p>';
        }
    } catch (err) {
        console.error('Error loading contributions:', err);
        listContainer.innerHTML = '<p class="error-msg">Error connecting to server.</p>';
    }
}

function renderContributionHistory(contributions) {
    const listContainer = document.getElementById('contribution-history-list');

    // Update summary count
    const countEl = document.getElementById('stats-contribution-count');
    if (countEl) countEl.textContent = contributions.length;

    // Update average
    const avgEl = document.getElementById('stats-avg-contribution');
    if (avgEl && contributions.length > 0) {
        const total = contributions.reduce((sum, c) => sum + c.amount, 0);
        avgEl.textContent = `$${(total / contributions.length).toFixed(2)}`;
    }

    if (contributions.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state-mini">
                <i class="fa-solid fa-receipt"></i>
                <p>No contributions found in your account history.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = contributions.map(c => `
        <div class="activity-item">
            <div class="activity-icon blue"><i class="fa-solid fa-hand-holding-dollar"></i></div>
            <div class="activity-info">
                <h4>Backed: ${c.campaign ? c.campaign.bookTitle : 'N/A'}</h4>
                <p>Date: ${new Date(c.backedAt).toLocaleDateString()}</p>
            </div>
            <div class="activity-amount">-$${c.amount.toFixed(2)}</div>
        </div>
    `).join('');
}

function initReminderToggles() {
    console.log('Reminder toggles initialized');
}


// Settings Button Handler
const settingsBtn = document.querySelector('.btn-settings-light');
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        window.location.href = 'settings.html';
    });
}
