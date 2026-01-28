// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'http://127.0.0.1:8080';

// Role Selection Logic for Login Page
let selectedRole = 'Reader';

function selectRole(role) {
    selectedRole = role;

    // Update the displayed role in the login card or signup card
    const displayRoleEl = document.getElementById('display-role');
    if (displayRoleEl) displayRoleEl.innerText = role;

    // For login page specifically
    const roleCard = document.getElementById('role-selection-card');
    const loginCard = document.getElementById('login-form-card');
    if (roleCard && loginCard) {
        roleCard.classList.add('hidden');
        loginCard.classList.remove('hidden');
        loginCard.classList.add('fadeIn');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check for role in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    if (roleParam) {
        selectRole(roleParam);
    }
});

console.log("Booksphere scripts loaded");

// Role specific dashboard mapping
function getDashboardUrl(role) {
    if (!role) return 'dashboard-reader.html';
    const r = role.toLowerCase();
    if (r === 'author') return 'dashboard-author.html';
    if (r === 'admin') return 'dashboard-admin.html';
    return 'dashboard-reader.html';
}

// Global UI synchronization for logged in user
function syncGlobalUserUI() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const displayName = user.fullName || user.username || 'User';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    // Update all avatars (header, sidebar, etc)
    const avatars = document.querySelectorAll('.user-avatar, .profile-avatar-lg');
    avatars.forEach(avatar => {
        avatar.textContent = initials;
    });

    // Update any user name labels (like in profile hero)
    const nameLabels = document.querySelectorAll('.profile-text-info h2, .user-name-label');
    nameLabels.forEach(label => {
        label.textContent = displayName;
    });

    // Update Dashboard link in sidebar to point to the correct one
    const sidebarNavs = document.querySelectorAll('.sidebar-nav a');
    sidebarNavs.forEach(link => {
        const title = link.querySelector('.nav-item-title');
        if (title && title.textContent === 'Dashboard') {
            link.href = getDashboardUrl(user.role);
        }
    });

    console.log(`Global UI Synced for: ${displayName} (${user.role})`);
}

// Login redirection mock
document.addEventListener('DOMContentLoaded', () => {
    syncGlobalUserUI();

    // Check if we are on the login page
    if (document.getElementById('login-form-card') || document.getElementById('role-selection-card')) {
        // Clear session when visiting login page to prevent account mix-ups
        console.log('Clearing session on login page load');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('username');
    }

    // Initialize Logout Buttons
    const logoutBtns = document.querySelectorAll('.btn-logout');
    if (logoutBtns.length > 0) {
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        });
    }

    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // In this app, we use username for authentication internally
                // For simplicity, we'll treat email as username for the backend call 
                // unless we want to change the backend to handle email.
                // Looking at DataInitializer, usernames are 'jisan', 'writer1', etc.
                // So I'll just use the value from the 'email' input as 'username' to the backend.

                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: email,
                        password: password
                    })
                });

                if (response.ok) {
                    const user = await response.json();
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    localStorage.setItem('username', user.username); // Ensure username is stored

                    console.log("Login successful. Role:", user.role, "Redirecting to:", selectedRole);

                    if (selectedRole === 'Reader') {
                        window.location.href = 'dashboard-reader.html';
                    } else if (selectedRole === 'Author') {
                        window.location.href = 'dashboard-author.html';
                    } else if (selectedRole === 'Admin') {
                        window.location.href = 'dashboard-admin.html';
                    }
                } else {
                    const error = await response.text();
                    console.error("Login failed:", error);
                    alert('Login failed: ' + (error || 'Invalid credentials. Please check your username/email and password.'));
                }
            } catch (err) {
                console.error('Login error:', err);
                // alert('Could not connect to backend. Please check if the server is running.');
                // Don't redirect on error - user should fix the connection issue
            }
        });
    }


    // Modal Logic for E-Books Page
    const previewButtons = document.querySelectorAll('.btn-action.outline');
    const modal = document.getElementById('preview-modal');

    if (previewButtons.length > 0 && modal) {
        previewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // In a real app, we would fetch book data based on ID here
                // For now, we just open the static modal
                openPreviewModal();
            });
        });

        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePreviewModal();
            }
        });
    }

    // Add to My Library Logic
    const addToLibraryBtns = document.querySelectorAll('.btn-add-library');
    if (addToLibraryBtns.length > 0) {
        addToLibraryBtns.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const bookData = JSON.parse(this.dataset.bookInfo);
                addToLibrary(bookData);
            });
        });
    }

    // Render Library if on my-library.html
    const libraryGrid = document.querySelector('.library-grid');
    if (libraryGrid) {
        renderLibrary();
    }

    // Audiobook Player Logic
    initAudioPlayer();

    // Event Registration Logic
    initEventRegistration();

    // Dashboard Events Logic
    renderDashboardEvents();

    // initDonationTabs - handled in donate-books.html
    // initOrgUpload - handled in donate-books.html

    // Fund Backing Logic
    initFundTabs();
    initFundBacking();

    // E-Book Filter Logic
    initEbookFilters();

    // Book Swap Logic
    initSwapModal();
    initSwapTabs();
    initRequestActions();
    initBookUpload();
    loadSwapPool(); // Load books dynamically
    loadSwapRequests(); // Load swap requests

    // Signup Form logic
    const signupForm = document.querySelector('.signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password')?.value;

            if (confirmPassword && password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            // username will be derived from email prefix for simplicity or just use email
            const username = email.split('@')[0];

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password,
                        fullName: fullName,
                        role: selectedRole
                    })
                });

                if (response.ok) {
                    alert('Account created successfully! You can now sign in.');
                    window.location.href = 'login.html';
                } else {
                    const error = await response.text();
                    alert('Signup failed: ' + (error || 'Unknown error'));
                }
            } catch (err) {
                console.error('Signup error:', err);
                // alert('Could not connect to backend for signup. Using mock success for demo.');
                window.location.href = 'login.html';
            }
        });
    }

    // Role-based visibility and UI initializations
    checkAuthorRole();
    initAdminSidebarLink(); // Add this
    initUploadModal();

    // Fetch and Render Books from server if on eBooks page
    const ebooksGrid = document.getElementById('ebooks-grid');
    if (ebooksGrid) {
        fetchAndRenderBooks();
    }
});

function initAdminSidebarLink() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return;

    const user = JSON.parse(userJson);
    const role = (user.role || user.user_role || "").toUpperCase();

    if (role === 'ADMIN') {
        const sidebarNav = document.querySelector('.sidebar-nav ul');
        if (!sidebarNav) return;

        // Check if Admin Panel already exists
        const existingAdminLink = Array.from(sidebarNav.querySelectorAll('.nav-item-title'))
            .find(el => el.textContent === 'Admin Panel');

        if (!existingAdminLink) {
            const isAdminPage = window.location.pathname.includes('dashboard-admin.html');

            const adminLi = document.createElement('li');
            if (isAdminPage) adminLi.className = 'active';

            adminLi.innerHTML = `
                <a href="dashboard-admin.html">
                    <i class="fa-solid fa-shield-halved"></i>
                    <div>
                        <span class="nav-item-title">Admin Panel</span>
                        <span class="nav-item-desc">Review pending requests</span>
                    </div>
                </a>
            `;

            // Insert before Profile if possible, else append
            const profileLink = Array.from(sidebarNav.querySelectorAll('.nav-item-title'))
                .find(el => el.textContent === 'Profile');

            if (profileLink) {
                const profileLi = profileLink.closest('li');
                sidebarNav.insertBefore(adminLi, profileLi);
            } else {
                sidebarNav.appendChild(adminLi);
            }

            console.log("Admin Panel link injected into sidebar");
        }
    }
}

function checkAuthorRole() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
        console.log("No user logged in, upload button remains hidden");
        return;
    }

    const user = JSON.parse(userJson);
    const role = (user.role || user.user_role || "").toUpperCase();

    console.log("Current user role:", role);

    if (role === 'AUTHOR' || role === 'ADMIN' || user.penName) {
        const uploadBtn = document.getElementById('upload-book-btn');
        if (uploadBtn) {
            uploadBtn.classList.remove('hidden');
            console.log("Showing upload button for authorized user");
        } else {
            console.warn("Upload button with ID 'upload-book-btn' not found on this page");
        }
    }
}

async function fetchAndRenderBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books`);
        if (response.ok) {
            const books = await response.json();
            // Filter out swap books (books that have an owner)
            const eBooks = books.filter(book => !book.owner);
            renderBooksFromServer(eBooks);

            // Re-initialize filters since new elements are added
            initEbookFilters();
        }
    } catch (err) {
        console.error('Error fetching books:', err);
    }
}
window.fetchAndRenderBooks = fetchAndRenderBooks;

function renderBooksFromServer(books) {
    const grid = document.getElementById('ebooks-grid');
    if (!grid) return;

    if (books.length > 0) {
        grid.innerHTML = '';

        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.dataset.category = book.genre || (book.tags ? book.tags[0] : 'Technology');
            card.dataset.format = book.format || 'EPUB';

            card.innerHTML = `
                <div class="book-cover-wrapper">
                    <span class="badge-overlay green">Free</span>
                    <img src="${book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000'}"
                        alt="${book.title}" class="book-cover">
                    <span class="format-badge">${book.format || 'EPUB'}</span>
                </div>
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p class="author">${book.author}</p>
                    <div class="rating-row">
                        <i class="fa-solid fa-star text-orange"></i> 4.8 <span class="review-count">(1,234 reviews)</span>
                    </div>
                    <div class="meta-row">
                        <span><i class="fa-regular fa-clock"></i> 3h 20m</span>
                        <span>${book.pagesCount || 300} pages</span>
                        <span>2.1 MB</span>
                    </div>
                    <p class="book-desc">${book.description}</p>
                    <div class="price-row">Free</div>
                    <div class="action-buttons">
                        <a href="read-book.html?id=${book.id}" class="btn-action solid"><i class="fa-solid fa-book-open"></i> Read Online</a>
                    </div>
                    <div class="secondary-actions">
                        <button class="btn-link btn-add-library"
                            data-book-info='${JSON.stringify({ id: book.id, title: book.title, author: book.author, cover: book.coverUrl, format: book.format })}'><i class="fa-solid fa-folder-plus"></i> Add to My Library</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        attachBookButtonListeners(grid);
    }
}

function attachBookButtonListeners(container) {
    container.querySelectorAll('.btn-add-library').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const bookData = JSON.parse(this.dataset.bookInfo);
            addToLibrary(bookData);
        });
    });
}

function addToLibrary(book) {
    let library = JSON.parse(localStorage.getItem('myLibrary')) || [];

    if (!library.some(b => b.id === book.id)) {
        library.push(book);
        localStorage.setItem('myLibrary', JSON.stringify(library));
        alert(`${book.title} added to your library!`);
        renderLibrary();
    } else {
        alert('This book is already in your library.');
    }
}

function addToLibrary(book) {
    let library = JSON.parse(localStorage.getItem('myLibrary')) || [];

    // Check if book exists
    if (!library.some(b => b.id === book.id)) {
        library.push(book);
        localStorage.setItem('myLibrary', JSON.stringify(library));
        alert(`${book.title} has been added to your library!`);
    } else {
        alert(`${book.title} is already in your library.`);
    }
}

async function renderLibrary() {
    const libraryGrid = document.querySelector('.library-grid');
    const emptyState = document.querySelector('.empty-state-card');
    const library = JSON.parse(localStorage.getItem('myLibrary')) || [];
    const username = localStorage.getItem('username');

    let allBooks = [...library];

    if (username) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/books/owner/${username}`);
            if (response.ok) {
                const swapBooks = await response.json();
                swapBooks.forEach(sb => {
                    if (!allBooks.some(b => b.id === sb.id)) {
                        allBooks.push({
                            id: sb.id,
                            title: sb.title,
                            author: sb.author,
                            cover: sb.coverUrl,
                            format: sb.format || 'Physical',
                            type: 'swap'
                        });
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching swap books:', err);
        }
    }

    if (allBooks.length > 0) {
        if (emptyState) emptyState.style.display = 'none';
        libraryGrid.innerHTML = '';

        allBooks.forEach(book => {
            const isSwap = book.type === 'swap';
            const badge = isSwap ? 'Swap Listing' : 'Owned';
            const badgeClass = isSwap ? 'orange' : 'green';

            const bookCard = `
                <div class="book-card">
                    <div class="book-cover-wrapper">
                         <span class="badge-overlay ${badgeClass}">${badge}</span>
                        <img src="${book.cover}" alt="${book.title}" class="book-cover">
                        <span class="format-badge">${book.format}</span>
                    </div>
                    <div class="book-info">
                        <h3>${book.title}</h3>
                        <p class="author">${book.author}</p>
                         <div class="action-buttons" style="margin-top: 1rem;">
                            <a href="read-book.html?id=${book.id}" class="btn-action solid" style="width: 100%; justify-content: center;"><i class="fa-solid fa-book-open"></i> Read Now</a>
                        </div>
                    </div>
                </div>
            `;
            libraryGrid.insertAdjacentHTML('beforeend', bookCard);
        });
    } else {
        if (emptyState) emptyState.style.display = 'block';
    }
}

function openPreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Audio Player Functions
// Audio Player Functions
function initAudioPlayer() {
    console.log('Initializing Audio Player...');
    const audioBtns = document.querySelectorAll('.btn-audiobook');
    const playerBar = document.getElementById('audio-player-bar');
    const closePlayerBtn = document.getElementById('close-player-btn');
    const playPauseBtn = document.getElementById('play-pause-btn');

    if (audioBtns.length > 0) {
        console.log(`Found ${audioBtns.length} audiobook buttons.`);
        // Open Player
        audioBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Audiobook button clicked');
                try {
                    const rawData = btn.dataset.bookInfo;
                    console.log('Raw data:', rawData);
                    if (!rawData) {
                        console.error('No data-book-info found on button');
                        return;
                    }
                    const bookData = JSON.parse(rawData);
                    openAudioPlayer(bookData);
                } catch (err) {
                    console.error('Error parsing book data:', err);
                    alert('Error loading audiobook data');
                }
            });
        });
    } else {
        console.warn('No .btn-audiobook buttons found');
    }

    if (playerBar) {
        // Close Player
        if (closePlayerBtn) {
            closePlayerBtn.addEventListener('click', () => {
                playerBar.classList.add('hidden');
                // playerBar.style.transform = 'translateY(110%)'; // Ensure hidden
            });
        }

        // Play/Pause Toggle (Visual Only)
        let isPlaying = false;
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                isPlaying = !isPlaying;
                const icon = playPauseBtn.querySelector('i');
                if (isPlaying) {
                    icon.classList.remove('fa-play');
                    icon.classList.add('fa-pause');
                } else {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                }
            });
        }
    } else {
        console.error('Audio player bar element not found');
    }
}

function openAudioPlayer(book) {
    console.log('Opening player for:', book.title);
    const playerBar = document.getElementById('audio-player-bar');
    const cover = document.getElementById('player-cover');
    const title = document.getElementById('player-title');
    const author = document.getElementById('player-author');

    if (playerBar) {
        if (cover && book.cover) cover.src = book.cover;
        if (title && book.title) title.textContent = book.title;
        if (author && book.author) author.textContent = book.author;

        playerBar.classList.remove('hidden');
        // Force Visibility in case of CSS issues
        // playerBar.style.display = 'block'; 
        // playerBar.style.transform = 'translateY(0)';
    } else {
        console.error('Player bar not found in openAudioPlayer');
    }
}



function initSwapTabs() {
    const tabs = document.querySelectorAll('.swap-tabs .tab-btn');
    const contents = {
        'Available': document.getElementById('tab-available'),
        'Requests': document.getElementById('tab-requests'),
        'History': document.getElementById('tab-history')
    };

    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                Object.values(contents).forEach(el => {
                    if (el) el.classList.add('hidden');
                });

                const tabName = tab.textContent.trim();
                const contentEl = contents[tabName];
                if (contentEl) {
                    contentEl.classList.remove('hidden');
                }

                if (tabName === 'Available') {
                    renderSwapPool();
                } else if (tabName === 'Requests') {
                    loadSwapRequests();
                } else if (tabName === 'History') {
                    loadSwapHistory();
                }
            });
        });

        renderSwapPool();
    }
}

let currentTargetBookId = null;

function initSwapModal() {
    const modal = document.getElementById('swap-modal');
    const closeBtn = document.getElementById('close-swap-modal');
    const cancelBtn = document.getElementById('cancel-swap-btn');
    const form = document.getElementById('swap-request-form');
    const targetBookSpan = document.getElementById('swap-target-book');

    if (modal) {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-swap-request');
            if (btn) {
                e.preventDefault();
                const container = btn.closest('.swap-card-container');
                const card = container ? container.querySelector('.swap-card') : btn.previousElementSibling;

                if (card) {
                    const title = card.querySelector('.book-title')?.textContent || 'Unknown';
                    const author = card.querySelector('.book-author')?.textContent || 'Unknown';
                    currentTargetBookId = btn.getAttribute('data-id');

                    if (targetBookSpan) {
                        targetBookSpan.textContent = `"${title}" by ${author}`;
                    }
                    openSwapModal();
                }
            }
        });

        if (closeBtn) closeBtn.addEventListener('click', closeSwapModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeSwapModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeSwapModal();
        });

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;

                try {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

                    const username = localStorage.getItem('username') || 'jisan';
                    const requestData = {
                        offeredBookTitle: document.getElementById('your-book-title').value,
                        offeredBookAuthor: document.getElementById('your-book-author').value,
                        communicationMethod: document.getElementById('comm-method').value,
                        contactInfo: document.getElementById('contact-info').value,
                        message: document.getElementById('swap-message').value
                    };

                    const response = await fetch(`${API_BASE_URL}/api/swaps/request?requesterId=${username}&bookId=${currentTargetBookId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestData)
                    });

                    if (response.ok) {
                        alert('Swap request sent successfully! The owner will be notified.');
                        closeSwapModal();
                        form.reset();
                        renderSwapRequests();
                    } else {
                        const err = await response.json();
                        alert('Error: ' + (err.message || 'Failed to send request'));
                    }
                } catch (err) {
                    console.error("Swap request error:", err);
                    // alert("Network error. Is Spring Boot running?");
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
        }
    }
}

function initBookUpload() {
    const uploadBtn = document.getElementById('upload-book-btn');
    const uploadModal = document.getElementById('upload-book-modal');
    const closeBtn = document.getElementById('close-upload-book-modal');
    const cancelBtn = document.getElementById('cancel-upload-book-btn');
    const uploadForm = document.getElementById('swap-upload-form');

    if (uploadBtn && uploadModal) {
        uploadBtn.addEventListener('click', () => {
            uploadModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                uploadModal.classList.add('hidden');
                document.body.style.overflow = '';
                if (uploadForm) uploadForm.reset();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                uploadModal.classList.add('hidden');
                document.body.style.overflow = '';
                if (uploadForm) uploadForm.reset();
            });
        }

        if (uploadForm) {
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const submitBtn = uploadForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;

                try {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';

                    const username = localStorage.getItem('username');
                    if (!username) {
                        alert('Please log in first to upload books.');
                        window.location.href = 'login.html';
                        return;
                    }

                    const bookData = {
                        title: document.getElementById('swap-up-title').value,
                        author: document.getElementById('swap-up-author').value,
                        genre: document.getElementById('swap-up-genre').value,
                        format: document.getElementById('swap-up-condition').value,
                        coverUrl: document.getElementById('swap-up-cover').value || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200',
                        description: `Available for swap. Condition: ${document.getElementById('swap-up-condition').value}. Location: ${document.getElementById('swap-up-location').value}`,
                        price: 0,
                        stockLevel: 1,
                        pagesCount: 0,
                        tags: [document.getElementById('swap-up-genre').value]
                    };

                    const response = await fetch(`${API_BASE_URL}/api/books/upload?username=${username}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bookData)
                    });

                    if (response.ok) {
                        alert('Book uploaded successfully! It will appear in the swap pool once approved by an admin.');
                        uploadModal.classList.add('hidden');
                        document.body.style.overflow = '';
                        uploadForm.reset();
                    } else {
                        const error = await response.text();
                        alert('Upload failed: ' + error);
                    }
                } catch (err) {
                    console.error('Upload error:', err);
                    // alert('Network error. Is the backend running?');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
        }
    }
}

async function loadSwapPool() {
    const container = document.getElementById('swap-pool-container');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/books`);
        if (!response.ok) throw new Error('Failed to fetch books');

        const allBooks = await response.json();
        const username = localStorage.getItem('username');
        if (!username) {
            console.warn('No username found in localStorage');
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-user-slash"></i>
                    <h3>Please log in</h3>
                    <p>You need to be logged in to view the swap pool.</p>
                    <a href="login.html" class="btn btn-primary">Go to Login</a>
                </div>
            `;
            return;
        }

        // Filter for approved books only
        const approvedBooks = allBooks.filter(book => book.approved === true);

        container.innerHTML = '';

        if (approvedBooks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-book-open"></i>
                    <h3>No books available yet</h3>
                    <p>Be the first to add a book to the swap pool!</p>
                </div>
            `;
            return;
        }

        approvedBooks.forEach(book => {
            const isOwner = book.owner && book.owner.username === username;

            const card = document.createElement('div');
            card.className = 'swap-card-container';
            card.innerHTML = `
                <div class="swap-card">
                    <div class="book-cover-wrapper">
                        <img src="${book.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200'}"
                            alt="${book.title}" class="book-cover">
                    </div>
                    <div class="book-details">
                        <div class="book-header">
                            <h4 class="book-title">${book.title}</h4>
                            <span class="points-cost"><i class="fa-solid fa-coins"></i> 20</span>
                        </div>
                        <p class="book-author">${book.author}</p>

                        <div class="book-meta-tags">
                            <div class="tag-pill">${book.genre || 'General'}</div>
                            <div class="tag-pill condition-${(book.format || 'good').toLowerCase()}">${book.format || 'Good'}</div>
                        </div>

                        <div class="book-owner">
                            <span class="owner-label">by ${book.owner ? book.owner.fullName : 'Anonymous'} ${isOwner ? '(You)' : ''}</span>
                        </div>
                    </div>
                </div>
                ${!isOwner ? `
                    <button class="btn-swap-request" data-id="${book.id}">
                        <i class="fa-solid fa-arrows-rotate"></i> Request Swap
                        <div class="right-cost">20 pts</div>
                    </button>
                ` : `
                    <div class="owner-badge-simple" style="padding: 0.75rem; text-align: center; color: #94a3b8; font-size: 0.85rem; font-weight: 600; background: #f8fafc; border-radius: 12px; border: 1px dashed #e2e8f0;">
                        <i class="fa-solid fa-user-check"></i> Your Listing
                    </div>
                `}
            `;
            container.appendChild(card);
        });

        // Re-attach event listeners to request buttons
        const requestBtns = container.querySelectorAll('.btn-swap-request');
        requestBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const bookId = this.dataset.id;
                openSwapModal();
                // Store bookId for later use in swap request
                window.currentSwapBookId = bookId;
            });
        });

    } catch (err) {
        console.error('Error loading swap pool:', err);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <h3>Error loading books</h3>
                <p>Could not connect to the server. Please try again later.</p>
            </div>
        `;
    }
}

async function loadSwapRequests() {
    const container = document.getElementById('swap-requests-container');
    if (!container) return;

    try {
        const username = localStorage.getItem('username');
        if (!username) {
            console.warn('No username found in localStorage');
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-user-slash"></i>
                    <h3>Please log in</h3>
                    <p>You need to be logged in to view swap requests.</p>
                    <a href="login.html" class="btn btn-primary">Go to Login</a>
                </div>
            `;
            return;
        }

        // Fetch both incoming and outgoing requests
        const [incomingRes, outgoingRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/swaps/incoming/${username}`),
            fetch(`${API_BASE_URL}/api/swaps/outgoing/${username}`)
        ]);

        if (!incomingRes.ok || !outgoingRes.ok) throw new Error('Failed to fetch requests');

        const incoming = await incomingRes.json();
        const outgoing = await outgoingRes.json();

        // Filter for PENDING only for the requests tab
        const pendingIncoming = incoming.filter(req => req.status === 'PENDING');
        const pendingOutgoing = outgoing.filter(req => req.status === 'PENDING');

        container.innerHTML = '';

        if (pendingIncoming.length === 0 && pendingOutgoing.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-inbox"></i>
                    <h3>No pending swap requests</h3>
                    <p>Your incoming and outgoing pending requests will appear here.</p>
                </div>
            `;
            return;
        }

        // Render Incoming Requests
        if (pendingIncoming.length > 0) {
            const incomingLabel = document.createElement('div');
            incomingLabel.className = 'req-section-label';
            incomingLabel.textContent = 'Incoming Requests';
            container.appendChild(incomingLabel);

            pendingIncoming.forEach(req => {
                const card = createRequestCard(req, 'incoming');
                container.appendChild(card);
            });
        }

        // Render Outgoing Requests
        if (pendingOutgoing.length > 0) {
            const outgoingLabel = document.createElement('div');
            outgoingLabel.className = 'req-section-label';
            outgoingLabel.textContent = 'Outgoing Requests';
            container.appendChild(outgoingLabel);

            pendingOutgoing.forEach(req => {
                const card = createRequestCard(req, 'outgoing');
                container.appendChild(card);
            });
        }

    } catch (err) {
        console.error('Error loading swap requests:', err);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <h3>Error loading requests</h3>
                <p>Could not connect to the server. Please try again later.</p>
            </div>
        `;
    }
}

async function loadSwapHistory() {
    const container = document.getElementById('swap-history-container');
    if (!container) return;

    try {
        const username = localStorage.getItem('username');
        if (!username) return;

        const [incomingRes, outgoingRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/swaps/incoming/${username}`),
            fetch(`${API_BASE_URL}/api/swaps/outgoing/${username}`)
        ]);

        if (!incomingRes.ok || !outgoingRes.ok) throw new Error('Failed to fetch history');

        const incoming = await incomingRes.json();
        const outgoing = await outgoingRes.json();

        // Filter for non-PENDING (ACCEPTED, REJECTED)
        const historyItems = [...incoming, ...outgoing].filter(req => req.status !== 'PENDING');

        container.innerHTML = '';

        if (historyItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    <h3>No swap history yet</h3>
                    <p>Your completed swaps will appear here.</p>
                </div>
            `;
            return;
        }

        // Sort by date (descending)
        historyItems.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

        historyItems.forEach(req => {
            const type = req.requester?.username === username ? 'outgoing' : 'incoming';
            const card = createRequestCard(req, type);
            container.appendChild(card);
        });

    } catch (err) {
        console.error('Error loading swap history:', err);
        container.innerHTML = `<p class="error-text">Error loading swap history.</p>`;
    }
}

function createRequestCard(req, type) {
    const card = document.createElement('div');
    card.className = `request-card ${type}`;

    const statusClass = req.status === 'PENDING' ? 'pending' : req.status === 'ACCEPTED' ? 'accepted' : 'rejected';
    const statusIcon = req.status === 'PENDING' ? 'fa-regular fa-clock' : req.status === 'ACCEPTED' ? 'fa-solid fa-check' : 'fa-solid fa-xmark';

    card.innerHTML = `
        <div class="req-header">
            <div class="req-title-group">
                <img src="${req.book?.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200'}"
                    class="req-thumb" alt="${req.book?.title}">
                <div>
                    <h4>${req.book?.title || 'Unknown Book'}</h4>
                    <p>${req.book?.author || 'Unknown Author'}</p>
                </div>
            </div>
            <span class="status-badge ${statusClass}">
                <i class="${statusIcon}"></i> ${req.status.toLowerCase()}
            </span>
        </div>

        <div class="req-offer-box">
            <div class="offer-row">
                <span class="offer-label">Offering:</span>
                <span class="offer-val">"${req.offeredBookTitle || 'N/A'}" by ${req.offeredBookAuthor || 'N/A'}</span>
            </div>
            <div class="offer-row">
                <span class="offer-label">Contact:</span>
                <span class="offer-val">
                    <i class="${req.communicationMethod === 'Email' ? 'fa-regular fa-envelope' : 'fa-solid fa-phone'}"></i>
                    ${req.contactInfo || 'N/A'}
                </span>
            </div>
            ${req.message ? `
                <div class="offer-msg">
                    <span class="offer-label">Message:</span>
                    <p>"${req.message}"</p>
                </div>
            ` : ''}
        </div>

        <div class="req-footer">
            <span class="time-ago"><i class="fa-regular fa-clock"></i> ${formatTimeAgo(req.requestDate)}</span>
            <span class="requester">with ${type === 'incoming' ? req.requester?.fullName : req.provider?.fullName}</span>
        </div>

        ${type === 'incoming' && req.status === 'PENDING' ? `
            <div class="req-actions">
                <button class="btn-req accept" onclick="handleSwapAction(${req.id}, 'ACCEPTED')">Accept</button>
                <button class="btn-req decline" onclick="handleSwapAction(${req.id}, 'REJECTED')">Decline</button>
            </div>
        ` : ''}
    `;

    return card;
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

async function handleSwapAction(requestId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/swaps/${requestId}/status?status=${status}`, {
            method: 'PUT'
        });

        if (response.ok) {
            alert(`Request ${status.toLowerCase()} successfully!`);
            loadSwapRequests(); // Reload requests
            loadSwapHistory();  // Reload history
        } else {
            alert('Failed to update request status.');
        }
    } catch (err) {
        console.error('Error updating swap request:', err);
        alert('Network error. Could not update request.');
    }
}

function openSwapModal() {
    const modal = document.getElementById('swap-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeSwapModal() {
    const modal = document.getElementById('swap-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        const form = document.getElementById('swap-request-form');
        if (form) form.reset();
    }
}

function initRequestActions() {
    const acceptBtns = document.querySelectorAll('.btn-req.accept');
    const declineBtns = document.querySelectorAll('.btn-req.decline');

    acceptBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const card = this.closest('.request-card');
            if (card) {
                const title = card.querySelector('h4').textContent;
                // Native browser alert as requested
                alert(`Accepting swap request for "${title}"`);

                // Optional: visual feedback
                // this.parentElement.innerHTML = '<span class="status-badge accepted"><i class="fa-solid fa-check"></i> Accepted</span>';
            }
        });
    });

    declineBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            if (confirm('Are you sure you want to decline this request?')) {
                const card = this.closest('.request-card');
                if (card) {
                    card.style.opacity = '0.5';
                    this.parentElement.innerHTML = '<span class="status-badge" style="color: #64748b; background: #f1f5f9;">Declined</span>';
                }
            }
        });
    });
}


// Initialize Upload Book Modals
initUploadModal(); // E-books section
initBookUpload(); // Book Swap section

function initUploadModal() {
    const uploadBtn = document.getElementById('upload-book-btn');
    const uploadModal = document.getElementById('upload-modal');
    const closeBtn = document.getElementById('close-upload-modal');
    const cancelBtn = document.getElementById('cancel-upload');
    const form = document.getElementById('upload-book-form');

    if (!uploadBtn || !uploadModal) return;

    function openModal() {
        uploadModal.classList.remove('hidden');
    }

    function closeModal() {
        uploadModal.classList.add('hidden');
    }

    uploadBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) closeModal();
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('upload-title').value;
            const author = document.getElementById('upload-author').value;
            const genre = document.getElementById('upload-genre').value;
            const format = document.getElementById('upload-format').value;
            const pages = document.getElementById('upload-pages').value;
            const description = document.getElementById('upload-description').value;
            const cover = document.getElementById('upload-cover').value;
            const fileInput = document.getElementById('upload-file');

            const bookData = {
                title: title,
                author: author,
                genre: genre,
                format: format,
                pagesCount: parseInt(pages) || 0,
                description: description,
                coverUrl: cover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=1000",
                price: 0.0,
                stockLevel: 100,
                tags: [genre]
            };

            const formData = new FormData();
            // Important: Send the 'book' part as a Blob with application/json content type
            const bookBlob = new Blob([JSON.stringify(bookData)], { type: 'application/json' });
            formData.append('book', bookBlob);

            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (file.size > 50 * 1024 * 1024) {
                    alert('File is too large! Maximum size allowed is 50MB.');
                    return;
                }
                formData.append('file', file);
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/books/upload-pdf`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const savedBook = await response.json();
                    alert('Book uploaded successfully! Opening your book now...');
                    closeModal();
                    form.reset();
                    // Navigate directly to the reader
                    window.location.href = `read-book.html?id=${savedBook.id}`;
                } else {
                    const errorText = await response.text();
                    console.error('Server error response:', errorText);
                    alert(`Failed to upload book: ${response.status} ${errorText || response.statusText}`);
                }
            } catch (err) {
                console.error('Network/Connection error during upload:', err);
                // alert('Could not connect to backend to upload book. Check if the server is running.');
            }
        });
    }
}

function initCommunityFeatures() {
    const threadBtn = document.getElementById('btn-new-thread');
    const threadModal = document.getElementById('new-thread-modal');
    const closeThreadBtn = document.getElementById('close-thread-modal');
    const cancelThreadBtn = document.getElementById('cancel-thread-btn');
    const threadForm = document.getElementById('new-thread-form');
    // Select the container where we want to add the card, which is recent-discussions div
    const recentDiscussionsCol = document.querySelector('.recent-discussions');

    if (!threadBtn || !threadModal) return;

    function openModal() {
        threadModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        threadModal.classList.add('hidden');
        document.body.style.overflow = '';
        if (threadForm) threadForm.reset();
    }

    threadBtn.addEventListener('click', openModal);

    if (closeThreadBtn) closeThreadBtn.addEventListener('click', closeModal);
    if (cancelThreadBtn) cancelThreadBtn.addEventListener('click', closeModal);

    // Close on outside click
    threadModal.addEventListener('click', (e) => {
        if (e.target === threadModal) {
            closeModal();
        }
    });

    // Handle form submission
    if (threadForm) {
        threadForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('thread-title').value;
            const category = document.getElementById('thread-category').value;
            const tagsInput = document.getElementById('thread-tags').value;

            // Create tags HTML
            const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
            const tagsHtml = tags.length ? tags.map(tag => `<span class="tag">#${tag}</span>`).join('') : '<span class="tag">#new</span>';

            // Create new discussion card
            const newCard = document.createElement('div');
            newCard.className = 'discussion-card';
            newCard.style.animation = 'fadeIn 0.5s ease-out'; // Add a little animation
            newCard.innerHTML = `
                <div class="user-avatar-sm" style="background:#1e3a8a; color:white;">YO</div>
                <div class="disc-content">
                    <h5 class="disc-title">${title}</h5>
                    <div class="disc-meta">
                        <span>You</span> • <span class="cat-tag">${category}</span>
                    </div>
                    <div class="tags-row">
                        ${tagsHtml}
                    </div>
                </div>
                <div class="disc-stats">
                    <div class="stat-pair"><i class="fa-regular fa-comment"></i> 0</div>
                    <div class="stat-pair"><i class="fa-regular fa-eye"></i> 0</div>
                </div>
                <div class="disc-time">
                    <div class="time-user">Just now</div>
                </div>
            `;

            // Insert after the title in the recent-discussions column
            const titleHeader = recentDiscussionsCol.querySelector('.col-title');
            if (titleHeader && titleHeader.nextElementSibling) {
                // Insert after the header
                recentDiscussionsCol.insertBefore(newCard, titleHeader.nextElementSibling);
            } else {
                recentDiscussionsCol.appendChild(newCard);
            }

            alert('Thread created successfully!');
            closeModal();
        });
    }
}

// Initialize Community Tabs
initCommunityTabs();

function initCommunityTabs() {
    const tabForums = document.getElementById('tab-forums');
    const tabClubs = document.getElementById('tab-clubs');
    const tabEvents = document.getElementById('tab-events');

    const contentForums = document.getElementById('content-forums');
    const contentClubs = document.getElementById('content-clubs');
    const contentEvents = document.getElementById('content-events');
    const contentClubDetail = document.getElementById('content-club-detail');

    if (!tabForums || !tabClubs) return;

    function switchTab(activeTab, activeContentId) {
        // Remove active class from all tabs
        [tabForums, tabClubs, tabEvents].forEach(t => t && t.classList.remove('active'));

        // Add active class to clicked tab
        activeTab.classList.add('active');

        // Hide all contents
        [contentForums, contentClubs, contentEvents, contentClubDetail].forEach(c => {
            if (c) c.classList.add('hidden');
        });

        // Show active content
        const activeContent = document.getElementById(activeContentId);
        if (activeContent) {
            activeContent.classList.remove('hidden');
            activeContent.style.animation = 'fadeIn 0.3s ease-out';
        }
    }

    tabForums.addEventListener('click', () => switchTab(tabForums, 'content-forums'));
    tabClubs.addEventListener('click', () => switchTab(tabClubs, 'content-clubs'));
    if (tabEvents) tabEvents.addEventListener('click', () => switchTab(tabEvents, 'content-events'));

    // Club Data Mapping
    const clubData = {
        'Sci-Fi Enthusiasts': {
            title: 'Sci-Fi Enthusiasts',
            tag: 'Science Fiction',
            desc: 'Exploring the boundaries of imagination through science fiction literature',
            members: '2,847 members',
            reading: 'The Left Hand of Darkness',
            cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'
        },
        'Mystery & Thriller Club': {
            title: 'Mystery & Thriller Club',
            tag: 'Mystery',
            desc: 'Unraveling plot twists and solving literary mysteries together. Join us for weekly brain-teasers!',
            members: '1,923 members',
            reading: 'The Thursday Murder Club',
            cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2072&auto=format&fit=crop'
        },
        'Contemporary Fiction Lovers': {
            title: 'Contemporary Fiction Lovers',
            tag: 'Fiction',
            desc: 'Discussing modern stories that reflect our times and the hidden complexities of everyday life.',
            members: '3,156 members',
            reading: 'Where the Crawdads Sing',
            cover: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?q=80&w=2070&auto=format&fit=crop'
        },
        'Non-Fiction Explorers': {
            title: 'Non-Fiction Explorers',
            tag: 'Non-Fiction',
            desc: 'Learning and growing through real stories and insights',
            members: '1,654 members',
            reading: 'Sapiens',
            cover: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop'
        },
        'Classic Literature Society': {
            title: 'Classic Literature Society',
            tag: 'Classics',
            desc: 'Revisiting timeless masterpieces and literary classics',
            members: '1,234 members',
            reading: 'Pride and Prejudice',
            cover: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?q=80&w=2070&auto=format&fit=crop'
        },
        'Fantasy Realm': {
            title: 'Fantasy Realm',
            tag: 'Fantasy',
            desc: 'Journey through magical worlds and epic adventures',
            members: '2,456 members',
            reading: 'The Name of the Wind',
            cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2068&auto=format&fit=crop'
        }
    };

    // Club Detail Logic
    const clubActionBtns = document.querySelectorAll('.btn-view-club, .btn-join-club');
    const backToClubsBtn = document.getElementById('btn-back-to-clubs');

    clubActionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.book-club-card');
            if (!card) return;

            const clubName = card.querySelector('h4').textContent.trim();
            const data = clubData[clubName];

            if (data) {
                // Inject Dynamic Data
                const detailView = document.getElementById('content-club-detail');
                if (detailView) {
                    detailView.querySelector('h2').textContent = data.title;
                    detailView.querySelector('.cd-desc').textContent = data.desc;
                    detailView.querySelector('.cd-tag').textContent = data.tag;
                    detailView.querySelector('.cd-stats-row span:first-child').innerHTML = `<i class="fa-solid fa-user-group"></i> ${data.members}`;
                    detailView.querySelector('.cd-stats-row strong').textContent = data.reading;
                    detailView.querySelector('.cd-thumbnail img').src = data.cover;

                    // Update About Tab Content
                    const aboutText = detailView.querySelector('#cd-about-text');
                    const scheduleTitle = detailView.querySelector('#cd-schedule-current');
                    if (aboutText) aboutText.textContent = `${data.desc}. Our community is passionate about exploring great literature together. We believe that the best books don't just entertain—they challenge our perspectives and help us grow as readers and thinkers.`;
                    if (scheduleTitle) scheduleTitle.textContent = data.reading;

                    // Reset Tabs to Discussions
                    const cdTabs = detailView.querySelectorAll('.cd-nav-tab');
                    const cdPanes = detailView.querySelectorAll('.cd-tab-pane');
                    cdTabs.forEach(t => t.classList.remove('active'));
                    cdPanes.forEach(p => p.classList.add('hidden'));

                    if (cdTabs[0]) cdTabs[0].classList.add('active');
                    if (cdPanes[0]) cdPanes[0].classList.remove('hidden');

                    // Hide everything else
                    [contentForums, contentClubs, contentEvents].forEach(c => {
                        if (c) c.classList.add('hidden');
                    });

                    // Show detail
                    detailView.classList.remove('hidden');
                    detailView.style.animation = 'fadeIn 0.4s ease-out';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        });
    });

    if (backToClubsBtn) {
        backToClubsBtn.addEventListener('click', () => {
            if (contentClubDetail) contentClubDetail.classList.add('hidden');
            if (contentClubs) {
                contentClubs.classList.remove('hidden');
                // Ensure club tab is still active
                [tabForums, tabClubs, tabEvents].forEach(t => t && t.classList.remove('active'));
                tabClubs.classList.add('active');
            }
        });
    }

    // Sub-tabs in Club Detail
    const cdTabs = document.querySelectorAll('.cd-nav-tab');
    const cdPanes = document.querySelectorAll('.cd-tab-pane');

    cdTabs.forEach((tab, index) => {
        tab.addEventListener('click', function () {
            cdTabs.forEach(t => t.classList.remove('active'));
            cdPanes.forEach(p => p.classList.add('hidden'));

            this.classList.add('active');
            if (cdPanes[index]) {
                cdPanes[index].classList.remove('hidden');
                cdPanes[index].style.animation = 'fadeIn 0.3s ease-out';
            }
        });
    });
}

// Event Registration Persistence Logic
function initEventRegistration() {
    const registerBtns = document.querySelectorAll('.btn-register-full, .btn-register-block');

    updateRegisterButtonsState();

    // Event Delegation for modern approach
    document.addEventListener('click', async (e) => {
        const regBtn = e.target.closest('.btn-register-full, .btn-register-block, #event-details-action-btn');
        if (regBtn && regBtn.dataset.eventId) {
            e.preventDefault();
            const eventId = regBtn.dataset.eventId;

            if (regBtn.classList.contains('registered') || regBtn.classList.contains('btn-danger-full')) {
                handleEventUnregistration(eventId);
            } else {
                handleEventRegistration(eventId);
            }
        }

        const detailsBtn = e.target.closest('.view-event-details, .view-details-link');
        if (detailsBtn && detailsBtn.dataset.eventId) {
            e.preventDefault();
            openEventDetails(detailsBtn.dataset.eventId);
        }
    });
}

async function handleEventRegistration(eventId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) {
        alert('Please log in to register for events.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });

        if (response.ok) {
            alert(`You have successfully registered for this event!`);
            updateRegisterButtonsState();
            if (typeof renderDashboardEvents === 'function') renderDashboardEvents();
            if (typeof loadEvents === 'function') loadEvents();
            const modal = document.getElementById('event-details-modal');
            if (modal) modal.classList.add('hidden');
            document.body.style.overflow = '';
        } else {
            const error = await response.json();
            alert(error.message || 'Registration failed');
        }
    } catch (err) {
        console.error('Event registration error:', err);
    }
}

function updateRegisterButtonsState() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) return;

    // Fetch user's registered events from backend
    fetch(`${API_BASE_URL}/api/events/user/${currentUser.id}`)
        .then(res => res.json())
        .then(registeredEvents => {
            const registerBtns = document.querySelectorAll('.btn-register-full, .btn-register-block');

            registerBtns.forEach(btn => {
                const eventId = btn.dataset.eventId;
                const isRegistered = registeredEvents.some(e => e.id == eventId);

                if (isRegistered) {
                    btn.classList.add('registered');
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Registered';
                } else {
                    btn.classList.remove('registered');
                    if (btn.classList.contains('btn-register-full')) {
                        btn.innerHTML = '<i class="fa-regular fa-calendar-plus"></i> Register Now';
                    } else {
                        btn.textContent = 'Register';
                    }
                }
            });
        })
        .catch(err => console.error('Error fetching registered events:', err));
}

function renderDashboardEvents() {
    const container = document.getElementById('dashboard-events-list');
    if (!container) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) {
        container.innerHTML = `
            <div class="no-events-card">
                <div class="no-events-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
                <p>Please log in to view your registered events.</p>
                <a href="login.html" class="btn-text-sm">Log In</a>
            </div>
        `;
        return;
    }

    // Fetch user's registered events from backend
    fetch(`${API_BASE_URL}/api/events/user/${currentUser.id}`)
        .then(res => res.json())
        .then(registeredEvents => {
            if (registeredEvents.length === 0) {
                container.innerHTML = `
                    <div class="no-events-card">
                        <div class="no-events-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
                        <p>No upcoming events registered.</p>
                        <a href="community.html" class="btn-text-sm">Browse Community Events</a>
                    </div>
                `;
                return;
            }

            container.innerHTML = registeredEvents.map(event => `
                <div class="dash-event-card">
                    <div class="de-badge-row">
                        <span class="de-badge green"><i class="fa-solid fa-location-dot"></i> ${event.badge || 'Event'}</span>
                        <span class="de-type-tag">${event.type || 'Community'}</span>
                    </div>
                    <h4>${event.title}</h4>
                    <div class="de-meta">
                        <span><i class="fa-regular fa-calendar"></i> ${event.date || 'TBD'}</span>
                        <span><i class="fa-regular fa-clock"></i> ${event.time || 'TBD'}</span>
                    </div>
                    <div class="de-footer">
                        <span class="registered-status"><i class="fa-solid fa-check"></i> Registered</span>
                        <a href="#" class="view-details-link" data-event-id="${event.id}">View Details <i class="fa-solid fa-arrow-right"></i></a>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => {
            console.error('Error fetching registered events:', err);
            container.innerHTML = `
                <div class="no-events-card">
                    <div class="no-events-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
                    <p>Could not load events. Please try again later.</p>
                </div>
            `;
        });
}

async function handleEventUnregistration(eventId) {
    if (!confirm('Are you sure you want to cancel your registration?')) return;
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    try {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/unregister`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message || 'Registration cancelled!');
            updateRegisterButtonsState();
            if (typeof renderDashboardEvents === 'function') renderDashboardEvents();
            if (typeof loadEvents === 'function') loadEvents();

            const modal = document.getElementById('event-details-modal');
            if (modal) modal.classList.add('hidden');
            document.body.style.overflow = '';
        } else {
            alert(result.message || 'Unregistration failed');
        }
    } catch (err) {
        console.error('Error unregistering from event:', err);
    }
}

async function openEventDetails(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
        if (response.ok) {
            const event = await response.json();

            const modal = document.getElementById('event-details-modal');
            if (!modal) return;

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

            // Check registration status
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const regRes = await fetch(`${API_BASE_URL}/api/events/user/${currentUser.id}`);
            const registeredEvents = await regRes.json();
            const isRegistered = registeredEvents.some(e => e.id == event.id);

            if (isRegistered) {
                actionBtn.innerText = 'Cancel Registration';
                actionBtn.className = 'btn-danger-full';
            } else {
                actionBtn.innerText = 'Register Now';
                actionBtn.className = 'btn-primary-full';
            }

            // Close logic for dashboard page if not already handled
            const closeBtn = document.getElementById('close-event-details-modal');
            if (closeBtn && !closeBtn.dataset.listening) {
                closeBtn.dataset.listening = "true";
                closeBtn.onclick = () => {
                    modal.classList.add('hidden');
                    document.body.style.overflow = '';
                };
            }

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    } catch (err) {
        console.error('Error opening event details:', err);
    }
}


// Donation/Org logic moved to donate-books.html or specific controllers



// Fund Authors Tab Switching
function initFundTabs() {
    const tabExplore = document.getElementById("tab-explore");
    const tabMyBacked = document.getElementById("tab-my-backed");
    const contentExplore = document.getElementById("content-explore");
    const contentMyBacked = document.getElementById("content-my-backed");

    if (!tabExplore || !tabMyBacked) return;

    tabExplore.addEventListener("click", () => {
        tabExplore.classList.add("active");
        tabMyBacked.classList.remove("active");
        contentExplore.classList.remove("hidden");
        contentMyBacked.classList.add("hidden");
    });

    tabMyBacked.addEventListener("click", () => {
        tabMyBacked.classList.add("active");
        tabExplore.classList.remove("active");
        contentMyBacked.classList.remove("hidden");
        contentExplore.classList.add("hidden");
        renderBackedProjects();
    });
}

// Fund Authors Backing Logic
function initFundBacking() {
    const modal = document.getElementById("backing-modal");
    const closeBtn = document.getElementById("close-backing-modal");
    const cancelBtn = document.getElementById("cancel-backing-btn");
    const confirmBtn = document.getElementById("confirm-backing-btn");
    const rewardTiers = document.querySelectorAll(".reward-tier-card");
    const customInput = document.getElementById("custom-pledge");
    const pointsPreview = document.getElementById("points-preview");
    const earnedPointsSpan = document.getElementById("earned-points");

    if (!modal) return;

    window.openBackingModal = (data) => {
        const summaryContainer = document.getElementById("backing-project-summary");
        window.currentBackingProject = {
            id: data.id,
            title: data.title,
            author: data.author,
            image: data.image,
            raised: parseInt(data.raised),
            goal: parseInt(data.goal),
            backers: parseInt(data.backers),
            days: data.days
        };

        summaryContainer.innerHTML = `
            <h4>${window.currentBackingProject.title}</h4>
            <div class="funding-progress">
                <div class="funding-amounts">
                    <span class="amount-raised">$${window.currentBackingProject.raised.toLocaleString()} raised</span>
                    <span class="amount-goal">of $${window.currentBackingProject.goal.toLocaleString()} goal</span>
                </div>
                <div class="progress-bar-thin">
                    <div class="progress-fill" style="width: ${(window.currentBackingProject.raised / window.currentBackingProject.goal) * 100}%;"></div>
                </div>
            </div>
            <div class="campaign-meta" style="border:none; margin:0; padding:1rem 0 0 0;">
                <span><i class="fa-solid fa-users"></i> ${window.currentBackingProject.backers} backers</span>
                <span><i class="fa-regular fa-clock"></i> ${window.currentBackingProject.days} days left</span>
            </div>
        `;

        modal.classList.remove("hidden");
    };

    const updatePoints = (amount) => {
        window.selectedPledgeAmount = parseInt(amount) || 0;
        if (window.selectedPledgeAmount > 0) {
            pointsPreview.classList.remove("hidden");
            earnedPointsSpan.textContent = window.selectedPledgeAmount * 5;
            confirmBtn.disabled = false;
        } else {
            pointsPreview.classList.add("hidden");
            confirmBtn.disabled = true;
        }
    };

    document.querySelectorAll(".btn-back-project").forEach(btn => {
        btn.addEventListener("click", () => {
            openBackingModal(btn.dataset);
        });
    });

    rewardTiers.forEach(tier => {
        tier.addEventListener("click", () => {
            rewardTiers.forEach(t => t.classList.remove("selected"));
            tier.classList.add("selected");
            customInput.value = "";
            updatePoints(tier.dataset.amount);
        });
    });

    customInput.addEventListener("input", () => {
        rewardTiers.forEach(t => t.classList.remove("selected"));
        updatePoints(customInput.value);
    });

    const closeModal = () => {
        modal.classList.add("hidden");
        rewardTiers.forEach(t => t.classList.remove("selected"));
        customInput.value = "";
        pointsPreview.classList.add("hidden");
        confirmBtn.disabled = true;
        window.currentBackingProject = null;
    };

    closeBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    confirmBtn.addEventListener("click", () => {
        if (!window.currentBackingProject || window.selectedPledgeAmount <= 0) return;

        const pledge = {
            pledgeId: "p" + Date.now(),
            projectId: window.currentBackingProject.id,
            title: window.currentBackingProject.title,
            author: window.currentBackingProject.author,
            image: window.currentBackingProject.image,
            amount: window.selectedPledgeAmount,
            points: window.selectedPledgeAmount * 5,
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            projectRaised: window.currentBackingProject.raised + window.selectedPledgeAmount,
            projectGoal: window.currentBackingProject.goal,
            projectBackers: window.currentBackingProject.backers + 1,
            projectDays: window.currentBackingProject.days
        };

        const userPledges = JSON.parse(localStorage.getItem("userPledges") || "[]");
        userPledges.push(pledge);
        localStorage.setItem("userPledges", JSON.stringify(userPledges));

        closeModal();
        updateFundStats();
        alert(`Thank you! You have successfully backed "${pledge.title}" with $${pledge.amount}. You earned ${pledge.points} swap points!`);

        if (document.getElementById("tab-my-backed").classList.contains("active")) {
            renderBackedProjects();
        }
    });

    updateFundStats();
}

function updateFundStats() {
    const userPledges = JSON.parse(localStorage.getItem("userPledges") || "[]");
    const backedCount = userPledges.length;
    const totalPledged = userPledges.reduce((sum, p) => sum + p.amount, 0);

    const countHeader = document.getElementById("header-projects-backed");
    const pledgeHeader = document.getElementById("header-total-pledged");
    const tabBadge = document.getElementById("backed-count");

    if (countHeader) countHeader.textContent = backedCount;
    if (pledgeHeader) pledgeHeader.textContent = "$" + totalPledged.toLocaleString();
    if (tabBadge) {
        if (backedCount > 0) {
            tabBadge.textContent = backedCount;
            tabBadge.classList.remove("hidden");
        } else {
            tabBadge.classList.add("hidden");
        }
    }
}

function renderBackedProjects() {
    const container = document.getElementById("backed-projects-list");
    if (!container) return;

    const userPledges = JSON.parse(localStorage.getItem("userPledges") || "[]");

    if (userPledges.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-shuttle-space"></i>
                <p>You haven't backed any projects yet.</p>
                <button class="btn btn-white" onclick="document.getElementById('tab-explore').click()">Explore Campaigns</button>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    userPledges.reverse().forEach(p => {
        const card = document.createElement("div");
        card.className = "backed-card";
        card.innerHTML = `
            <img src="${p.image}" alt="${p.title}" class="backed-img">
            <div class="backed-info">
                <div class="backed-title-row">
                    <h4>${p.title}</h4>
                    <div class="pledge-total">$${p.amount} <span style="font-size:0.8rem; color:#94a3b8; font-weight:400;">Total Backed</span></div>
                </div>
                <div class="backed-author">by ${p.author}</div>
                <div class="backed-progress-row">
                    <div class="backed-prog-bar">
                        <div class="funding-progress" style="margin:0;">
                            <div class="funding-amounts">
                                <span class="amount-raised">$${p.projectRaised.toLocaleString()}</span>
                                <span class="amount-goal">of $${p.projectGoal.toLocaleString()}</span>
                            </div>
                            <div class="progress-bar-thin">
                                <div class="progress-fill" style="width: ${(p.projectRaised / p.projectGoal) * 100}%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="campaign-meta" style="margin: 0.5rem 0 1rem 0; border:none; padding:0;">
                    <div class="backed-stats-mini">
                        <span><i class="fa-solid fa-users"></i> ${p.projectBackers} backers</span>
                        <span><i class="fa-regular fa-clock"></i> ${p.projectDays} days left</span>
                    </div>
                    <div class="backed-date">${p.date}</div>
                </div>
                <button class="btn-sm btn-white btn-back-again" 
                    data-id="${p.projectId}"
                    data-title="${p.title}"
                    data-author="${p.author}"
                    data-image="${p.image}"
                    data-raised="${p.projectRaised}"
                    data-goal="${p.projectGoal}"
                    data-backers="${p.projectBackers}"
                    data-days="${p.projectDays}">
                    <i class="fa-solid fa-dollar-sign"></i> Back Again
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    // Add listeners to new Back Again buttons
    container.querySelectorAll(".btn-back-again").forEach(btn => {
        btn.addEventListener("click", () => {
            if (window.openBackingModal) window.openBackingModal(btn.dataset);
        });
    });
}

// E-Book Filtering Logic
function initEbookFilters() {
    const categoryChips = document.querySelectorAll('#category-filters .chip');
    const formatChips = document.querySelectorAll('#format-filters .chip');
    const bookCards = document.querySelectorAll('.book-card');
    const showingCountText = document.getElementById('books-showing-count');
    const totalCountStat = document.getElementById('total-books-count');

    if (categoryChips.length === 0 || formatChips.length === 0) return;

    let selectedCategory = 'all';
    let selectedFormat = 'all';

    function applyFilters() {
        let visibleCount = 0;
        bookCards.forEach(card => {
            const cat = card.dataset.category;
            const fmt = card.dataset.format;

            const categoryMatch = selectedCategory === 'all' || cat === selectedCategory;
            const formatMatch = selectedFormat === 'all' || fmt === selectedFormat;

            if (categoryMatch && formatMatch) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        // Update counts
        if (showingCountText) showingCountText.textContent = `Showing ${visibleCount} of ${bookCards.length} books`;
        if (totalCountStat) totalCountStat.textContent = visibleCount;
    }

    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            categoryChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedCategory = chip.dataset.category;
            applyFilters();
        });
    });

    formatChips.forEach(chip => {
        chip.addEventListener('click', () => {
            formatChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedFormat = chip.dataset.format;
            applyFilters();
        });
    });

    // Initial count update
    if (totalCountStat) totalCountStat.textContent = bookCards.length;
    applyFilters();
}


// --- Admin Dashboard Logic ---
function initAdminDashboard() {
    const container = document.getElementById('admin-requests-container');
    const tabs = document.querySelectorAll('#admin-tabs .filter-tab');
    const modal = document.getElementById('admin-detail-modal');
    const modalBody = document.getElementById('admin-modal-body');
    const closeModalBtn = document.getElementById('close-admin-modal');
    const approveBtn = document.getElementById('modal-approve-btn');
    const rejectBtn = document.getElementById('modal-reject-btn');

    if (!container || tabs.length === 0) return;

    let adminRequests = [];
    let currentFilter = 'All';
    let selectedRequestId = null;

    async function fetchRequests() {
        try {
            console.log("Fetching real admin requests from DB...");
            const response = await fetch(`${API_BASE_URL}/api/admin/requests`);
            if (response.ok) {
                adminRequests = await response.json();
                console.log("Loaded requests:", adminRequests.length);
                updateStats();
                renderRequests();
            } else {
                console.error("Failed to fetch admin requests");
                container.innerHTML = `<div class="empty-state-simple">Failed to connect to backend for live data.</div>`;
            }
        } catch (err) {
            console.error("Network error fetching admin data:", err);
            container.innerHTML = `<div class="empty-state-simple">Network error. Is Spring Boot running?</div>`;
        }
    }

    function updateStats() {
        const counts = {
            All: adminRequests.length,
            Books: adminRequests.filter(r => r.type === 'Books').length,
            Donations: adminRequests.filter(r => r.type === 'Donations').length,
            Events: adminRequests.filter(r => r.type === 'Events').length,
            Clubs: adminRequests.filter(r => r.type === 'Clubs').length,
            Campaigns: adminRequests.filter(r => r.type === 'Campaigns').length,
            Swaps: adminRequests.filter(r => r.type === 'Swaps').length
        };

        // Update Stat Cards at the top
        const statValues = document.querySelectorAll('.admin-stat-value');
        const types = ['All', 'Books', 'Donations', 'Events', 'Clubs', 'Campaigns', 'Swaps'];

        statValues.forEach((el, index) => {
            if (index < types.length) {
                el.textContent = counts[types[index]];
            }
        });

        // Update Tab Labels
        tabs.forEach(tab => {
            const filter = tab.getAttribute('data-filter');
            tab.textContent = `${filter} (${counts[filter]})`;
        });
    }

    function renderRequests() {
        container.innerHTML = '';
        const filtered = currentFilter === 'All' ? adminRequests : adminRequests.filter(r => r.type === currentFilter);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state-simple" style="grid-column: 1/-1; text-align: center; padding: 4rem; background: white; border-radius: 16px; border: 1px dashed #cbd5e1;">
                    <i class="fa-solid fa-folder-open fa-3x" style="color: #cbd5e1; margin-bottom: 1rem;"></i>
                    <p style="color: #64748b; font-size: 1.1rem;">No pending ${currentFilter.toLowerCase()} requests found in database.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(req => {
            const card = document.createElement('div');
            card.className = 'request-card';
            card.innerHTML = `
                <img src="${req.thumb}" class="req-thumb" alt="${req.title}">
                <div class="req-content">
                    <div class="req-badges">
                        <span class="badge-type">${req.badge}</span>
                        <span class="badge-role">${req.role}</span>
                    </div>
                    <h3 class="req-title">${req.title}</h3>
                    <p class="req-subtitle">${req.subtitle}</p>
                    <div class="req-meta">
                        <span><i class="fa-regular fa-calendar"></i> ${req.date}</span>
                        <span>Created by: ${req.email}</span>
                    </div>
                </div>
                <div class="req-actions">
                    <button class="btn-view" onclick="event.stopPropagation(); window.openAdminModal(${req.id}, '${req.actionType}')"><i class="fa-regular fa-eye"></i> View</button>
                    <button class="btn-check" onclick="event.stopPropagation(); window.handleAdminAction(${req.id}, '${req.actionType}', 'approve')"><i class="fa-solid fa-check"></i> Approve</button>
                    <button class="btn-reject" onclick="event.stopPropagation(); window.handleAdminAction(${req.id}, '${req.actionType}', 'reject')"><i class="fa-solid fa-xmark"></i> Reject</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Modal Actions
    window.openAdminModal = (id, actionType) => {
        const req = adminRequests.find(r => r.id === id && r.actionType === actionType);
        if (!req) return;
        selectedRequestId = id;
        window.selectedActionType = actionType;

        modalBody.innerHTML = `
            <div style="display: flex; gap: 1.5rem; align-items: flex-start; margin-bottom: 1.5rem;">
                <img src="${req.thumb}" style="width: 120px; height: 120px; border-radius: 12px; object-fit: cover;">
                <div>
                    <h3 style="font-size: 1.25rem; color: #1e293b; margin-bottom: 0.5rem; font-weight: 700;">${req.title}</h3>
                    <p style="color: #64748b; font-weight: 500;">${req.subtitle}</p>
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        <span class="badge-type">${req.badge}</span>
                        <span class="badge-role">${req.role}</span>
                    </div>
                </div>
            </div>
            <div style="background: #f8fafc; border-radius: 12px; padding: 1.25rem; border: 1px solid #e2e8f0;">
                <h4 style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">Description</h4>
                <p style="color: #334155; line-height: 1.6; font-size: 0.95rem;">${req.description || 'No additional description provided for this request.'}</p>
            </div>
            <div style="margin-top: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div style="font-size: 0.85rem;">
                    <span style="color: #94a3b8; display: block; margin-bottom: 0.25rem;">Submitted Date</span>
                    <span style="color: #1e293b; font-weight: 600;">${req.date}</span>
                </div>
                <div style="font-size: 0.85rem;">
                    <span style="color: #94a3b8; display: block; margin-bottom: 0.25rem;">Sender Email</span>
                    <span style="color: #1e293b; font-weight: 600;">${req.email}</span>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    window.closeAdminModal = () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    };

    window.handleAdminAction = async (id, type, action) => {
        const actionText = action === 'approve' ? 'Approved' : 'Rejected';
        const confirmText = action === 'approve' ? 'approve' : 'reject';

        if (confirm(`Are you sure you want to ${confirmText} this ${type} request in database?`)) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/requests/${type}/${id}/${action}`, {
                    method: 'POST'
                });

                if (response.ok) {
                    const data = await response.json();
                    alert(data.message || `Request successfully ${actionText}`);
                    fetchRequests();
                    if (modal && !modal.classList.contains('hidden')) {
                        window.closeAdminModal();
                    }
                } else {
                    alert(`Failed to ${action} request. Server returned error.`);
                }
            } catch (err) {
                console.error(`Error performing admin action ${action}:`, err);
                alert(`Network error. Could not connect to database.`);
            }
        }
    };

    // Close Modal Events
    if (closeModalBtn) closeModalBtn.onclick = window.closeAdminModal;
    if (approveBtn) approveBtn.onclick = () => {
        const req = adminRequests.find(r => r.id === selectedRequestId && r.actionType === window.selectedActionType);
        if (req) window.handleAdminAction(req.id, req.actionType, 'approve');
    };
    if (rejectBtn) rejectBtn.onclick = () => {
        const req = adminRequests.find(r => r.id === selectedRequestId && r.actionType === window.selectedActionType);
        if (req) window.handleAdminAction(req.id, req.actionType, 'reject');
    };

    modal.onclick = (e) => {
        if (e.target === modal) window.closeAdminModal();
    };

    // Tab Filtering
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter');
            renderRequests();
        };
    });

    // Initial Load from real DB
    fetchRequests();
}

// --- Dynamic Book Swap Pool ---
async function renderSwapPool() {
    const poolContainer = document.querySelector('#tab-available .book-list');
    if (!poolContainer) return;

    try {
        console.log("Fetching available swap books...");
        const response = await fetch(`${API_BASE_URL}/api/swaps/available-books`);
        if (response.ok) {
            const books = await response.json();

            if (books.length === 0) {
                poolContainer.innerHTML = `
                    <div class="empty-state-simple" style="padding: 4rem; text-align: center; grid-column: 1/-1;">
                        <i class="fa-solid fa-book-sparkles fa-3x" style="color: #cbd5e1; margin-bottom: 1rem;"></i>
                        <p style="color: #64748b; font-size: 1.1rem;">No books available for swap yet. Be the first to list one!</p>
                    </div>
                `;
                return;
            }

            poolContainer.innerHTML = '';
            books.forEach(book => {
                const username = localStorage.getItem('username') || 'jisan';
                const isOwner = book.owner && book.owner.username === username;

                const card = document.createElement('div');
                card.className = 'swap-card-container';
                card.innerHTML = `
                    <div class="swap-card">
                        <div class="book-cover-wrapper">
                            <img src="${book.coverUrl || 'https://images.unsplash.com/photo-1543005124-8198f537d827?auto=format&fit=crop&q=80&w=200'}"
                                alt="${book.title}" class="book-cover">
                        </div>
                        <div class="book-details">
                            <div class="book-header">
                                <h4 class="book-title">${book.title}</h4>
                                <span class="points-cost"><i class="fa-solid fa-coins"></i> 20</span>
                            </div>
                            <p class="book-author">${book.author}</p>

                            <div class="book-meta-tags">
                                <div class="tag-pill">${book.genre}</div>
                                <div class="tag-pill condition-${book.format ? book.format.toLowerCase() : 'good'}">${book.format || 'Good'}</div>
                            </div>

                            <div class="book-owner">
                                <span class="owner-label">by ${book.owner ? book.owner.fullName : 'Anonymous'} ${isOwner ? '(You)' : ''}</span>
                            </div>
                        </div>
                    </div>
                    ${!isOwner ? `
                        <button class="btn-swap-request" data-id="${book.id}">
                            <i class="fa-solid fa-arrows-rotate"></i> Request Swap
                            <div class="right-cost">20 pts</div>
                        </button>
                    ` : `
                        <div class="owner-badge-simple" style="padding: 0.75rem; text-align: center; color: #94a3b8; font-size: 0.85rem; font-weight: 600; background: #f8fafc; border-radius: 12px; border: 1px dashed #e2e8f0;">
                            <i class="fa-solid fa-user-check"></i> Your Listing
                        </div>
                    `}
                `;
                poolContainer.appendChild(card);
            });

            // Re-initialize modal listeners for new buttons
            initSwapModal();
        }
    } catch (err) {
        console.error("Error rendering swap pool:", err);
    }
}


function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }
}

// ============================
// Campaign Creation Logic
// ============================

function initCampaignCreation() {
    const createBtn = document.getElementById('create-campaign-btn');
    const createFirstBtn = document.getElementById('create-first-campaign-btn');
    const modal = document.getElementById('create-campaign-modal');
    const closeBtn = document.getElementById('close-campaign-modal');
    const cancelBtn = document.getElementById('cancel-campaign-btn');
    const form = document.getElementById('campaign-form');

    // Tab switching
    const tabExplore = document.getElementById('tab-explore');
    const tabMyCampaigns = document.getElementById('tab-my-campaigns');
    const contentExplore = document.getElementById('content-explore');
    const contentMyCampaigns = document.getElementById('content-my-campaigns');

    if (tabExplore && tabMyCampaigns) {
        tabExplore.addEventListener('click', () => {
            tabExplore.classList.add('active');
            tabMyCampaigns.classList.remove('active');
            contentExplore.classList.remove('hidden');
            contentMyCampaigns.classList.add('hidden');
        });

        tabMyCampaigns.addEventListener('click', () => {
            tabMyCampaigns.classList.add('active');
            tabExplore.classList.remove('active');
            contentMyCampaigns.classList.remove('hidden');
            contentExplore.classList.add('hidden');
            loadMyCampaigns();
        });
    }

    // Open modal
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    if (createFirstBtn) {
        createFirstBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close modal
    const closeCampaignModal = () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        if (form) form.reset();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeCampaignModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeCampaignModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeCampaignModal();
        });
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';

                const username = localStorage.getItem('username');
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

                const campaignData = {
                    bookTitle: document.getElementById('book-title').value,
                    authorName: document.getElementById('author-name').value || (currentUser.fullName || currentUser.username),
                    genre: document.getElementById('genre').value,
                    description: document.getElementById('description').value,
                    fundingGoal: parseInt(document.getElementById('funding-goal').value),
                    campaignDuration: parseInt(document.getElementById('campaign-duration').value),
                    authorPhotoUrl: document.getElementById('author-photo').value || null,
                    bookCoverUrl: document.getElementById('book-cover').value || null,
                    authorId: currentUser.id ? Number(currentUser.id) : null
                };

                const response = await fetch(`${API_BASE_URL}/api/campaigns`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(campaignData)
                });

                if (response.ok) {
                    alert('Campaign created successfully!');
                    closeCampaignModal();
                    form.reset();
                    loadAllCampaigns();
                    loadMyCampaigns();
                } else {
                    const error = await response.text();
                    alert('Failed to create campaign: ' + error);
                }
            } catch (err) {
                console.error('Campaign creation error:', err);
                alert('Network error. Is the backend running?');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Load campaigns on page load
    loadAllCampaigns();
}

async function loadAllCampaigns() {
    const grid = document.getElementById('campaigns-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/campaigns`);
        if (!response.ok) throw new Error('Failed to fetch campaigns');

        const campaigns = await response.json();
        renderCampaigns(campaigns, grid);

        // Update active campaigns count
        const countEl = document.getElementById('active-campaigns-count');
        if (countEl) countEl.textContent = campaigns.length;
    } catch (err) {
        console.error('Error loading campaigns:', err);
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <p>Failed to load campaigns. Please check if the backend is running.</p>
            </div>
        `;
    }
}

async function loadMyCampaigns() {
    const container = document.getElementById('my-campaigns-list');
    if (!container) return;

    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (!currentUser.id) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-user-slash"></i>
                    <p>Please log in to view your campaigns.</p>
                </div>
            `;
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/campaigns/author/${currentUser.id}`);
        if (!response.ok) throw new Error('Failed to fetch campaigns');

        const campaigns = await response.json();

        if (campaigns.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-shuttle-space"></i>
                    <p>You haven't created any campaigns yet.</p>
                    <button class="btn btn-white" id="create-first-campaign-btn">Create Your First Campaign</button>
                </div>
            `;
            // Re-attach event listener
            const btn = document.getElementById('create-first-campaign-btn');
            if (btn) {
                btn.addEventListener('click', () => {
                    document.getElementById('create-campaign-modal').classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                });
            }
        } else {
            renderCampaigns(campaigns, container);
        }
    } catch (err) {
        console.error('Error loading my campaigns:', err);
    }
}

function renderCampaigns(campaigns, container) {
    if (!container) return;

    container.innerHTML = '';

    campaigns.forEach(campaign => {
        const card = document.createElement('div');
        card.className = 'campaign-card';

        const defaultCover = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400&h=250';
        const defaultAuthorPhoto = 'https://randomuser.me/api/portraits/lego/1.jpg';

        card.innerHTML = `
            <div class="card-image">
                <img src="${campaign.bookCoverUrl || defaultCover}" alt="${campaign.bookTitle}">
            </div>
            <div class="card-body">
                <div class="author-row">
                    <img src="${campaign.authorPhotoUrl || defaultAuthorPhoto}" alt="${campaign.authorName}" class="author-avatar">
                    <div class="author-info">
                        <div class="author-name">${campaign.authorName}</div>
                        <div class="book-genre">${campaign.genre}</div>
                    </div>
                </div>
                <h4 class="book-title">${campaign.bookTitle}</h4>
                <p class="book-desc">${campaign.description}</p>

                <div class="funding-progress">
                    <div class="funding-amounts">
                        <span class="amount-raised">$${(campaign.amountRaised || 0).toLocaleString()}</span>
                        <span class="amount-goal">of $${(campaign.fundingGoal || 0).toLocaleString()}</span>
                    </div>
                    <div class="progress-bar-thin">
                        <div class="progress-fill" style="width: ${Math.min(100, ((campaign.amountRaised || 0) / (campaign.fundingGoal || 1)) * 100)}%;"></div>
                    </div>
                </div>

                <div class="campaign-meta">
                    <span><i class="fa-solid fa-users"></i> ${campaign.backerCount || 0} backers</span>
                    <span><i class="fa-regular fa-clock"></i> ${campaign.campaignDuration} days</span>
                </div>

                <button class="btn-block-primary btn-back-project" data-id="${campaign.id}">
                    <i class="fa-solid fa-rocket"></i> Back This Project
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}


// Initialize campaign creation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Checking for campaign modal...');
    const campaignModal = document.getElementById('create-campaign-modal');
    const createCampaignBtn = document.getElementById('create-campaign-btn');

    if (campaignModal) {
        console.log('Campaign modal found, initializing...');
        initCampaignCreation();
    } else {
        console.log('Campaign modal not found on this page');
    }

    // Also add a direct listener as backup
    if (createCampaignBtn && !campaignModal) {
        console.warn('Button found but modal missing!');
    } else if (createCampaignBtn) {
        console.log('Create campaign button found');
    }

    // Author Dashboard Specific Data Loading
    if (document.querySelector('.author-hero') || document.getElementById('author-campaigns-list')) {
        loadAuthorDashboardData();
    }

    // Reader Dashboard Specific Data Loading
    if (document.querySelector('.reader-hero') || document.getElementById('dashboard-events-list')) {
        loadReaderDashboardData();
    }
});

async function loadAuthorDashboardData() {
    console.log('Loading author dashboard data...');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log('Current User in Dashboard:', currentUser);

    if (!currentUser.id) {
        console.warn('No user ID found in localStorage, skipping dashboard data load.');
        return;
    }

    try {
        // 1. Load Campaigns
        const campaignsRes = await fetch(`${API_BASE_URL}/api/campaigns/author/${currentUser.id}`);
        if (campaignsRes.ok) {
            const campaigns = await campaignsRes.json();

            // Update Hero Status
            const heroStatus = document.getElementById('hero-campaign-status');
            if (heroStatus) {
                heroStatus.textContent = `You have ${campaigns.length} active campaign${campaigns.length !== 1 ? 's' : ''}`;
            }

            // Update List
            const list = document.getElementById('author-campaigns-list');
            if (list) {
                if (campaigns.length === 0) {
                    list.innerHTML = '<div class="empty-state-text">No active campaigns at the moment.</div>';
                } else {
                    renderCampaigns(campaigns, list);
                }
            }
        }

        // 2. Load Aggregated Stats
        const statsRes = await fetch(`${API_BASE_URL}/api/campaigns/author/${currentUser.id}/stats`);
        console.log('Stats API Response Status:', statsRes.status);
        if (statsRes.ok) {
            const stats = await statsRes.json();
            console.log('Stats Data Received:', stats);

            const booksCountEl = document.getElementById('books-published-count');
            if (booksCountEl) booksCountEl.textContent = stats.booksPublished;

            const fundsEl = document.getElementById('total-funds-raised');
            if (fundsEl) fundsEl.textContent = `$${stats.totalFundsRaised.toLocaleString()}`;

            const followersEl = document.getElementById('total-followers');
            if (followersEl) followersEl.textContent = stats.totalReaders.toLocaleString();
        } else {
            console.error('Failed to fetch author stats:', statsRes.status);
        }

    } catch (err) {
        console.error('Error loading author dashboard data:', err);
    }
}

async function loadReaderDashboardData() {
    console.log('Loading reader dashboard data...');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const localLibrary = JSON.parse(localStorage.getItem('myLibrary') || '[]');
    const localCount = localLibrary.length;

    if (!currentUser.id) {
        console.warn('No user ID found, skipping stats load.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/reader-stats`);
        if (response.ok) {
            const stats = await response.json();
            console.log('Reader Stats Received:', stats);

            const libraryEl = document.getElementById('stat-books-library');
            if (libraryEl) {
                const totalLibrary = localCount + stats.booksInLibrary;
                libraryEl.textContent = totalLibrary;
            }

            const fundsEl = document.getElementById('stat-funds-donated');
            if (fundsEl) fundsEl.textContent = `$${stats.fundsDonated.toLocaleString()}`;
        }
    } catch (err) {
        console.error('Error loading reader stats:', err);
    }
}



