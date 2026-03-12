/**
 * utils.js
 * Pure utility/helper functions.
 * No side effects, no state.
 */

const Utils = {
  /**
   * Format a decimal (0–1) as percentage string.
   * @param {number|null} v
   * @returns {string}
   */
  pct(v) {
    return v != null ? (v * 100).toFixed(2) + '%' : '—';
  },

  /**
   * Format an ISO timestamp to readable local date/time.
   * @param {string} ts
   * @returns {string}
   */
  fmtDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-MY') + ' ' +
           d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  },

  /**
   * Return the CSS badge class for a numeric risk level.
   * @param {number} pred  0=Low, 1=Medium, 2=High
   * @returns {string}
   */
  riskBadge(pred) {
    return pred === 0 ? 'badge-green' : pred === 1 ? 'badge-orange' : 'badge-red';
  },

  /**
   * Return the CSS badge class for a risk label string.
   * @param {string} label
   * @returns {string}
   */
  riskBadgeStr(label) {
    if (label === 'Low Risk')    return 'badge-green';
    if (label === 'Medium Risk') return 'badge-orange';
    return 'badge-red';
  },

  /**
   * Return result icon emoji based on color key.
   * @param {string} color  'green' | 'orange' | 'red'
   * @returns {string}
   */
  resultIcon(color) {
    return color === 'green' ? '✅' : color === 'orange' ? '⚠️' : '🚨';
  },

  /**
   * Return bar fill colour for a probability label.
   * @param {string} label
   * @returns {string}
   */
  probColor(label) {
    if (label === 'Low Risk')    return '#10b981';
    if (label === 'Medium Risk') return '#f59e0b';
    return '#ef4444';
  },

  /**
   * Returns an empty prediction form object with new realistic fields.
   * @returns {Object}
   */
  emptyPredForm() {
    return {
      student_name:        '',
      student_id:          '',
      attendance_rate:     '',
      midterm_score:       '',
      assignment_avg:      '',
      quiz_avg:            '',
      lab_score:           '',
      participation_score: '',
      late_submissions:    '',
      previous_cgpa:       ''
    };
  },

  /**
   * Returns an empty user form object.
   * @returns {Object}
   */
  emptyUserForm() {
    return {
      username:  '',
      full_name: '',
      email:     '',
      role:      'user',
      password:  '',
      active:    true
    };
  }
};
