const FORUMS_API = 'http://localhost:8080/api/discussions';
const CLUBS_API = 'http://localhost:8080/api/clubs';
const EVENTS_API = 'http://localhost:8080/api/events';
const STATS_API = 'http://localhost:8080/api/community/stats';

// Get current user from localStorage
function getCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
        return JSON.parse(userJson);
    }
    return {
        id: 1, // Fallback to jisan for demo if not logged in
        username: 'jisan',
        fullName: 'Jisan Ahmed'
    };
}

const currentUser = getCurrentUser();

let replyingToId = null;
let allDiscussions = []; // Store all discussions for filtering
let selectedCategory = null; // Track selected category
let registeredEvents = []; // Store user's registered events

console.log('Community.js (Unified Integrated) loaded.');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialization
    initMainTabs();
    initForumHandlers();
    initClubHandlers();
    initEventHandlers();
    initCategoryFilters();

    // 2. Load Real Data
    loadStats();
    loadDiscussions();
    loadClubs();
    await loadUserRegisteredEvents(); // Load these first to know registration status
    loadEvents();
});

async function loadUserRegisteredEvents() {
    try {
        const response = await fetch(`${EVENTS_API}/user/${currentUser.id}`);
        if (response.ok) {
            registeredEvents = await response.json();
            console.log('Registered events loaded:', registeredEvents);
        }
    } catch (err) {
        console.error('Error loading registered events:', err);
    }
}

function initMainTabs() {
    const tabs = document.querySelectorAll('.comm-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetId = tab.id.replace('tab-', 'content-');
            const contents = ['content-forums', 'content-clubs', 'content-events'];

            contents.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });

            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.remove('hidden');

            // Also hide details when switching main tabs
            document.getElementById('discussion-detail-view').classList.add('hidden');
            document.getElementById('content-club-detail').classList.add('hidden');
        });
    });
}

// --- STATS LOGIC ---
async function loadStats() {
    try {
        const response = await fetch(STATS_API);
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('stat-members').textContent = formatStat(stats.memberCount);
            document.getElementById('stat-clubs').textContent = formatStat(stats.clubCount);
            document.getElementById('stat-events').textContent = formatStat(stats.eventCount);
        }
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

function formatStat(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num;
}

// --- FORUM LOGIC ---

function initForumHandlers() {
    const forumList = document.getElementById('recent-discussions-list');
    if (!forumList) return;

    // Event Delegation for clicking discussions
    forumList.addEventListener('click', (e) => {
        const card = e.target.closest('.discussion-card');
        if (card && card.dataset.id) {
            openIntegratedDiscussion(card.dataset.id);
        }
    });

    // Back to forums listener
    const backToForumsBtn = document.getElementById('back-to-forums');
    if (backToForumsBtn) {
        backToForumsBtn.addEventListener('click', () => switchView('forums-list-view', 'discussion-detail-view', false));
    }

    // Submit forum reply
    const submitReplyBtn = document.getElementById('btn-integrated-submit-reply');
    if (submitReplyBtn) {
        submitReplyBtn.addEventListener('click', async () => {
            const contentInput = document.getElementById('integrated-reply-text');
            const content = contentInput.value;
            const discussionId = submitReplyBtn.dataset.discussionId;
            if (content.trim() && discussionId) {
                await postCommentIntegrated(discussionId, content);
                contentInput.value = '';
            }
        });
    }

    // New Thread Button Trigger
    const newThreadBtn = document.getElementById('btn-new-thread');
    if (newThreadBtn) {
        newThreadBtn.addEventListener('click', () => {
            const modal = document.getElementById('new-thread-modal');
            if (modal) modal.classList.remove('hidden');
        });
    }

    // New Thread Form
    const threadForm = document.getElementById('new-thread-form-integrated');
    if (threadForm) {
        threadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                title: document.getElementById('thread-title').value,
                category: document.getElementById('thread-category').value,
                content: document.getElementById('thread-content').value,
                authorId: currentUser.id,
                tags: document.getElementById('thread-tags').value.split(',').map(t => t.trim()).filter(t => t)
            };

            try {
                const response = await fetch(FORUMS_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    closeModal('new-thread-modal');
                    threadForm.reset();
                    loadDiscussions();
                }
            } catch (err) { console.error('Error creating thread:', err); }
        });
    }

    // New Thread Modal Close/Cancel
    const closeThreadBtn = document.getElementById('close-thread-modal');
    if (closeThreadBtn) closeThreadBtn.addEventListener('click', () => closeModal('new-thread-modal'));

    const cancelThreadBtn = document.getElementById('cancel-thread-btn');
    if (cancelThreadBtn) cancelThreadBtn.addEventListener('click', () => closeModal('new-thread-modal'));
}

async function loadDiscussions() {
    try {
        const response = await fetch(FORUMS_API);
        const data = await response.json();
        allDiscussions = data; // Store for filtering
        renderDiscussionList(data);
    } catch (err) { console.warn('Forum backend unreachable'); }
}

function initCategoryFilters() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const categoryName = card.querySelector('h5').textContent;

            // Toggle category selection
            if (selectedCategory === categoryName) {
                selectedCategory = null;
                categoryCards.forEach(c => c.classList.remove('active'));
                renderDiscussionList(allDiscussions); // Show all
            } else {
                selectedCategory = categoryName;
                categoryCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                // Filter discussions by category
                const filtered = allDiscussions.filter(disc => disc.category === categoryName);
                renderDiscussionList(filtered);
            }
        });
    });
}

function renderDiscussionList(discussions) {
    const listContainer = document.getElementById('recent-discussions-list');
    if (!listContainer) return;

    const header = listContainer.querySelector('.col-title');
    listContainer.innerHTML = '';
    if (header) listContainer.appendChild(header);

    discussions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(disc => {
        const card = document.createElement('div');
        card.className = 'discussion-card';
        card.dataset.id = disc.id;
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="user-avatar-sm">${disc.author.fullName.charAt(0)}</div>
            <div class="disc-content">
                <h5 class="disc-title">${disc.title}</h5>
                <div class="disc-meta">
                    <span>${disc.author.fullName}</span> • <span class="cat-tag">${disc.category}</span>
                </div>
                <div class="tags-row">${disc.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>
            </div>
            <div class="disc-stats">
                <div class="stat-pair"><i class="fa-regular fa-comment"></i> ${disc.id % 5 + 2}</div> 
                <div class="stat-pair"><i class="fa-regular fa-eye"></i> ${disc.views}</div>
            </div>
            <div class="disc-time">
                <div class="time-user">${disc.author.fullName.split(' ')[0]}</div>
                <div>${formatTime(disc.timestamp)}</div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

async function openIntegratedDiscussion(id) {
    try {
        fetch(`${FORUMS_API}/${id}/view`, { method: 'POST' }).catch(() => { });
        const disc = await (await fetch(`${FORUMS_API}/${id}`)).json();
        const comments = await (await fetch(`${FORUMS_API}/${id}/comments`)).json();

        renderIntegratedDiscussion(disc, comments);
        switchView('discussion-detail-view', 'forums-list-view', true);
        document.getElementById('btn-integrated-submit-reply').dataset.discussionId = id;
    } catch (err) { console.error('Error loading thread:', err); }
}

function renderIntegratedDiscussion(disc, comments) {
    // Already implemented elements
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('integrated-disc-title', disc.title);
    set('integrated-disc-author', `By ${disc.author.fullName}`);
    set('integrated-disc-time', formatTime(disc.timestamp));
    set('integrated-disc-views', disc.views);
    set('integrated-disc-content', disc.content);
    set('integrated-replies-count', comments.length);

    const tagsEl = document.getElementById('integrated-disc-tags');
    if (tagsEl) tagsEl.innerHTML = disc.tags.map(tag => `<span class="tag-pill">#${tag}</span>`).join('');

    const list = document.getElementById('integrated-comments-list');
    if (list) {
        list.innerHTML = comments.map(c => `
            <div class="comment-card-integrated">
                <div class="comment-avatar-integrated">${c.author.fullName.charAt(0)}</div>
                <div class="comment-content-wrapper">
                    <div class="comment-user-row">
                        <span class="comment-user-name">${c.author.fullName}</span>
                        <span class="comment-timestamp">${formatTime(c.timestamp)}</span>
                    </div>
                    <div class="comment-text-integrated">${c.content}</div>
                </div>
            </div>
        `).join('');
    }
}

async function postCommentIntegrated(id, content) {
    try {
        const res = await fetch(`${FORUMS_API}/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, authorId: currentUser.id })
        });
        if (res.ok) openIntegratedDiscussion(id); // Reload
    } catch (err) { console.error(err); }
}

// --- CLUB LOGIC ---

function initClubHandlers() {
    const clubsList = document.getElementById('clubs-list');
    if (!clubsList) return;

    // Event Delegation 
    clubsList.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.btn-view-club');
        const joinBtn = e.target.closest('.btn-join-club');
        const card = e.target.closest('.book-club-card');

        if (viewBtn && card) {
            openClubDetail(card.dataset.id);
        } else if (joinBtn && card) {
            handleJoinClub(card.dataset.id);
        }
    });

    // Back Link
    const backBtn = document.getElementById('btn-back-to-clubs');
    if (backBtn) backBtn.addEventListener('click', () => switchView('content-clubs', 'content-club-detail', false));

    // Create Club Trigger
    const trigger = document.getElementById('btn-create-club');
    if (trigger) trigger.addEventListener('click', () => {
        const modal = document.getElementById('club-modal');
        if (modal) modal.classList.remove('hidden');
    });

    // Create Club Form
    const clubForm = document.getElementById('create-club-form-integrated');
    if (clubForm) {
        clubForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('club-input-name').value,
                description: document.getElementById('club-input-description').value,
                category: document.getElementById('club-input-category').value,
                currentBook: document.getElementById('club-input-current-book').value,
                author: document.getElementById('club-input-author').value,
                meetingSchedule: document.getElementById('club-input-schedule').value,
                nextMeeting: document.getElementById('club-input-next-meeting').value,
                imageUrl: document.getElementById('club-input-image').value || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80',
                creatorId: currentUser.id
            };

            try {
                const response = await fetch(CLUBS_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    const modal = document.getElementById('club-modal');
                    if (modal) modal.classList.add('hidden');
                    clubForm.reset();
                    loadClubs();
                    loadStats();
                }
            } catch (err) { console.error('Error creating club:', err); }
        });
    }

    // Modal Close
    const closeClubBtn = document.getElementById('close-club-modal');
    if (closeClubBtn) closeClubBtn.addEventListener('click', () => {
        const modal = document.getElementById('club-modal');
        if (modal) modal.classList.add('hidden');
    });

    // Modal Cancel
    const cancelClubBtn = document.getElementById('cancel-club-btn-integrated');
    if (cancelClubBtn) cancelClubBtn.addEventListener('click', () => {
        const modal = document.getElementById('club-modal');
        if (modal) modal.classList.add('hidden');
    });

    // Leave Club Logic
    const leaveBtn = document.getElementById('btn-leave-club-actual');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
            const id = leaveBtn.dataset.clubId;
            if (id) handleLeaveClub(id);
        });
    }

    // Club Tabs Switcher
    const tabs = document.querySelectorAll('.cd-nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.querySelectorAll('.cd-tab-pane').forEach(pane => {
                pane.classList.add('hidden');
                if (pane.id === `club-tab-${target}`) pane.classList.remove('hidden');
            });
        });
    });

    // Send Message
    const sendMsgBtn = document.getElementById('btn-send-club-message');
    if (sendMsgBtn) {
        sendMsgBtn.addEventListener('click', async () => {
            const input = document.getElementById('club-message-input');
            const clubId = sendMsgBtn.dataset.clubId;
            if (input.value.trim() && clubId) {
                console.log('Posting message with replyingToId:', replyingToId);
                await postClubMessage(clubId, input.value, 'message', replyingToId);
                input.value = '';
                replyingToId = null;
                input.placeholder = "Share your thoughts with the club...";
            }
        });
    }

    // Event Delegation for Replies and Expand
    const clubMessagesList = document.getElementById('club-messages-list');
    if (clubMessagesList) {
        clubMessagesList.addEventListener('click', (e) => {
            const replyBtn = e.target.closest('.btn-club-reply');
            const toggleBtn = e.target.closest('.btn-toggle-replies');

            if (replyBtn) {
                replyingToId = replyBtn.dataset.id;
                const input = document.getElementById('club-message-input');
                if (input) {
                    input.placeholder = `Replying to message #${replyingToId}...`;
                    input.focus();
                }
            } else if (toggleBtn) {
                const repliesContainer = toggleBtn.closest('.post-card').querySelector('.replies-container');
                if (repliesContainer) {
                    repliesContainer.classList.toggle('hidden');
                    const isHidden = repliesContainer.classList.contains('hidden');
                    toggleBtn.innerHTML = isHidden
                        ? `<i class="fa-solid fa-chevron-down"></i> Show ${toggleBtn.dataset.count} replies`
                        : `<i class="fa-solid fa-chevron-up"></i> Hide replies`;
                }
            }
        });
    }
}

async function loadClubs() {
    try {
        const res = await fetch(CLUBS_API);
        const clubs = await res.json();
        renderClubsList(clubs);
    } catch (err) { console.warn('Club backend unreachable'); }
}

function renderClubsList(clubs) {
    const list = document.getElementById('clubs-list');
    if (!list) return;

    list.innerHTML = clubs.map(club => {
        const isMember = club.members.some(m => m.id === currentUser.id);
        const btnHtml = isMember
            ? `<button class="btn-view-club">View Club</button>
               <button class="btn-club-check"><i class="fa-solid fa-check"></i></button>`
            : `<button class="btn-join-club"><i class="fa-solid fa-user-plus"></i> Join Club</button>`;

        return `
            <div class="book-club-card" data-id="${club.id}">
                <div class="club-cover" style="background-image: url('${club.imageUrl}');">
                    <span class="club-badge">${club.category}</span>
                </div>
                <div class="club-details">
                    <h4>${club.name}</h4>
                    <div class="club-members"><i class="fa-solid fa-user-group"></i> ${club.memberCount} members</div>
                    <p class="club-desc">${club.description}</p>
                    <div class="club-reading">
                        <div class="reading-label">Currently Reading</div>
                        <div class="reading-book"><i class="fa-solid fa-book-open"></i> ${club.currentBook || 'TBD'}</div>
                        <div class="reading-author">by ${club.author || '---'}</div>
                    </div>
                    <div class="club-meet-info">
                        <i class="fa-regular fa-calendar"></i>
                        <div>
                            <span class="meet-label">${club.meetingSchedule || 'Not scheduled'}</span>
                            <span class="meet-time">Next: ${club.nextMeeting || 'TBD'}</span>
                        </div>
                    </div>
                    <div class="club-actions">${btnHtml}</div>
                </div>
            </div>
        `;
    }).join('');
}

async function openClubDetail(id) {
    try {
        const club = await (await fetch(`${CLUBS_API}/${id}`)).json();
        const messages = await (await fetch(`${CLUBS_API}/${id}/messages`)).json();

        // Update UI
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('club-detail-name', club.name);
        set('club-detail-desc', club.description);
        set('club-detail-members-count', `${club.memberCount} members`);
        set('club-detail-current-book', club.currentBook || 'TBD');
        set('club-detail-about-text', club.description);
        set('club-detail-schedule-book', club.currentBook || 'TBD');
        set('club-detail-schedule-author', club.author || '---');

        const img = document.getElementById('club-detail-image');
        if (img) img.src = club.imageUrl;

        const banner = document.getElementById('club-banner-integrated');
        if (banner) banner.style.backgroundImage = `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.3)), url('${club.imageUrl}')`;

        // Render Messages
        renderClubMessages(messages);

        // Render Members
        renderClubMembers(club.members);

        // Store ID
        document.getElementById('btn-send-club-message').dataset.clubId = id;
        const leaveBtn = document.getElementById('btn-leave-club-actual');
        if (leaveBtn) leaveBtn.dataset.clubId = id;

        switchView('content-club-detail', 'content-clubs', true);
    } catch (err) { console.error(err); }
}

function renderClubMessages(messages) {
    const list = document.getElementById('club-messages-list');
    if (!list) return;

    console.log('renderClubMessages called with:', messages);

    // Sort messages to find top-level ones
    const topLevel = messages.filter(m => !m.parentMessage);
    const replyMap = {};
    messages.filter(m => m.parentMessage).forEach(r => {
        const pid = r.parentMessage.id;
        if (!replyMap[pid]) replyMap[pid] = [];
        replyMap[pid].push(r);
    });

    console.log('Top level messages:', topLevel);
    console.log('Reply map:', replyMap);

    list.innerHTML = topLevel.map(m => {
        const replies = replyMap[m.id] || [];
        const badgeClass = m.type === 'announcement' ? 'orange' : (m.type === 'book-discussion' ? 'blue' : '');

        let repliesHtml = '';
        if (replies.length > 0) {
            repliesHtml = `
                <div class="replies-toggle-row">
                    <button class="btn-toggle-replies" data-id="${m.id}" data-count="${replies.length}">
                        <i class="fa-solid fa-chevron-up"></i> Hide ${replies.length} replies
                    </button>
                </div>
                <div class="replies-container">
                    ${replies.map(r => `
                        <div class="reply-card">
                            <div class="reply-header">
                                <div class="user-avatar-xs">${r.author.fullName.charAt(0)}</div>
                                <div class="reply-user-info">
                                    <span class="uname">${r.author.fullName}</span>
                                    <span class="p-time">${formatTime(r.timestamp)}</span>
                                </div>
                            </div>
                            <p class="reply-text">${r.content}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="post-card ${m.type === 'announcement' ? 'announcement' : ''}" data-id="${m.id}">
                <div class="post-header">
                    <div class="user-avatar-sm">${m.author.fullName.charAt(0)}</div>
                    <div class="post-user-info">
                        <div class="user-name-row">
                            <div class="uname-header">
                                <span class="uname">${m.author.fullName}</span>
                                ${m.type ? `<span class="post-badge ${badgeClass}">${m.type}</span>` : ''}
                                <span class="p-time">${formatTime(m.timestamp)}</span>
                            </div>
                        </div>
                        <p class="post-text">${m.content}</p>
                        <div class="post-actions-row">
                            <button class="btn-club-reply" data-id="${m.id}"><i class="fa-regular fa-comment"></i> Reply</button>
                        </div>
                    </div>
                </div>
                ${repliesHtml}
            </div>
        `;
    }).join('');
}

function renderClubMembers(members) {
    const list = document.getElementById('club-members-grid');
    if (!list) return;
    list.innerHTML = members.map(m => `
        <div class="member-card">
            <div class="m-header">
                <div class="m-avatar">${m.fullName.charAt(0)}</div>
                <div class="m-user-info">
                    <div class="m-name">${m.fullName}</div>
                    <span class="m-badge member">member</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function handleJoinClub(id) {
    try {
        const res = await fetch(`${CLUBS_API}/${id}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        if (res.ok) {
            alert('Joined successfully!');
            loadClubs();
            loadStats();
        }
    } catch (err) { console.error(err); }
}

async function postClubMessage(id, content, type, parentId = null) {
    try {
        console.log('postClubMessage called with:', { id, content, type, parentId });
        const payload = { content, type, authorId: currentUser.id, parentId };
        console.log('Sending payload:', payload);

        const res = await fetch(`${CLUBS_API}/${id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const savedMessage = await res.json();
            console.log('Message saved:', savedMessage);

            const messages = await (await fetch(`${CLUBS_API}/${id}/messages`)).json();
            console.log('All messages fetched:', messages);
            renderClubMessages(messages);
            scrollToBottom('club-messages-list');
        }
    } catch (err) { console.error('Error posting message:', err); }
}

function scrollToBottom(id) {
    const el = document.getElementById(id);
    if (el) el.scrollTop = el.scrollHeight;
}

// --- EVENT LOGIC ---

function initEventHandlers() {
    const createEventBtn = document.getElementById('btn-create-event');
    if (createEventBtn) {
        createEventBtn.addEventListener('click', () => {
            const modal = document.getElementById('event-modal');
            if (modal) modal.classList.remove('hidden');
        });
    }

    const closeEventBtn = document.getElementById('close-event-modal');
    if (closeEventBtn) closeEventBtn.addEventListener('click', () => {
        closeModal('event-modal');
    });

    const closeDetailsBtn = document.getElementById('close-event-details-modal');
    if (closeDetailsBtn) closeDetailsBtn.addEventListener('click', () => {
        closeModal('event-details-modal');
    });

    // Close on overlay click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.add('hidden');
        }
    });

    const cancelEventBtn = document.getElementById('cancel-event-btn');
    if (cancelEventBtn) cancelEventBtn.addEventListener('click', () => {
        const modal = document.getElementById('event-modal');
        if (modal) modal.classList.add('hidden');
    });

    const eventForm = document.getElementById('create-event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                title: document.getElementById('event-title').value,
                description: document.getElementById('event-desc').value,
                type: document.getElementById('event-category').value, // Use category as type for consistency with UI tags
                badge: document.getElementById('event-type').value, // In-Person/Online
                date: document.getElementById('event-date').value || 'TBD',
                time: document.getElementById('event-time').value || 'TBD',
                location: document.getElementById('event-location').value,
                hostName: document.getElementById('event-host').value || '',
                hostId: currentUser.id,
                maxAttendees: parseInt(document.getElementById('event-max').value) || 50,
                imageUrl: document.getElementById('event-image').value || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80'
            };

            try {
                const response = await fetch(EVENTS_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    closeModal('event-modal');
                    eventForm.reset();
                    await loadEvents();
                    loadStats();
                }
            } catch (err) { console.error('Error creating event:', err); }
        });
    }

    // Event Delegation
    document.addEventListener('click', (e) => {
        const regBtn = e.target.closest('.btn-register-full, .btn-register-block, #event-details-action-btn');
        if (regBtn && regBtn.dataset.eventId) {
            const eventId = regBtn.dataset.eventId;
            if (regBtn.classList.contains('registered') || regBtn.classList.contains('btn-danger-full')) {
                handleEventUnregistration(eventId);
            } else {
                handleEventRegistration(eventId);
            }
        }

        const detailsBtn = e.target.closest('.view-event-details');
        if (detailsBtn && detailsBtn.dataset.eventId) {
            openEventDetails(detailsBtn.dataset.eventId);
        }
    });
}

async function loadEvents() {
    try {
        const response = await fetch(EVENTS_API);
        if (response.ok) {
            const events = await response.json();
            renderEvents(events);
        }
    } catch (err) {
        console.error('Error loading events:', err);
    }
}

function renderEvents(events) {
    const featuredList = document.getElementById('events-featured-list');
    const gridList = document.getElementById('events-grid-list');
    if (!featuredList || !gridList) return;

    featuredList.innerHTML = '';
    gridList.innerHTML = '';

    // Sort: newest first
    const sortedEvents = [...events].sort((a, b) => b.id - a.id);

    sortedEvents.forEach((event, index) => {
        const isRegistered = registeredEvents.some(e => e.id === event.id);
        const btnClass = isRegistered ? 'registered' : '';
        const btnText = isRegistered ? '<i class="fa-solid fa-check"></i> Registered' : '<i class="fa-regular fa-calendar-plus"></i> Register Now';
        const blockBtnText = isRegistered ? '<i class="fa-solid fa-check"></i> Registered' : 'Register';

        if (index < 3) {
            featuredList.innerHTML += `
                <div class="event-card-featured">
                    <div class="event-cover-large" style="background-image: url('${event.imageUrl}');">
                        <span class="event-badge green"><i class="fa-solid fa-location-dot"></i> ${event.badge}</span>
                        <span class="event-badge orange post-top-right">${event.host ? 'User Event' : 'Featured'}</span>
                    </div>
                    <div class="event-details-large">
                        <span class="event-type-tag">${event.type}</span>
                        <h3>${event.title}</h3>
                        <div class="event-time-row">
                            <i class="fa-regular fa-calendar"></i> ${event.date || 'TBD'}
                            <span class="divider">•</span>
                            <i class="fa-regular fa-clock"></i> ${event.time || 'TBD'}
                        </div>
                        <p class="event-desc">${event.description}</p>

                        <div class="event-footer">
                            <div class="attendees-info">
                                <i class="fa-solid fa-user-group"></i> ${event.currentAttendees} / ${event.maxAttendees} attending
                                <span class="host-info">by ${event.hostName || (event.host ? (event.host.fullName || event.host.username) : 'BookSphere Team')}</span>
                            </div>
                            <div class="location-info">
                                <i class="fa-solid fa-map-pin"></i> ${event.location || 'See details'}
                            </div>
                            <div class="event-card-actions">
                                <button class="view-event-details" data-event-id="${event.id}">View Details</button>
                                <button class="btn-register-full ${btnClass}" data-event-id="${event.id}">
                                    ${btnText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            gridList.innerHTML += `
                <div class="book-club-card event-card-grid">
                    <div class="club-cover" style="background-image: url('${event.imageUrl}');">
                        <span class="club-badge green"><i class="fa-solid fa-location-dot"></i> ${event.badge}</span>
                        <div class="card-overlay-btn">
                            <button class="view-event-details" data-event-id="${event.id}">View Details</button>
                        </div>
                    </div>
                    <div class="club-details">
                        <span class="event-type-tag-sm">${event.type}</span>
                        <h4>${event.title}</h4>
                        <div class="club-desc">${event.description}</div>

                        <div class="event-grid-meta">
                            <div><i class="fa-regular fa-calendar"></i> ${event.date || 'TBD'}</div>
                            <div><i class="fa-regular fa-clock"></i> ${event.time || 'TBD'}</div>
                        </div>
                        <div class="event-location-sm">
                            <i class="fa-solid fa-map-pin"></i> ${event.location || 'TBD'}
                        </div>

                        <div class="club-members small-text">
                            <i class="fa-solid fa-user-group"></i> ${event.currentAttendees} / ${event.maxAttendees} attending
                        </div>

                        <button class="btn-register-block ${btnClass}" data-event-id="${event.id}">${blockBtnText}</button>
                    </div>
                </div>
            `;
        }
    });
}

async function handleEventRegistration(eventId) {
    if (!currentUser) { alert('Please login to register'); return; }
    try {
        const response = await fetch(`${EVENTS_API}/${eventId}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message || 'Registered successfully!');
            await loadUserRegisteredEvents();
            loadEvents();
            closeModal('event-details-modal');
        } else {
            alert(result.message || 'Registration failed');
        }
    } catch (err) {
        console.error('Error registering for event:', err);
    }
}

async function handleEventUnregistration(eventId) {
    if (!confirm('Are you sure you want to cancel your registration?')) return;
    try {
        const response = await fetch(`${EVENTS_API}/${eventId}/unregister`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message || 'Registration cancelled!');
            await loadUserRegisteredEvents();
            loadEvents();
            if (typeof renderDashboardEvents === 'function') renderDashboardEvents();
            closeModal('event-details-modal');
        } else {
            alert(result.message || 'Unregistration failed');
        }
    } catch (err) {
        console.error('Error unregistering from event:', err);
    }
}

async function openEventDetails(eventId) {
    try {
        const response = await fetch(`${EVENTS_API}/${eventId}`);
        if (response.ok) {
            const event = await response.json();

            document.getElementById('event-details-header-image').style.backgroundImage = `url('${event.imageUrl}')`;
            document.getElementById('event-details-title').innerText = event.title;
            document.getElementById('event-details-description').innerText = event.description;
            document.getElementById('event-details-date').innerText = event.date || 'TBD';
            document.getElementById('event-details-time').innerText = event.time || 'TBD';
            document.getElementById('event-details-attendees').innerText = `${event.currentAttendees} / ${event.maxAttendees}`;
            document.getElementById('event-details-host').innerText = event.hostName || (event.host ? (event.host.fullName || event.host.username) : 'BookSphere Team');
            document.getElementById('event-details-location-text').innerText = event.location || 'Contact host for details';

            const actionBtn = document.getElementById('event-details-action-btn');
            actionBtn.dataset.eventId = event.id;

            const isRegistered = registeredEvents.some(e => e.id === event.id);
            if (isRegistered) {
                actionBtn.innerText = 'Cancel Registration';
                actionBtn.className = 'btn-danger-full';
            } else {
                actionBtn.innerText = 'Register Now';
                actionBtn.className = 'btn-primary-full';
            }

            document.getElementById('event-details-modal').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    } catch (err) {
        console.error('Error opening event details:', err);
    }
}

// --- UTILS ---

function switchView(showId, hideId, scrollToTop) {
    const show = document.getElementById(showId);
    const hide = document.getElementById(hideId);
    if (show && hide) {
        hide.classList.add('hidden');
        show.classList.remove('hidden');
        if (scrollToTop) show.scrollIntoView({ behavior: 'smooth' });
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function formatTime(timestamp) {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleDateString();
}

async function handleLeaveClub(id) {
    if (!confirm('Are you sure you want to leave this club?')) return;
    try {
        const response = await fetch(`${CLUBS_API}/${id}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        if (response.ok) {
            alert('You have left the club.');
            switchView('content-clubs', 'content-club-detail', false);
            loadClubs();
            loadStats();
        } else {
            const error = await response.json();
            alert(error.message || 'Error leaving club');
        }
    } catch (err) { console.error('Error leaving club:', err); }
}
