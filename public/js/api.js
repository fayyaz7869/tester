// API Client for QA & Dev Testing Hub
const API_BASE = '/api';

const API = {
  // Fetch system configuration (Cloudinary status)
  async getConfig() {
    const res = await fetch(`${API_BASE}/config`);
    return res.json();
  },

  // Fetch summary statistics
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },

  // Fetch testing points with optional filters
  async getPoints(filters = {}) {
    const query = new URLSearchParams();
    if (filters.status && filters.status !== 'all') query.append('status', filters.status);
    if (filters.priority && filters.priority !== 'all') query.append('priority', filters.priority);
    if (filters.module && filters.module !== 'all') query.append('module', filters.module);
    if (filters.search) query.append('search', filters.search);

    const res = await fetch(`${API_BASE}/points?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch testing points');
    return res.json();
  },

  // Fetch single testing point by ID
  async getPointById(id) {
    const res = await fetch(`${API_BASE}/points/${id}`);
    if (!res.ok) throw new Error('Failed to fetch testing point details');
    return res.json();
  },

  // Create new testing point (Multipart form data for image attachments)
  async createPoint(formData) {
    const res = await fetch(`${API_BASE}/points`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create point');
    }
    return res.json();
  },

  // Update testing point attributes (status, priority, assignee, etc.)
  async updatePoint(id, data) {
    const res = await fetch(`${API_BASE}/points/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update point');
    }
    return res.json();
  },

  // Add comment with optional image attachments
  async addComment(id, formData) {
    const res = await fetch(`${API_BASE}/points/${id}/comments`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add comment');
    }
    return res.json();
  },

  // Delete testing point
  async deletePoint(id) {
    const res = await fetch(`${API_BASE}/points/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete point');
    return res.json();
  },

  // Reset demo data
  async resetDemo() {
    const res = await fetch(`${API_BASE}/reset-demo`, {
      method: 'POST'
    });
    return res.json();
  }
};
