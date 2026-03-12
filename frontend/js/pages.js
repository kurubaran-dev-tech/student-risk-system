/**
 * pages.js
 * Vue page-level logic separated by concern.
 * Each PageController manages one page's state and actions.
 */

// ─────────────────────────────────────────────────────
// DashboardPage
// Handles: stats loading, recent predictions, chart
// ─────────────────────────────────────────────────────
class DashboardPage {
  constructor(api, chartService, vueRefs) {
    this.api   = api;
    this.chart = chartService;
    this.refs  = vueRefs; // { dashStats, recentPredictions }
  }

  async load(isAdmin) {
    try {
      if (isAdmin) {
        this.refs.dashStats.value = await this.api.getAdminStats();
      }
      const h = await this.api.getPredictionHistory();
      this.refs.recentPredictions.value = h.predictions || [];
    } catch(e) {
      console.error('Dashboard load error:', e);
    }
  }

  renderChart(canvasId) {
    const s = this.refs.dashStats.value?.predictions_by_risk || {};
    this.chart.renderDashChart(canvasId, s);
  }
}

// ─────────────────────────────────────────────────────
// PredictPage
// Handles: form state, submission, result display
// ─────────────────────────────────────────────────────
class PredictPage {
  constructor(api, vueRefs) {
    this.api  = api;
    this.refs = vueRefs; // { predForm, predErrors, predLoading, predResult, predAlert }
  }

  reset() {
    this.refs.predForm.value    = Utils.emptyPredForm();
    this.refs.predErrors.value  = {};
    this.refs.predResult.value  = null;
    this.refs.predAlert.value   = null;
  }

  async submit() {
    this.refs.predErrors.value = {};
    this.refs.predAlert.value  = null;
    this.refs.predLoading.value = true;
    try {
      const result = await this.api.predict(this.refs.predForm.value);
      this.refs.predResult.value = result;
      this.refs.predAlert.value  = { type: 'success', msg: '✅ Prediction submitted successfully!' };
      return result;
    } catch(e) {
      if (e.errors) this.refs.predErrors.value = e.errors;
      else this.refs.predAlert.value = { type: 'error', msg: e.error || 'Prediction failed.' };
      return null;
    } finally {
      this.refs.predLoading.value = false;
    }
  }
}

// ─────────────────────────────────────────────────────
// HistoryPage
// Handles: fetching and displaying prediction history
// ─────────────────────────────────────────────────────
class HistoryPage {
  constructor(api, vueRefs) {
    this.api  = api;
    this.refs = vueRefs; // { historyList, historyLoading }
  }

  async load() {
    this.refs.historyLoading.value = true;
    try {
      const h = await this.api.getPredictionHistory();
      this.refs.historyList.value = h.predictions || [];
    } catch(e) {
      console.error('History load error:', e);
    } finally {
      this.refs.historyLoading.value = false;
    }
  }
}

// ─────────────────────────────────────────────────────
// UserManagementPage
// Handles: CRUD operations for users
// ─────────────────────────────────────────────────────
class UserManagementPage {
  constructor(api, vueRefs) {
    this.api  = api;
    this.refs = vueRefs;
    // refs: { userList, usersLoading, showUserModal,
    //         editingUser, userForm, userSaving, userModalAlert }
  }

  async load() {
    this.refs.usersLoading.value = true;
    try {
      this.refs.userList.value = (await this.api.getUsers()).users || [];
    } catch(e) {
      console.error('Users load error:', e);
    } finally {
      this.refs.usersLoading.value = false;
    }
  }

  openCreate() {
    this.refs.editingUser.value    = null;
    this.refs.userForm.value       = Utils.emptyUserForm();
    this.refs.userModalAlert.value = null;
    this.refs.showUserModal.value  = true;
  }

  openEdit(user) {
    this.refs.editingUser.value    = user;
    this.refs.userForm.value       = { ...user, password: '' };
    this.refs.userModalAlert.value = null;
    this.refs.showUserModal.value  = true;
  }

  async save() {
    this.refs.userSaving.value     = true;
    this.refs.userModalAlert.value = null;
    try {
      if (this.refs.editingUser.value) {
        await this.api.updateUser(
          this.refs.editingUser.value.id,
          this.refs.userForm.value
        );
        this.refs.userModalAlert.value = { type: 'success', msg: 'User updated successfully!' };
      } else {
        await this.api.createUser(this.refs.userForm.value);
        this.refs.userModalAlert.value = { type: 'success', msg: 'User created successfully!' };
      }
      await this.load();
      setTimeout(() => { this.refs.showUserModal.value = false; }, 1200);
    } catch(e) {
      this.refs.userModalAlert.value = { type: 'error', msg: e.error || 'Failed to save user.' };
    } finally {
      this.refs.userSaving.value = false;
    }
  }

  async deactivate(user) {
    if (!confirm(`Deactivate user "${user.username}"?`)) return;
    await this.api.deactivateUser(user.id);
    await this.load();
  }
}

// ─────────────────────────────────────────────────────
// ModelEvalPage
// Handles: loading evaluation data, charts, tabs
// ─────────────────────────────────────────────────────
class ModelEvalPage {
  constructor(api, chartService, vueRefs) {
    this.api   = api;
    this.chart = chartService;
    this.refs  = vueRefs; // { evalData, modelMeta, evalTab }
  }

  async load() {
    try {
      this.refs.evalData.value  = await this.api.getEvaluation();
      this.refs.modelMeta.value = await this.api.getModelMeta();
    } catch(e) {
      console.error('Eval load error:', e);
    }
  }

  renderCompChart(canvasId) {
    this.chart.renderModelCompChart(canvasId, this.refs.evalData.value);
  }

  getBestEval() {
    if (!this.refs.evalData.value || !this.refs.modelMeta.value) return null;
    return this.refs.evalData.value[this.refs.modelMeta.value.best_model_name];
  }

  getPerClassMetrics() {
    const best = this.getBestEval();
    if (!best) return {};
    const r = best.classification_report;
    return {
      'Low Risk':    r['Low Risk'],
      'Medium Risk': r['Medium Risk'],
      'High Risk':   r['High Risk']
    };
  }
}
