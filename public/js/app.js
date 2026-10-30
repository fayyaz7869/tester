// Simple & Attractive Testing Point Hub JavaScript

const state = {
  activeTab: 'pending', // 'pending', 'process', 'done', 'all', 'approvals'
  searchQuery: '',
  points: [],
  selectedImageFile: null,
  currentUser: null,
  adminEmail: 'admin@shifteronline.com'
};

// DOM References
const elements = {
  storageBadge: document.getElementById('storageBadge'),
  storageBadgeText: document.getElementById('storageBadgeText'),
  resetDemoBtn: document.getElementById('resetDemoBtn'),

  // Header User Profile
  userProfileBar: document.getElementById('userProfileBar'),
  headerAvatar: document.getElementById('headerAvatar'),
  headerUserName: document.getElementById('headerUserName'),
  headerUserRole: document.getElementById('headerUserRole'),
  logoutBtn: document.getElementById('logoutBtn'),
  openAuthBtn: document.getElementById('openAuthBtn'),

  // Add Point Card & Form
  addPointCard: document.querySelector('.add-point-card'),
  authorIndicator: document.getElementById('authorIndicator'),
  authorIndicatorName: document.getElementById('authorIndicatorName'),
  authorIndicatorRole: document.getElementById('authorIndicatorRole'),
  inputPointText: document.getElementById('inputPointText'),
  inputAuthor: document.getElementById('inputAuthor'),
  inputPointImage: document.getElementById('inputPointImage'),
  imagePreviewBar: document.getElementById('imagePreviewBar'),
  imagePreviewThumb: document.getElementById('imagePreviewThumb'),
  imagePreviewName: document.getElementById('imagePreviewName'),
  removeImageBtn: document.getElementById('removeImageBtn'),
  submitPointBtn: document.getElementById('submitPointBtn'),

  // Tabs & Badges
  statusTabs: document.getElementById('statusTabs'),
  badgePending: document.getElementById('badgePending'),
  badgeProcess: document.getElementById('badgeProcess'),
  badgeDone: document.getElementById('badgeDone'),
  badgeAll: document.getElementById('badgeAll'),
  tabApprovalsBtn: document.getElementById('tabApprovalsBtn'),
  badgeApprovals: document.getElementById('badgeApprovals'),
  searchInput: document.getElementById('searchInput'),
  searchWrap: document.getElementById('searchWrap'),

  // List Containers
  pointsList: document.getElementById('pointsList'),
  approvalsSection: document.getElementById('approvalsSection'),
  approvalsList: document.getElementById('approvalsList'),
  refreshApprovalsBtn: document.getElementById('refreshApprovalsBtn'),

  // Auth Modal
  authModal: document.getElementById('authModal'),
  tabLoginBtn: document.getElementById('tabLoginBtn'),
  tabSignupBtn: document.getElementById('tabSignupBtn'),
  authAlert: document.getElementById('authAlert'),
  loginForm: document.getElementById('loginForm'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  fillAdminBtn: document.getElementById('fillAdminBtn'),
  submitLoginBtn: document.getElementById('submitLoginBtn'),
  signupForm: document.getElementById('signupForm'),
  signupName: document.getElementById('signupName'),
  signupEmail: document.getElementById('signupEmail'),
  signupPassword: document.getElementById('signupPassword'),
  signupRole: document.getElementById('signupRole'),
  submitSignupBtn: document.getElementById('submitSignupBtn'),

  // Lightbox
  lightbox: document.getElementById('lightbox'),
  lightboxImg: document.getElementById('lightboxImg'),
  lightboxClose: document.getElementById('lightboxClose'),

  // Toast
  toastBox: document.getElementById('toastBox')
};

// Toast notification helper
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>✓</span><span>${escapeHtml(message)}</span>`;
  elements.toastBox.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// Utility: Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Format relative date
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / (3600000 * 24));

  if (diffMins < 1) return 'Abhi abhi';
  if (diffMins < 60) return `${diffMins} min pehle`;
  if (diffHours < 24) return `${diffHours} ghante pehle`;
  if (diffDays === 1) return 'Kal';
  if (diffDays < 7) return `${diffDays} din pehle`;
  return date.toLocaleDateString('hi-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Eye toggle for password visibility
window.togglePasswordVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🔒';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
};

// Check User Session on load
function checkUserSession() {
  try {
    const rawUser = localStorage.getItem('devtest_user');
    if (rawUser) {
      state.currentUser = JSON.parse(rawUser);
    }
  } catch (err) {
    state.currentUser = null;
  }
  updateUserUI();
}

// Update UI based on user session
function updateUserUI() {
  if (state.currentUser) {
    elements.authModal.classList.remove('active');
    elements.userProfileBar.style.display = 'flex';
    elements.openAuthBtn.style.display = 'none';

    elements.headerUserName.textContent = state.currentUser.name || 'User';
    elements.headerUserRole.textContent = state.currentUser.role || 'Member';

    elements.headerUserRole.className = 'user-role-badge';
    if (state.currentUser.role === 'Admin') {
      elements.headerUserRole.classList.add('role-admin');
      elements.headerAvatar.textContent = '🛡️';
      // Show Admin-only Approvals tab
      elements.tabApprovalsBtn.style.display = 'inline-flex';
    } else {
      elements.tabApprovalsBtn.style.display = 'none';
      if (state.activeTab === 'approvals') {
        state.activeTab = 'pending';
        switchTab('pending');
      }

      if (state.currentUser.role === 'Developer') {
        elements.headerUserRole.classList.add('role-developer');
        elements.headerAvatar.textContent = '🛠️';
      } else {
        elements.headerUserRole.classList.add('role-tester');
        elements.headerAvatar.textContent = '🧪';
      }
    }

    elements.authorIndicator.style.display = 'block';
    elements.authorIndicatorName.textContent = state.currentUser.name;
    elements.authorIndicatorRole.textContent = state.currentUser.role;
    elements.inputAuthor.value = state.currentUser.name;
  } else {
    elements.userProfileBar.style.display = 'none';
    elements.openAuthBtn.style.display = 'inline-flex';
    elements.authorIndicator.style.display = 'none';
    elements.tabApprovalsBtn.style.display = 'none';
    elements.inputAuthor.value = '';
    elements.authModal.classList.add('active');
  }
}

// Show alert inside Auth Modal
function showAuthAlert(message, type = 'error') {
  elements.authAlert.className = `auth-alert ${type}`;
  elements.authAlert.innerHTML = `<span>${type === 'error' ? '⚠️' : '✓'}</span><span>${escapeHtml(message)}</span>`;
  elements.authAlert.style.display = 'flex';
}

function hideAuthAlert() {
  elements.authAlert.style.display = 'none';
}

// Initialize Application
async function init() {
  checkUserSession();
  await checkConfig();
  await loadStats();
  if (state.activeTab === 'approvals') {
    await loadApprovalsList();
  } else {
    await loadPoints();
  }
  bindEvents();
}

// Check Cloudinary / Local Storage status
async function checkConfig() {
  try {
    const config = await API.getConfig();
    if (config.adminEmail) {
      state.adminEmail = config.adminEmail;
    }
    if (config.cloudinaryEnabled) {
      elements.storageBadge.className = 'storage-badge active';
      elements.storageBadgeText.textContent = 'Cloudinary Active ☁️';
    } else {
      elements.storageBadge.className = 'storage-badge';
      elements.storageBadgeText.textContent = 'Local Storage (/uploads)';
    }
  } catch (err) {
    console.warn('Config check failed', err);
  }
}

// Load Badges Stats
async function loadStats() {
  try {
    const stats = await API.getStats();
    elements.badgePending.textContent = stats.pending || 0;
    elements.badgeProcess.textContent = stats.process || 0;
    elements.badgeDone.textContent = stats.done || 0;
    elements.badgeAll.textContent = stats.total || 0;
    if (elements.badgeApprovals) {
      elements.badgeApprovals.textContent = stats.pendingUsers || 0;
    }
  } catch (err) {
    console.error('Stats load failed', err);
  }
}

// Switch Tab logic (Points vs Approvals)
function switchTab(targetTab) {
  state.activeTab = targetTab;
  document.querySelectorAll('.tab-button').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === targetTab);
  });

  if (targetTab === 'approvals') {
    elements.approvalsSection.style.display = 'flex';
    elements.pointsList.style.display = 'none';
    elements.addPointCard.style.display = 'none';
    elements.searchWrap.style.display = 'none';
    loadApprovalsList();
  } else {
    elements.approvalsSection.style.display = 'none';
    elements.pointsList.style.display = 'flex';
    elements.addPointCard.style.display = 'flex';
    elements.searchWrap.style.display = 'block';
    loadPoints();
  }
}

// Load testing points for active tab
async function loadPoints() {
  try {
    const points = await API.getPoints({
      status: state.activeTab,
      search: state.searchQuery
    });
    state.points = points;
    renderPointsList();
  } catch (err) {
    console.error('Load points failed', err);
    elements.pointsList.innerHTML = `<div class="empty-box">Error loading points: ${escapeHtml(err.message)}</div>`;
  }
}

// Render Testing Points Cards
function renderPointsList() {
  elements.pointsList.innerHTML = '';

  if (state.points.length === 0) {
    const tabNames = {
      pending: 'Pending',
      process: 'In Process',
      done: 'Checked / Done',
      all: 'All'
    };
    elements.pointsList.innerHTML = `
      <div class="empty-box">
        <div style="font-size: 1.5rem;">📂</div>
        <div style="font-weight: 600; font-size: 1rem; color: #334155;">Koi testing point nahi hai</div>
        <div style="font-size: 0.85rem;">"${tabNames[state.activeTab] || state.activeTab}" tab me koi testing point nahi mila. Upar se naya testing point add karein!</div>
      </div>
    `;
    return;
  }

  state.points.forEach(point => {
    const card = createPointCard(point);
    elements.pointsList.appendChild(card);
  });
}

// Create Card Element
function createPointCard(point) {
  const card = document.createElement('div');
  card.className = 'point-card';

  // Normalize status
  let statusKey = (point.status || 'pending').toLowerCase();
  if (statusKey === 'new') statusKey = 'pending';
  if (statusKey === 'in_progress' || statusKey === 'retest') statusKey = 'process';

  const statusLabels = {
    pending: { label: '⏳ Pending / To Test', class: 'pending' },
    process: { label: '⚡ In Process', class: 'process' },
    done: { label: '✅ Checked & Done', class: 'done' }
  };
  const currentStatusInfo = statusLabels[statusKey] || statusLabels.pending;

  // Attached Image Preview inside Card
  let imagePreviewHtml = '';
  if (point.attachments && point.attachments.length > 0) {
    const mainImg = point.attachments[0];
    imagePreviewHtml = `
      <div class="card-image-box">
        <div class="card-image-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Attached Screenshot (Click to zoom):
        </div>
        <img src="${escapeHtml(mainImg.url)}" class="card-image-img" alt="screenshot" onclick="openLightbox('${escapeHtml(mainImg.url)}')">
      </div>
    `;
  }

  // Action Buttons according to status
  let actionButtonsHtml = '';
  if (statusKey === 'pending') {
    actionButtonsHtml = `
      <button class="btn-action-process" onclick="changePointStatus('${point.id}', 'process')">
        <span>⚡ Start Process (Move to Process) ➔</span>
      </button>
    `;
  } else if (statusKey === 'process') {
    actionButtonsHtml = `
      <button class="btn-action-done" onclick="changePointStatus('${point.id}', 'done')">
        <span>✓ Checked / Done (Mark Done) ➔</span>
      </button>
      <button class="btn-action-reopen" onclick="changePointStatus('${point.id}', 'pending')">
        <span>↩ Move back to Pending</span>
      </button>
    `;
  } else if (statusKey === 'done') {
    actionButtonsHtml = `
      <span style="font-size: 0.85rem; font-weight: 700; color: #059669; display: flex; align-items: center; gap: 0.35rem;">
        ✓ Testing Checked &amp; Completed!
      </span>
      <button class="btn-action-reopen" onclick="changePointStatus('${point.id}', 'process')">
        <span>↩ Reopen to Process</span>
      </button>
    `;
  }

  // Delete button permissions: Admin can delete any point; User can delete own point
  const isAdmin = state.currentUser && state.currentUser.role === 'Admin';
  const isOwner = state.currentUser && state.currentUser.name === point.createdBy;
  const canDelete = isAdmin || isOwner;

  const deleteBtnHtml = canDelete ? `
    <button class="btn-delete" title="Delete Point" onclick="deletePoint('${point.id}')">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    </button>
  ` : '';

  // Comments List HTML
  const comments = point.comments || [];
  let commentsHtml = '';
  if (comments.length > 0) {
    commentsHtml = comments.map(c => {
      let imgHtml = '';
      if (c.attachments && c.attachments.length > 0) {
        imgHtml = `<img src="${escapeHtml(c.attachments[0].url)}" class="comment-img-thumb" alt="comment img" onclick="openLightbox('${escapeHtml(c.attachments[0].url)}')">`;
      }
      return `
        <div class="comment-bubble">
          <div class="comment-top">
            <div>
              <span class="comment-author">${escapeHtml(c.author || 'Team Member')}</span>
              <span class="comment-role-tag">${escapeHtml(c.role || 'Member')}</span>
            </div>
            <span class="comment-time">${formatDate(c.createdAt)}</span>
          </div>
          <div class="comment-text">${escapeHtml(c.text)}</div>
          ${imgHtml}
        </div>
      `;
    }).join('');
  } else {
    commentsHtml = `<div style="font-size: 0.82rem; color: #94a3b8; padding: 0.3rem 0;">Koi comment nahi hai. Niche se developer fix ya tester review daalein.</div>`;
  }

  // Pre-fill comment author and role with logged in user
  const commentAuthorVal = state.currentUser ? state.currentUser.name : (localStorage.getItem('tester_user_name') || '');
  const isDev = state.currentUser && state.currentUser.role === 'Developer';

  card.innerHTML = `
    <!-- Card Header -->
    <div class="card-header">
      <div class="card-header-left">
        <span class="card-id">${escapeHtml(point.id)}</span>
        <span class="badge-status ${currentStatusInfo.class}">${currentStatusInfo.label}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="card-author-info">By: <strong>${escapeHtml(point.createdBy || 'Staff')}</strong> • ${formatDate(point.createdAt)}</span>
        ${deleteBtnHtml}
      </div>
    </div>

    <!-- Card Main Body -->
    <div class="card-body">
      <div class="point-text">${escapeHtml(point.description || point.title || '')}</div>
      ${imagePreviewHtml}
    </div>

    <!-- Action Bar (Buttons: Start Process / Mark Done) -->
    <div class="card-actions-bar">
      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        ${actionButtonsHtml}
      </div>
      <div style="font-size: 0.78rem; color: #94a3b8;">
        Updated: ${formatDate(point.updatedAt || point.createdAt)}
      </div>
    </div>

    <!-- Inline Comments Section -->
    <div class="card-comments-section">
      <div class="comments-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Comments &amp; Updates (${comments.length})</span>
      </div>

      <div class="comments-list">
        ${commentsHtml}
      </div>

      <!-- Quick Comment Form -->
      <form class="add-comment-box" onsubmit="handleCommentSubmit(event, '${point.id}')">
        <div class="comment-input-row">
          <input type="text" class="name-input comment-author-input" name="commentAuthor" placeholder="Aapka Naam" value="${escapeHtml(commentAuthorVal)}" required>
          <select name="commentRole" class="comment-role-select">
            <option value="Developer" ${isDev ? 'selected' : ''}>🛠️ Dev</option>
            <option value="Staff/Tester" ${!isDev ? 'selected' : ''}>🧪 Tester</option>
          </select>
        </div>
        <textarea name="commentText" class="comment-input-textarea" placeholder="Developer correction ya tester reply likhein..." required></textarea>
        
        <div class="comment-form-actions">
          <label class="attach-btn-label comment-attach-label" title="Attach Image with comment">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Attach Photo</span>
            <input type="file" name="commentImage" accept="image/*" style="display: none;" onchange="handleCommentFileChange(this)">
          </label>

          <button type="submit" class="comment-submit-btn">Post Comment</button>
        </div>
      </form>
    </div>
  `;

  return card;
}

// 1-Click Status Change (Pending -> Process -> Done)
async function changePointStatus(id, newStatus) {
  try {
    const updatedBy = state.currentUser ? state.currentUser.name : (localStorage.getItem('tester_user_name') || 'Team Member');
    const updated = await API.updatePoint(id, {
      status: newStatus,
      updatedBy: updatedBy
    });

    const statusMsg = {
      process: 'Point In Process me shift ho gaya! ⚡',
      done: 'Point Checked & Done me shift ho gaya! ✅',
      pending: 'Point wapas Pending me aa gaya! ⏳'
    };
    showToast(statusMsg[newStatus] || `Status updated to ${newStatus}`);

    await loadStats();
    await loadPoints();
  } catch (err) {
    showToast('Error updating status: ' + err.message);
  }
}

// Handle Comment Submission directly inside card
async function handleCommentSubmit(event, pointId) {
  event.preventDefault();
  const form = event.target;
  const author = form.elements['commentAuthor'].value.trim();
  const role = form.elements['commentRole'].value;
  const text = form.elements['commentText'].value.trim();
  const fileInput = form.elements['commentImage'];

  if (!text && (!fileInput.files || fileInput.files.length === 0)) return;

  if (author) localStorage.setItem('tester_user_name', author);

  const submitBtn = form.querySelector('.comment-submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Posting...';

  try {
    const formData = new FormData();
    formData.append('author', author || (state.currentUser ? state.currentUser.name : 'Team Member'));
    formData.append('role', role || (state.currentUser ? state.currentUser.role : 'Developer'));
    formData.append('text', text);

    if (fileInput.files && fileInput.files[0]) {
      formData.append('images', fileInput.files[0]);
    }

    await API.addComment(pointId, formData);
    showToast('Comment add ho gaya!');
    await loadPoints();
  } catch (err) {
    showToast('Comment error: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Post Comment';
  }
}

// Comment file change indicator
window.handleCommentFileChange = function(input) {
  if (input.files && input.files[0]) {
    input.parentElement.style.borderColor = '#4f46e5';
    input.parentElement.style.color = '#4f46e5';
    input.parentElement.title = `Attached: ${input.files[0].name}`;
  }
};

// Delete Point
async function deletePoint(id) {
  if (!confirm(`Kya aap testing point ${id} ko delete karna chahte hai?`)) return;
  try {
    await API.deletePoint(id);
    showToast(`Point ${id} deleted`);
    await loadStats();
    await loadPoints();
  } catch (err) {
    showToast('Delete error: ' + err.message);
  }
}

// ================= ADMIN APPROVALS SECTION =================

// Load and Render Admin User Approvals List
async function loadApprovalsList() {
  if (!state.currentUser || state.currentUser.role !== 'Admin') return;

  elements.approvalsList.innerHTML = `<div class="empty-box">Loading user requests...</div>`;

  try {
    const users = await API.getAdminUsers(state.currentUser.email);
    renderApprovalsList(users);
  } catch (err) {
    elements.approvalsList.innerHTML = `<div class="empty-box" style="color: #ef4444;">Error loading requests: ${escapeHtml(err.message)}</div>`;
  }
}

function renderApprovalsList(users) {
  elements.approvalsList.innerHTML = '';

  if (!users || users.length === 0) {
    elements.approvalsList.innerHTML = `
      <div class="empty-box">
        <div style="font-size: 1.5rem;">👥</div>
        <div style="font-weight: 600; color: #334155;">Koi user request nahi hai</div>
        <div style="font-size: 0.85rem;">Jab koi naya user sign up karega, uski request yahan dikhegi.</div>
      </div>
    `;
    return;
  }

  users.forEach(u => {
    const card = document.createElement('div');
    card.className = 'user-card';

    const isSuperAdmin = u.email && u.email.toLowerCase() === state.adminEmail.toLowerCase();
    const status = u.status || (isSuperAdmin ? 'approved' : 'pending');

    const statusPillLabels = {
      pending: { label: '⏳ Pending Approval', class: 'pending' },
      approved: { label: '✅ Approved', class: 'approved' },
      rejected: { label: '❌ Rejected', class: 'rejected' }
    };
    const pill = statusPillLabels[status] || statusPillLabels.pending;

    let actionsHtml = '';
    if (isSuperAdmin) {
      actionsHtml = `<span style="font-size: 0.8rem; font-weight: 700; color: #4f46e5;">🛡️ Main Admin Account</span>`;
    } else {
      if (status === 'pending') {
        actionsHtml = `
          <button class="btn-approve" onclick="handleUserApproval('${u.id}', 'approved')">
            ✓ Approve
          </button>
          <button class="btn-reject" onclick="handleUserApproval('${u.id}', 'rejected')">
            ✕ Reject
          </button>
          <button class="btn-delete-user" title="Delete User" onclick="handleDeleteUser('${u.id}')">
            🗑️
          </button>
        `;
      } else if (status === 'approved') {
        actionsHtml = `
          <button class="btn-reject" onclick="handleUserApproval('${u.id}', 'rejected')">
            ✕ Revoke Access
          </button>
          <button class="btn-delete-user" title="Delete User" onclick="handleDeleteUser('${u.id}')">
            🗑️
          </button>
        `;
      } else if (status === 'rejected') {
        actionsHtml = `
          <button class="btn-approve" onclick="handleUserApproval('${u.id}', 'approved')">
            ✓ Re-Approve
          </button>
          <button class="btn-delete-user" title="Delete User" onclick="handleDeleteUser('${u.id}')">
            🗑️
          </button>
        `;
      }
    }

    card.innerHTML = `
      <div class="user-card-left">
        <div class="user-card-avatar">
          ${u.role === 'Admin' ? '🛡️' : (u.role === 'Developer' ? '🛠️' : '🧪')}
        </div>
        <div class="user-card-info">
          <div class="user-card-name-row">
            <span class="user-card-name">${escapeHtml(u.name)}</span>
            <span class="user-role-badge ${u.role === 'Admin' ? 'role-admin' : (u.role === 'Developer' ? 'role-developer' : 'role-tester')}">${escapeHtml(u.role)}</span>
            <span class="status-pill ${pill.class}">${pill.label}</span>
          </div>
          <span class="user-card-email">${escapeHtml(u.email)}</span>
          <span class="user-card-meta">Registered: ${formatDate(u.createdAt)}</span>
        </div>
      </div>

      <div class="user-card-actions">
        ${actionsHtml}
      </div>
    `;

    elements.approvalsList.appendChild(card);
  });
}

// Global user approval handler
window.handleUserApproval = async function(userId, newStatus) {
  if (!state.currentUser || state.currentUser.role !== 'Admin') return;
  try {
    const res = await API.updateUserApproval(userId, newStatus, state.currentUser.email);
    showToast(newStatus === 'approved' ? 'User successfully approve ho gaya! Ab wo login kar sakta hai.' : 'User request reject ho gayi.');
    await loadStats();
    await loadApprovalsList();
  } catch (err) {
    showToast('Error: ' + err.message);
  }
};

// Global delete user handler
window.handleDeleteUser = async function(userId) {
  if (!confirm('Kya aap is user request ko permanently delete karna chahte hain?')) return;
  try {
    await API.deleteUser(userId, state.currentUser.email);
    showToast('User request delete kar di gayi!');
    await loadStats();
    await loadApprovalsList();
  } catch (err) {
    showToast('Error: ' + err.message);
  }
};

// Lightbox Open & Close
function openLightbox(url) {
  elements.lightboxImg.src = url;
  elements.lightbox.classList.add('active');
}

function closeLightbox() {
  elements.lightbox.classList.remove('active');
  elements.lightboxImg.src = '';
}

// Setup Event Listeners
function bindEvents() {
  // Switch to Login Tab
  elements.tabLoginBtn.addEventListener('click', () => {
    elements.tabLoginBtn.classList.add('active');
    elements.tabSignupBtn.classList.remove('active');
    elements.loginForm.style.display = 'flex';
    elements.signupForm.style.display = 'none';
    hideAuthAlert();
  });

  // Switch to Signup Tab
  elements.tabSignupBtn.addEventListener('click', () => {
    elements.tabSignupBtn.classList.add('active');
    elements.tabLoginBtn.classList.remove('active');
    elements.signupForm.style.display = 'flex';
    elements.loginForm.style.display = 'none';
    hideAuthAlert();
  });

  // Quick fill Admin Email
  elements.fillAdminBtn.addEventListener('click', () => {
    elements.loginEmail.value = state.adminEmail || 'admin@shifteronline.com';
    elements.loginPassword.focus();
    showAuthAlert(`Admin email fill kar diya! Apna admin password enter karein.`, 'success');
  });

  // Open Auth Modal from header (if logged out)
  elements.openAuthBtn.addEventListener('click', () => {
    hideAuthAlert();
    elements.authModal.classList.add('active');
  });

  // Logout button
  elements.logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('devtest_user');
    state.currentUser = null;
    updateUserUI();
    showToast('Aap successfully logout ho chuke hain');
  });

  // Login Form Submit
  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthAlert();

    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value.trim();

    if (!email || !password) {
      showAuthAlert('Email aur Password dono likhein!');
      return;
    }

    elements.submitLoginBtn.disabled = true;
    elements.submitLoginBtn.innerHTML = `<span>Checking credentials...</span>`;

    try {
      const res = await API.login(email, password);
      state.currentUser = res.user;
      localStorage.setItem('devtest_user', JSON.stringify(res.user));
      updateUserUI();
      showToast(`Swagat hai, ${res.user.name} (${res.user.role})!`);
      elements.loginForm.reset();
      await loadStats();
      if (state.activeTab === 'approvals') {
        await loadApprovalsList();
      } else {
        await loadPoints();
      }
    } catch (err) {
      showAuthAlert(err.message || 'Login failed. Password check karein.');
    } finally {
      elements.submitLoginBtn.disabled = false;
      elements.submitLoginBtn.innerHTML = `<span>Log In Karein ➔</span>`;
    }
  });

  // Signup Form Submit (With Admin Approval Requirement)
  elements.signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthAlert();

    const name = elements.signupName.value.trim();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value.trim();
    const role = elements.signupRole.value;

    if (!name || !email || !password) {
      showAuthAlert('Sabhi fields bharna zaroori hai!');
      return;
    }

    elements.submitSignupBtn.disabled = true;
    elements.submitSignupBtn.innerHTML = `<span>Creating account...</span>`;

    try {
      const res = await API.signup(name, email, password, role);

      // User registered - Now waiting for Admin Approval!
      elements.signupForm.reset();
      elements.tabLoginBtn.click();
      elements.loginEmail.value = email;
      elements.loginPassword.focus();

      showAuthAlert("✓ Successfully signed up! Kindly wait for admin approval before you can log in.", "success");
      showToast("Account ban gaya! Kindly wait for admin approval.");
      await loadStats();
    } catch (err) {
      showAuthAlert(err.message || 'Signup failed.');
    } finally {
      elements.submitSignupBtn.disabled = false;
      elements.submitSignupBtn.innerHTML = `<span>Create Account &amp; Login ➔</span>`;
    }
  });

  // Refresh Approvals button
  if (elements.refreshApprovalsBtn) {
    elements.refreshApprovalsBtn.addEventListener('click', async () => {
      await loadStats();
      await loadApprovalsList();
      showToast('Requests list refreshed!');
    });
  }

  // Tab Switch (Pending -> Process -> Done -> All -> Approvals)
  elements.statusTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-button');
    if (!btn) return;
    const targetTab = btn.dataset.tab;
    switchTab(targetTab);
  });

  // Search Input (Live debounce)
  let searchTimer;
  elements.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.searchQuery = elements.searchInput.value.trim();
      loadPoints();
    }, 250);
  });

  // Image File Picker for New Testing Point
  elements.inputPointImage.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      state.selectedImageFile = file;
      elements.imagePreviewThumb.src = URL.createObjectURL(file);
      elements.imagePreviewName.textContent = file.name;
      elements.imagePreviewBar.style.display = 'flex';
    }
  });

  // Remove Selected Image
  elements.removeImageBtn.addEventListener('click', () => {
    state.selectedImageFile = null;
    elements.inputPointImage.value = '';
    elements.imagePreviewBar.style.display = 'none';
  });

  // Submit New Testing Point
  elements.submitPointBtn.addEventListener('click', async () => {
    if (!state.currentUser) {
      elements.authModal.classList.add('active');
      showAuthAlert('Testing point add karne ke liye pehle Login ya Sign Up karein!');
      return;
    }

    const text = elements.inputPointText.value.trim();
    const author = elements.inputAuthor.value.trim() || (state.currentUser ? state.currentUser.name : 'Staff/Tester');

    if (!text && !state.selectedImageFile) {
      alert('Kripya testing point ka description likhein ya screenshot lagayein!');
      elements.inputPointText.focus();
      return;
    }

    elements.submitPointBtn.disabled = true;
    elements.submitPointBtn.innerHTML = `<span>Saving...</span>`;

    try {
      const formData = new FormData();
      // First line as title, whole text as description
      const lines = text.split('\n');
      formData.append('title', lines[0].substring(0, 80));
      formData.append('description', text);
      formData.append('createdBy', author);
      formData.append('status', 'pending');

      if (state.selectedImageFile) {
        formData.append('images', state.selectedImageFile);
      }

      if (author) localStorage.setItem('tester_user_name', author);

      const created = await API.createPoint(formData);
      showToast(`Testing Point ${created.id} add ho gaya!`);

      // Reset form
      elements.inputPointText.value = '';
      state.selectedImageFile = null;
      elements.inputPointImage.value = '';
      elements.imagePreviewBar.style.display = 'none';

      // Switch to Pending tab so user sees it right away
      switchTab('pending');

      await loadStats();
      await loadPoints();
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      elements.submitPointBtn.disabled = false;
      elements.submitPointBtn.innerHTML = `<span>+ Testing Point Add Karein</span>`;
    }
  });

  // Reset Demo Data
  elements.resetDemoBtn.addEventListener('click', async () => {
    if (confirm('Sample demo testing points reset karein?')) {
      try {
        await API.resetDemo();
        showToast('Demo data reset ho gaya!');
        await loadStats();
        if (state.activeTab === 'approvals') {
          await loadApprovalsList();
        } else {
          await loadPoints();
        }
      } catch (err) {
        showToast('Reset error: ' + err.message);
      }
    }
  });

  // Lightbox Close
  elements.lightboxClose.addEventListener('click', closeLightbox);
  elements.lightbox.addEventListener('click', (e) => {
    if (e.target === elements.lightbox) closeLightbox();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

// Start
document.addEventListener('DOMContentLoaded', init);
