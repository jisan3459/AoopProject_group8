const CHAT_API = 'http://localhost:8080/api/chat';

// Get current user (reused from community.js/script.js logic)
function getChatUser() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) return JSON.parse(userJson);
    return { id: 1, username: 'Guest', fullName: 'Guest User' }; // Fallback
}

function initChat() {
    // Inject Chat UI
    const chatHTML = `
        <button class="chat-toggle-btn" id="chat-toggle">
            <i class="fa-regular fa-comments"></i>
        </button>
        <div class="chat-widget" id="chat-widget">
            <div class="chat-header">
                <div class="chat-title">
                    <h3>BookSphere Live</h3>
                    <span><i class="fa-solid fa-circle-dot"></i> Online</span>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages">
                <!-- Messages -->
            </div>
            <form class="chat-input" id="chat-form">
                <input type="text" id="chat-input-text" placeholder="Type a message..." autocomplete="off">
                <button type="submit"><i class="fa-solid fa-paper-plane"></i></button>
            </form>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    const toggleBtn = document.getElementById('chat-toggle');
    const widget = document.getElementById('chat-widget');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input-text');
    const msgList = document.getElementById('chat-messages');

    // Toggle
    toggleBtn.addEventListener('click', () => {
        widget.classList.toggle('active');
        toggleBtn.classList.toggle('active');
        if (toggleBtn.classList.contains('active')) {
            toggleBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            loadMessages();
            startPolling();
        } else {
            toggleBtn.innerHTML = '<i class="fa-regular fa-comments"></i>';
            stopPolling();
        }
    });

    // Send
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = input.value.trim();
        if (!content) return;

        const user = getChatUser();
        const payload = {
            content,
            userId: user.id,
            username: user.fullName || user.username,
            userAvatarInitials: (user.fullName || user.username).charAt(0).toUpperCase()
        };

        try {
            const res = await fetch(CHAT_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                input.value = '';
                loadMessages(); // Refresh immediately
            }
        } catch (err) { console.error('Chat error:', err); }
    });

    let pollInterval;

    function startPolling() {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(loadMessages, 3000); // Poll every 3s
    }

    function stopPolling() {
        if (pollInterval) clearInterval(pollInterval);
    }

    async function loadMessages() {
        try {
            const res = await fetch(CHAT_API);
            if (res.ok) {
                const messages = await res.json();
                renderMessages(messages);
            }
        } catch (err) { console.error('Poll error:', err); }
    }

    function renderMessages(messages) {
        const user = getChatUser();
        msgList.innerHTML = messages.map(m => {
            const isSelf = m.userId === user.id;
            return `
                <div class="chat-msg ${isSelf ? 'self' : ''}">
                    <div class="msg-avatar">${m.userAvatarInitials || '?'}</div>
                    <div class="msg-content">
                        <div class="msg-bubble">${m.content}</div>
                        <div class="msg-meta">${formatChatTime(m.timestamp)}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Auto-scroll to bottom of LAST message? 
        // Only if we were already near bottom to prevent jumping while reading
        msgList.scrollTop = msgList.scrollHeight;
    }

    function formatChatTime(ts) {
        if (!ts) return '';
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// Auto-init
document.addEventListener('DOMContentLoaded', initChat);
