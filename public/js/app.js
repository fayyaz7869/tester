// Simple & Attractive Testing Point Hub JavaScript

const state = {
  activeTab: 'pending', // 'pending', 'process', 'done', 'all'
  searchQuery: '',
  points: [],
  selectedImageFile: null
};

// DOM References
const elements = {
  storageBadge: document.getElementById('storageBadge'),
  storageBadgeText: document.getElementById('storageBadgeText'),
  resetDemoBtn: document.getElementById('resetDemoBtn'),

  // Add Point Form
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
  searchInput: document.getElementById('searchInput'),

  // List Container
  pointsList: document.getElementById('pointsList'),

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

// Initialize Application
async function init() {
  // Load saved author name
  const savedName = localStorage.getItem('tester_user_name');
  if (savedName) elements.inputAuthor.value = savedName;

  await checkConfig();
  await loadStats();
  await loadPoints();
  bindEvents();
}

// Check Cloudinary / Local Storage status
async function checkConfig() {
  try {
    const config = await API.getConfig();
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
  } catch (err) {
    console.error('Stats load failed', err);
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

  card.innerHTML = `
    <!-- Card Header -->
    <div class="card-header">
      <div class="card-header-left">
        <span class="card-id">${escapeHtml(point.id)}</span>
        <span class="badge-status ${currentStatusInfo.class}">${currentStatusInfo.label}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="card-author-info">By: <strong>${escapeHtml(point.createdBy || 'Staff')}</strong> • ${formatDate(point.createdAt)}</span>
        <button class="btn-delete" title="Delete Point" onclick="deletePoint('${point.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
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
          <input type="text" class="name-input comment-author-input" name="commentAuthor" placeholder="Aapka Naam" value="${escapeHtml(localStorage.getItem('tester_user_name') || '')}">
          <select name="commentRole" class="comment-role-select">
            <option value="Developer">🛠️ Dev</option>
            <option value="Staff/Tester">🧪 Tester</option>
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
    const updated = await API.updatePoint(id, {
      status: newStatus,
      updatedBy: localStorage.getItem('tester_user_name') || 'Team Member'
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
    formData.append('author', author || 'Team Member');
    formData.append('role', role || 'Developer');
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
    submitBtn.textContent = 'Post';
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
  // Tab Switch (Pending -> Process -> Done -> All)
  elements.statusTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-button');
    if (!btn) return;

    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.activeTab = btn.dataset.tab;
    loadPoints();
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
    const text = elements.inputPointText.value.trim();
    const author = elements.inputAuthor.value.trim() || 'Staff/Tester';

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
      state.activeTab = 'pending';
      document.querySelectorAll('.tab-button').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === 'pending');
      });

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
        await loadPoints();
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
