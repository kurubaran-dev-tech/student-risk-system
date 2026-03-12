/**
 * ApiService.js
 * Handles all HTTP communication with the Flask backend.
 * Single Responsibility: API calls only.
 */

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  _getToken() {
    return localStorage.getItem('token');
  }

  async _request(path, opts = {}) {
    const token = this._getToken();
    const res = await fetch(this.baseUrl + path, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      ...opts
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  }

  // ─── AUTH ──────────────────────────────────────
  login(username, password) {
    return this._request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  logout() {
    return this._request('/logout', { method: 'POST' });
  }

  getMe() {
    return this._request('/me');
  }

  // ─── PREDICTIONS ───────────────────────────────
  predict(formData) {
    return this._request('/predict', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  }

  getPredictionHistory() {
    return this._request('/predictions/history');
  }

  // ─── ADMIN ─────────────────────────────────────
  getAdminStats() {
    return this._request('/admin/stats');
  }

  getUsers() {
    return this._request('/admin/users');
  }

  createUser(userData) {
    return this._request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  updateUser(userId, userData) {
    return this._request('/admin/users/' + userId, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  deactivateUser(userId) {
    return this._request('/admin/users/' + userId, { method: 'DELETE' });
  }

  getDataset() {
    return this._request('/admin/dataset');
  }

  getEvaluation() {
    return this._request('/admin/evaluation');
  }

  getModelMeta() {
    return this._request('/admin/model');
  }
}
